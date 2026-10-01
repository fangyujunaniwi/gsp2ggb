# Screenshot a .ggb file opened in GeoGebra Classic.
#   powershell -ExecutionPolicy Bypass -File tools\shotggb.ps1 -File x.ggb -Out x.png
# The GeoGebra executable is auto-detected; override with -Exe or the GGB_EXE env var.
param([string]$File, [string]$Out, [int]$WaitSec = 45, [string]$Exe)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class GC2 { [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; } [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r); [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int c); [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); }
"@
if (-not $Exe) { $Exe = $env:GGB_EXE }
if (-not $Exe) {
  $Exe = @(
    'C:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe',
    'D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe',
    'C:\Program Files\GeoGebra 5.4\GeoGebra.exe',
    'D:\Program Files\GeoGebra 5.4\GeoGebra.exe'
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $Exe -or -not (Test-Path $Exe)) { throw 'GeoGebra executable not found; pass -Exe <path> or set $env:GGB_EXE' }
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
Start-Sleep 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"')
$base = [System.IO.Path]::GetFileNameWithoutExtension($File)
$p = $null
for ($i = 0; $i -lt ($WaitSec * 2); $i++) {
  Start-Sleep 1
  $cand = Get-Process javaw -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
  $p = $cand | Where-Object { $_.MainWindowTitle -like ('*' + $base + '*') } | Select-Object -First 1
  if (-not $p) { $p = $cand | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle -notmatch 'splash|Loading|GeoGebra$' } | Select-Object -First 1 }
  if ($p) { Start-Sleep 8; break }
}
if (-not $p) { Write-Output 'no GeoGebra window'; exit 1 }
[GC2]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
[GC2]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep 5
$r = New-Object GC2+RECT
[GC2]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
$w = $r.R - $r.L; $h = $r.B - $r.T
if ($w -le 0 -or $h -le 0) { Write-Output ('bad rect ' + $w + 'x' + $h); exit 1 }
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.L, $r.T, 0, 0, (New-Object System.Drawing.Size $w, $h))
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
Write-Output ('saved ' + $Out + ' ' + $w + 'x' + $h)
