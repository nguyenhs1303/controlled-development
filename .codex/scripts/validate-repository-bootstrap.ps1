[CmdletBinding()]
param(
    [string]$Repository
)

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$codexDirectory = Split-Path -Parent $scriptDirectory
$defaultRepository = Split-Path -Parent $codexDirectory
$repositoryRoot = if ($Repository) {
    [IO.Path]::GetFullPath($Repository)
} else {
    [IO.Path]::GetFullPath($defaultRepository)
}

$problemList = [Collections.Generic.List[string]]::new()
$statePath = Join-Path $repositoryRoot ".codex\repository-bootstrap.json"
$allowedStatuses = @("pending", "discovering", "needs-input", "writing", "validating", "complete")
$allowedCompletedPhases = @($null, "preflight", "discovery", "input", "writing", "validation")
$legalCompletedPhases = @{
    discovering = @("preflight", "discovery", "input", "validation")
    "needs-input" = @("discovery")
    writing = @("discovery", "input")
    validating = @("writing")
    complete = @("validation")
}
$requiredInstructionFiles = @(
    ".codex/instructions/repository/overview.md",
    ".codex/instructions/repository/architecture.md",
    ".codex/instructions/repository/code-conventions.md",
    ".codex/instructions/repository/local-development.md",
    ".codex/instructions/repository/performance.md"
)
$requiredReceiptCommands = @(
    ".codex/scripts/validate-structure.ps1",
    ".codex/scripts/validate-references.ps1",
    ".codex/scripts/validate-portability.ps1"
)

if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) {
    Write-Error "Missing bootstrap state: .codex/repository-bootstrap.json"
    exit 1
}

try {
    $rawState = Get-Content -Raw -LiteralPath $statePath
    $state = $rawState | ConvertFrom-Json
} catch {
    Write-Error "Bootstrap state is not valid JSON: $($_.Exception.Message)"
    exit 1
}

foreach ($field in @("schemaVersion", "status", "lastCompletedPhase", "evidence", "unresolvedQuestions", "generatedFiles", "validationReceipts", "updatedAt")) {
    if (-not ($state.PSObject.Properties.Name -contains $field)) {
        $problemList.Add("Bootstrap state missing field: $field")
    }
}

if ($state.schemaVersion -ne 1) {
    $problemList.Add("Bootstrap state schemaVersion must be 1")
}
if ($allowedStatuses -notcontains $state.status) {
    $problemList.Add("Bootstrap state status is invalid: $($state.status)")
}
if ($allowedCompletedPhases -notcontains $state.lastCompletedPhase) {
    $problemList.Add("Bootstrap state lastCompletedPhase is invalid: $($state.lastCompletedPhase)")
} elseif ($state.status -eq "pending" -and $null -ne $state.lastCompletedPhase) {
    $problemList.Add("Bootstrap state pending requires no completed phase")
} elseif ($legalCompletedPhases.ContainsKey([string]$state.status) -and
    $legalCompletedPhases[[string]$state.status] -notcontains $state.lastCompletedPhase) {
    $problemList.Add("Bootstrap state $($state.status) cannot follow completed phase $($state.lastCompletedPhase)")
}
if ($rawState -match '(?i)(?:^|[^A-Za-z0-9])[A-Z]:[\\/]') {
    $problemList.Add("Bootstrap state must not contain absolute Windows paths")
}

foreach ($evidence in @($state.evidence)) {
    if ([string]::IsNullOrWhiteSpace($evidence.claim) -or
        [string]::IsNullOrWhiteSpace($evidence.source) -or
        @("confirmed", "user-confirmed") -notcontains $evidence.kind) {
        $problemList.Add("Each evidence record requires claim, project-relative source, and confirmed or user-confirmed kind")
        continue
    }
    if ([IO.Path]::IsPathRooted($evidence.source) -or $evidence.source -match '(^|[\\/])\.\.([\\/]|$)') {
        $problemList.Add("Evidence source must be project-relative: $($evidence.source)")
    } elseif ($evidence.kind -eq "user-confirmed" -and $evidence.source -notlike "user:*") {
        $problemList.Add("User-confirmed evidence source must start with user: $($evidence.source)")
    } elseif ($evidence.kind -eq "confirmed" -and $evidence.source -like "user:*") {
        $problemList.Add("Repository-confirmed evidence cannot use a user source: $($evidence.source)")
    }
}

