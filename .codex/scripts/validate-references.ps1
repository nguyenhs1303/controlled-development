[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$codexDirectory = Split-Path -Parent $scriptDirectory
$repository = Split-Path -Parent $codexDirectory
$legacyPattern = "\.ai-workflow/changes/|\.codex/skills/"
$violationList = [Collections.Generic.List[string]]::new()

$activeTargetList = @(
    (Join-Path $repository "AGENTS.md"),
    (Join-Path $codexDirectory "agents"),
    (Join-Path $codexDirectory "instructions"),
    (Join-Path $codexDirectory "templates"),
    (Join-Path $codexDirectory "scripts")
)

foreach ($target in $activeTargetList) {
    if (-not (Test-Path -LiteralPath $target)) {
        continue
    }
    $matchList = & rg -l --pcre2 --hidden $legacyPattern $target 2>$null
    foreach ($match in @($matchList)) {
        if ($match -ne $MyInvocation.MyCommand.Path) {
            $violationList.Add([IO.Path]::GetRelativePath($repository, $match))
        }
    }
}

foreach ($legacyPath in @(".ai-workflow", ".codex\skills")) {
    if (Test-Path -LiteralPath (Join-Path $repository $legacyPath)) {
        $violationList.Add("Legacy source exists: $legacyPath")
    }
}

$workflowRoot = Join-Path $codexDirectory "workflows\changes"
foreach ($stateFile in Get-ChildItem -LiteralPath $workflowRoot -Filter "state.json" -Recurse -File) {
    $state = Get-Content -Raw -LiteralPath $stateFile.FullName | ConvertFrom-Json
    $expectedRoot = ".codex/workflows/changes/$($state.changeId)"
    if ($state.artifactRoot -ne $expectedRoot) {
        $relativeState = [IO.Path]::GetRelativePath($repository, $stateFile.FullName)
        $violationList.Add("Invalid artifactRoot in $relativeState")
    }
}

if ($violationList.Count -gt 0) {
    $violationList | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Active Codex reference validation passed"
