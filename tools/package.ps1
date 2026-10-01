# Build a clean, self-contained hand-off zip of gsp-conv.
# Includes source, docs, tools, reference samples and ground-truth control sketches;
# excludes generated output (out/, test/out/) and scratch files.
#
#   powershell -ExecutionPolicy Bypass -File tools\package.ps1
#   powershell -ExecutionPolicy Bypass -File tools\package.ps1 -Out D:\gsp-conv.zip
#   powershell -ExecutionPolicy Bypass -File tools\package.ps1 -Light   # skip ref-ctrl/ (~3 MB)
param(
  [string]$Out,
  [switch]$Light
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot          # project root = parent of tools\
if (-not $Out) { $Out = Join-Path $root ('gsp-conv-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip') }

$stage = Join-Path ([System.IO.Path]::GetTempPath()) ('gspconv-stage-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$payload = Join-Path $stage 'gsp-conv'
New-Item -ItemType Directory -Path $payload -Force | Out-Null

$xd = @('/XD', 'out', 'node_modules', '.git', '.vs')
$xf = @('/XF', 'o.ggb', 'out.xml', 'Thumbs.db', 'Desktop.ini', '*.tmp', '*.zip')
if ($Light) { $xd += 'ref-ctrl' }

Write-Output ('staging ' + $root + '  ->  ' + $payload)
robocopy $root $payload /E /NFL /NDL /NJH /NJS /NP @xd @xf | Out-Null
if ($LASTEXITCODE -ge 8) { throw ('robocopy failed, exit=' + $LASTEXITCODE) }

# never ship workspace caches / staging artefacts that might live under the root
foreach ($junk in @('.git', 'node_modules')) {
  $p = Join-Path $payload $junk
  if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}

if (Test-Path $Out) { Remove-Item $Out -Force }
$n = (Get-ChildItem $payload -Recurse -File | Measure-Object).Count
Compress-Archive -Path $payload -DestinationPath $Out -Force
Remove-Item $stage -Recurse -Force

$zip = Get-Item $Out
Write-Output ('wrote ' + $zip.FullName)
Write-Output ('size ' + [math]::Round($zip.Length / 1MB, 2) + ' MB, files ' + $n)
