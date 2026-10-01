param(
  [string]$Root = 'D:\Program Files (x86)\Sketchpad5',
  [string]$OutDir = (Join-Path $env:TEMP 'gsp-conv-regress')
)
$names = @('99table.gsp','clock4.gsp','logtable.gsp','map-projection1.gsp')
$files = @()
foreach ($n in $names) {
  $f = Get-ChildItem $Root -Recurse -Filter $n -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($f) { $files += $f.FullName }
}
$i = 0
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
foreach ($f in $files) {
  $i++
  $out = Join-Path $OutDir "reg_$i.ggb"
  Write-Output ("=== convert reg_$i : " + $f)
  & node bin\cli.js $f -o $out -q
  & powershell -File tools\ggbcheck.ps1 -File $out -WaitSec 15
}
