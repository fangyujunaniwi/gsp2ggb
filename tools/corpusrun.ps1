param(
  [string]$Dir = 'out/corpus',
  [int]$WaitSec = 16,
  [string]$Exe = 'D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe'
)
$ErrorActionPreference = 'Continue'
$root = (Resolve-Path $Dir).Path
$out = Join-Path $root 'results.tsv'
"n`tfile`tok`terr" | Set-Content -Path $out -Encoding UTF8
$files = @(Get-ChildItem $root -Recurse -Filter *.ggb | Sort-Object FullName)
$total = $files.Count
$n = 0
foreach ($f in $files) {
  $n++
  $o = & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'ggbcheck.ps1') -File $f.FullName -WaitSec $WaitSec -Exe $Exe
  $r = (@($o) | Where-Object { $_ -match 'RESULT' }) -join ''
  $ok = if ($r -match 'ok=True') { 'True' } else { 'False' }
  $err = if ($r -match 'err=True') { 'True' } else { 'False' }
  $rel = $f.FullName.Substring($root.Length + 1)
  "$n`t$rel`t$ok`t$err" | Add-Content -Path $out -Encoding UTF8
  Write-Output ("[{0}/{1}] err={2} {3}" -f $n, $total, $err, $rel)
}
Write-Output "DONE $total pages"
