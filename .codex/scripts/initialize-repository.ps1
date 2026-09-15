[CmdletBinding()]
param(
    [string]$Destination
)

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$codexDirectory = Split-Path -Parent $scriptDirectory
$defaultRepository = Split-Path -Parent $codexDirectory
$repository = if ($Destination) {
    [IO.Path]::GetFullPath($Destination)
} else {
    [IO.Path]::GetFullPath($defaultRepository)
}

if (-not (Test-Path -LiteralPath $repository -PathType Container)) {
    throw "Repository destination does not exist: $repository"
}

$targetCodex = [IO.Path]::GetFullPath((Join-Path $repository ".codex"))
if (-not $targetCodex.StartsWith($repository, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved .codex target is outside repository"
}

$directories = @(
    "docs\source",
    "docs\specs",
    "docs\plans",
    "docs\api",
    "docs\sql",
    "docs\runbooks",
    "workflows\changes"
)

foreach ($relativePath in $directories) {
    New-Item -ItemType Directory -Path (Join-Path $targetCodex $relativePath) -Force | Out-Null
}

$agentsFile = Join-Path $repository "AGENTS.md"
$agentsTemplate = Join-Path $targetCodex "templates\AGENTS.bootstrap.md"
if (-not (Test-Path -LiteralPath $agentsFile)) {
    Copy-Item -LiteralPath $agentsTemplate -Destination $agentsFile
}

$pluginAvailable = $false
try {
    $pluginData = codex plugin list --json | ConvertFrom-Json
    $pluginAvailable = @($pluginData.installed) |
        Where-Object { $_.name -eq "controlled-development" -and $_.enabled } |
        ForEach-Object { $true } |
        Select-Object -First 1
} catch {
    $pluginAvailable = $false
}

[PSCustomObject]@{
    Repository = $repository
    CodexDirectory = $targetCodex
    AgentsAvailable = Test-Path -LiteralPath $agentsFile
    ControlledDevelopmentAvailable = [bool]$pluginAvailable
    RepositoryInstructionsRequireCustomization = $true
} | ConvertTo-Json
