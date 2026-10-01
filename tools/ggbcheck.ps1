param([string]$File, [int]$WaitSec = 14, [string]$Exe)
if (-not $Exe) {
  $candidates = @(
    'C:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe',
    'D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe',
    'C:\Program Files\GeoGebra 5.4\GeoGebra.exe',
    'D:\Program Files\GeoGebra 5.4\GeoGebra.exe'
  )
  $Exe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $Exe -or -not (Test-Path $Exe)) { throw 'GeoGebra executable not found; pass -Exe <path>' }
Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"') | Out-Null
Start-Sleep -Seconds $WaitSec
$wins = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle } | Select-Object ProcessName, MainWindowTitle
$fname = [System.IO.Path]::GetFileName($File)
$ok = @($wins | Where-Object { $_.MainWindowTitle -like "*$fname*" }).Count -gt 0
$err = @($wins | Where-Object { $_.MainWindowTitle -match '错误|失败|Error|Fail' }).Count -gt 0
foreach ($w in $wins) { Write-Output ('  WIN ' + $w.ProcessName + ' | ' + $w.MainWindowTitle) }
Write-Output ('RESULT file=' + $fname + ' ok=' + $ok + ' err=' + $err)
Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
