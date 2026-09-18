[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$codexDirectory = Split-Path -Parent $scriptDirectory
$repository = Split-Path -Parent $codexDirectory
$targetList = @(
    (Join-Path $repository "AGENTS.md"),
    (Join-Path $codexDirectory "README.md"),
    (Join-Path $codexDirectory "config.toml"),
    (Join-Path $codexDirectory "agents"),
    (Join-Path $codexDirectory "instructions"),
    (Join-Path $codexDirectory "templates"),
    (Join-Path $codexDirectory "scripts")
)
$absoluteWindowsPathPattern = '(?i)(?:^|[^A-Za-z0-9])[A-Z]:[\\/]'
$violationList = [Collections.Generic.List[string]]::new()

foreach ($target in $targetList) {
    if (-not (Test-Path -LiteralPath $target)) {
        continue
    }
    $matchList = & rg -l --pcre2 --hidden $absoluteWindowsPathPattern -- $target 2>$null
    foreach ($match in @($matchList)) {
        if ($match -ne $MyInvocation.MyCommand.Path) {
            $violationList.Add([IO.Path]::GetRelativePath($repository, $match))
        }
    }
}

if ($violationList.Count -gt 0) {
    $violationList | Sort-Object -Unique | ForEach-Object { Write-Error "Absolute path found in $_" }
    exit 1
}

Write-Output "Codex portability validation passed"
