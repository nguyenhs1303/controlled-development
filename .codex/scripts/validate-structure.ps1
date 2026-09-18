[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$codexDirectory = Split-Path -Parent $scriptDirectory
$repository = Split-Path -Parent $codexDirectory

$requiredFiles = @(
    "AGENTS.md",
    ".codex\README.md",
    ".codex\config.toml",
    ".codex\templates\repository-bootstrap-state.json",
    ".codex\scripts\validate-repository-bootstrap.ps1",
    ".codex\instructions\common\working-rules.md",
    ".codex\instructions\common\security.md",
    ".codex\instructions\repository\overview.md",
    ".codex\instructions\repository\architecture.md",
    ".codex\instructions\repository\code-conventions.md",
    ".codex\instructions\repository\local-development.md",
    ".codex\instructions\repository\performance.md"
)

$requiredDirectories = @(
    ".codex\agents",
    ".codex\instructions\common",
    ".codex\instructions\repository",
    ".codex\templates",
    ".codex\scripts",
    ".codex\docs\source",
    ".codex\docs\specs",
    ".codex\docs\plans",
    ".codex\docs\api",
    ".codex\docs\sql",
    ".codex\docs\runbooks",
    ".codex\workflows\changes"
)

$problemList = [Collections.Generic.List[string]]::new()
foreach ($relativePath in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $repository $relativePath) -PathType Leaf)) {
        $problemList.Add("Missing file: $relativePath")
    }
}
foreach ($relativePath in $requiredDirectories) {
    if (-not (Test-Path -LiteralPath (Join-Path $repository $relativePath) -PathType Container)) {
        $problemList.Add("Missing directory: $relativePath")
    }
}

$agentCount = @(Get-ChildItem -LiteralPath (Join-Path $repository ".codex\agents") `
    -Filter "*.toml" -File -ErrorAction SilentlyContinue).Count
if ($agentCount -ne 5) {
    $problemList.Add("Expected 5 agent TOML files, found $agentCount")
}

if ($problemList.Count -gt 0) {
    $problemList | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Codex starter structure validation passed"