foreach ($question in @($state.unresolvedQuestions)) {
    if ([string]::IsNullOrWhiteSpace($question.id) -or
        [string]::IsNullOrWhiteSpace($question.question) -or
        [string]::IsNullOrWhiteSpace($question.impact) -or
        @("open", "resolved") -notcontains $question.status) {
        $problemList.Add("Each unresolved question requires id, question, impact, and open or resolved status")
    }
}

foreach ($generatedFile in @($state.generatedFiles)) {
    if ([string]::IsNullOrWhiteSpace($generatedFile) -or
        [IO.Path]::IsPathRooted($generatedFile) -or
        $generatedFile -match '(^|[\\/])\.\.([\\/]|$)' -or
        ($generatedFile -ne "AGENTS.md" -and $generatedFile -notlike ".codex/*")) {
        $problemList.Add("Generated file is outside bootstrap scope: $generatedFile")
    }
}

foreach ($receipt in @($state.validationReceipts)) {
    if ([string]::IsNullOrWhiteSpace($receipt.command) -or
        @("PASS", "FAIL", "NOT RUN") -notcontains $receipt.status) {
        $problemList.Add("Each validation receipt requires command and PASS, FAIL, or NOT RUN status")
    } elseif ([IO.Path]::IsPathRooted($receipt.command) -or $receipt.command -match '(^|[\\/])\.\.([\\/]|$)') {
        $problemList.Add("Validation receipt command must be project-relative: $($receipt.command)")
    }
}

if (-not [string]::IsNullOrWhiteSpace($state.updatedAt) -and $state.status -ne "complete") {
    $optionalTimestamp = [DateTimeOffset]::MinValue
    if (-not [DateTimeOffset]::TryParse($state.updatedAt, [ref]$optionalTimestamp)) {
        $problemList.Add("updatedAt must be null or an ISO timestamp")
    }
}

if ($state.status -eq "needs-input" -and @($state.unresolvedQuestions | Where-Object status -eq "open").Count -eq 0) {
    $problemList.Add("needs-input status requires at least one open question")
}

if ($state.status -eq "complete") {
    if (@($state.unresolvedQuestions | Where-Object status -eq "open").Count -gt 0) {
        $problemList.Add("complete status cannot retain open questions")
    }
    $parsedTimestamp = [DateTimeOffset]::MinValue
    if ([string]::IsNullOrWhiteSpace($state.updatedAt) -or -not [DateTimeOffset]::TryParse($state.updatedAt, [ref]$parsedTimestamp)) {
        $problemList.Add("complete status requires an ISO updatedAt timestamp")
    }

    foreach ($relativePath in $requiredInstructionFiles) {
        $nativePath = $relativePath.Replace('/', [IO.Path]::DirectorySeparatorChar)
        $fullPath = Join-Path $repositoryRoot $nativePath
        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            $problemList.Add("Missing completed instruction file: $relativePath")
            continue
        }
        if (@($state.generatedFiles) -notcontains $relativePath) {
            $problemList.Add("Completed bootstrap must record generated file: $relativePath")
        }
        $contents = Get-Content -Raw -LiteralPath $fullPath
        if ($contents -match 'REPOSITORY-BOOTSTRAP-PENDING') {
            $problemList.Add("Starter placeholder remains in completed file: $relativePath")
        }
    }

    foreach ($requiredCommand in $requiredReceiptCommands) {
        $receipt = @($state.validationReceipts | Where-Object { $_.command -eq $requiredCommand -and $_.status -eq "PASS" })
        if ($receipt.Count -eq 0) {
            $problemList.Add("Completed bootstrap requires PASS receipt for $requiredCommand")
        }
    }
}

if ($problemList.Count -gt 0) {
    $problemList | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Repository bootstrap validation passed"
