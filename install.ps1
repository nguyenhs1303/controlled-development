[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Destination
)

$ErrorActionPreference = "Stop"
$kitRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repository = [IO.Path]::GetFullPath($Destination)
$sourceCodex = Join-Path $kitRoot ".codex"
$targetCodex = [IO.Path]::GetFullPath((Join-Path $repository ".codex"))
$targetAgents = Join-Path $repository "AGENTS.md"

if (-not (Test-Path -LiteralPath $repository -PathType Container)) {
    throw "Repository destination does not exist: $repository"
}
if (-not $targetCodex.StartsWith($repository, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved .codex target is outside repository"
}
if (Test-Path -LiteralPath $targetCodex) {
    throw "Destination already contains .codex; refusing to overwrite: $targetCodex"
}
if (Test-Path -LiteralPath $targetAgents) {
    throw "Destination already contains AGENTS.md; refusing to overwrite: $targetAgents"
}

Copy-Item -LiteralPath $sourceCodex -Destination $targetCodex -Recurse
Copy-Item -LiteralPath (Join-Path $kitRoot "AGENTS.md") -Destination $targetAgents

& (Join-Path $targetCodex "scripts\initialize-repository.ps1") -Destination $repository | Out-Null
& (Join-Path $targetCodex "scripts\validate-structure.ps1")
& (Join-Path $targetCodex "scripts\validate-references.ps1")
& (Join-Path $targetCodex "scripts\scan-secrets.ps1")
& (Join-Path $targetCodex "scripts\validate-portability.ps1")

[PSCustomObject]@{
    Repository = $repository
    CodexDirectory = $targetCodex
    AgentsFile = $targetAgents
    RequiresRepositoryCustomization = $true
} | ConvertTo-Json
