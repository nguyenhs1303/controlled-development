[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$codexDirectory = Split-Path -Parent $scriptDirectory
$patternList = @(
    'Bearer\s+[A-Za-z0-9_-]{12,}',
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    '(?i)(password|client_secret|api_key|access_token)\s*[:=]\s*[''"]?[A-Za-z0-9+/=_-]{12,}'
)
$findingList = [Collections.Generic.List[string]]::new()
$fileList = Get-ChildItem -LiteralPath $codexDirectory -Recurse -Force -File |
    Where-Object {
        $_.FullName -notlike "*\.codex\archive\*" -and
        $_.FullName -notlike "*\.codex\logs\*" -and
        $_.FullName -notlike "*\.codex\cache\*"
    }

foreach ($file in $fileList) {
    foreach ($pattern in $patternList) {
        if (Select-String -LiteralPath $file.FullName -Pattern $pattern -Quiet -ErrorAction SilentlyContinue) {
            $findingList.Add([IO.Path]::GetRelativePath($codexDirectory, $file.FullName))
            break
        }
    }
}

if ($findingList.Count -gt 0) {
    $findingList | Sort-Object -Unique | ForEach-Object { Write-Error "Potential secret pattern in $_; match hidden" }
    exit 1
}

Write-Output "Active .codex secret scan passed"
