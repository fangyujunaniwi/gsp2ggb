# Open a .ggb in GeoGebra, press Ctrl+S (save back to same file), close.
param([string]$File, [int]$WaitSec = 40, [string]$Exe)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class GC4 { [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int c); [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); }
"@
if (-not $Exe) { $Exe = $env:GGB_EXE }
if (-not $Exe) {
  $Exe = @('C:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe','D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe','C:\Program Files\GeoGebra 5.4\GeoGebra.exe','D:\Program Files\GeoGebra 5.4\GeoGebra.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
}
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
Start-Sleep 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"')
$p = $null
for ($i = 0; $i -lt $WaitSec; $i++) {
  Start-Sleep 2
  $p = Get-Process javaw -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if ($p) { Start-Sleep 8; break }
}
if (-not $p) { Write-Output 'no GeoGebra window'; exit 1 }
[GC4]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
[GC4]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep 4
[System.Windows.Forms.SendKeys]::SendWait('^s')
Start-Sleep 4
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep 6
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
Write-Output 'saved-and-closed'
