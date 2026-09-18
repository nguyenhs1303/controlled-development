[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceCodex = Split-Path -Parent $scriptDirectory
$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ("repository-bootstrap-" + [guid]::NewGuid().ToString("N"))

function Invoke-CheckedPowerShell {
    param(
        [Parameter(Mandatory = $true)]
        [string]$File,
        [string[]]$Arguments = @()
    )

    $output = & powershell -ExecutionPolicy Bypass -File $File @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "PowerShell script failed with exit code $LASTEXITCODE`: $File"
    }
    return $output
}

New-Item -ItemType Directory -Path $temporaryRoot | Out-Null

try {
    Copy-Item -LiteralPath $sourceCodex -Destination (Join-Path $temporaryRoot ".codex") -Recurse
    Set-Content -LiteralPath (Join-Path $temporaryRoot "package.json") -Value '{"name":"bootstrap-test"}' -Encoding utf8

    $initializer = Join-Path $temporaryRoot ".codex\scripts\initialize-repository.ps1"
    $firstInitialization = Invoke-CheckedPowerShell -File $initializer -Arguments @("-Destination", $temporaryRoot) |
        ConvertFrom-Json
    if ($firstInitialization.BootstrapStatus -ne "pending" -or
        -not $firstInitialization.RepositoryInstructionsRequireCustomization) {
        throw "Initializer did not report pending customization"
    }

    $agentsPath = Join-Path $temporaryRoot "AGENTS.md"
    $statePath = Join-Path $temporaryRoot ".codex\repository-bootstrap.json"
    if (-not (Test-Path -LiteralPath $agentsPath -PathType Leaf)) {
        throw "Initializer did not create AGENTS.md"
    }
    if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) {
        throw "Initializer did not create bootstrap state"
    }

    $stateHash = (Get-FileHash -LiteralPath $statePath -Algorithm SHA256).Hash
    Invoke-CheckedPowerShell -File $initializer -Arguments @("-Destination", $temporaryRoot) | Out-Null
    if ((Get-FileHash -LiteralPath $statePath -Algorithm SHA256).Hash -ne $stateHash) {
        throw "Initializer overwrote existing bootstrap state"
    }

    $validator = Join-Path $temporaryRoot ".codex\scripts\validate-repository-bootstrap.ps1"
    Invoke-CheckedPowerShell -File $validator -Arguments @("-Repository", $temporaryRoot) | Out-Null

    $instructionFiles = @(
        ".codex/instructions/repository/overview.md",
        ".codex/instructions/repository/architecture.md",
        ".codex/instructions/repository/code-conventions.md",
        ".codex/instructions/repository/local-development.md",
        ".codex/instructions/repository/performance.md"
    )
    foreach ($relativePath in $instructionFiles) {
        $nativePath = $relativePath.Replace('/', [IO.Path]::DirectorySeparatorChar)
        Set-Content -LiteralPath (Join-Path $temporaryRoot $nativePath) `
            -Value "# Initialized`n`nEvidence-backed repository instruction." -Encoding utf8
    }

    $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
    $state.status = "complete"
    $state.lastCompletedPhase = "validation"
    $state.evidence = @([PSCustomObject]@{
        claim = "Repository manifest inspected"
        source = "package.json"
        kind = "confirmed"
    })
    $state.unresolvedQuestions = @()
    $state.generatedFiles = $instructionFiles
    $state.validationReceipts = @(
        [PSCustomObject]@{ command = ".codex/scripts/validate-structure.ps1"; status = "PASS" },
        [PSCustomObject]@{ command = ".codex/scripts/validate-references.ps1"; status = "PASS" },
        [PSCustomObject]@{ command = ".codex/scripts/validate-portability.ps1"; status = "PASS" }
    )
    $state.updatedAt = "2026-09-17T00:00:00Z"
    $state | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $statePath -Encoding utf8

    Invoke-CheckedPowerShell -File $validator -Arguments @("-Repository", $temporaryRoot) | Out-Null
    $completedInitialization = Invoke-CheckedPowerShell -File $initializer -Arguments @("-Destination", $temporaryRoot) |
        ConvertFrom-Json
    if ($completedInitialization.BootstrapStatus -ne "complete" -or
        $completedInitialization.RepositoryInstructionsRequireCustomization) {
        throw "Initializer did not preserve completed bootstrap status"
    }
    Write-Output "Repository bootstrap integration test passed"
} finally {
    $resolvedTemporaryRoot = [IO.Path]::GetFullPath($temporaryRoot)
    $resolvedSystemTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($resolvedTemporaryRoot.StartsWith($resolvedSystemTemp, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedTemporaryRoot) -like "repository-bootstrap-*") {
        [IO.Directory]::Delete($resolvedTemporaryRoot, $true)
    }
}
