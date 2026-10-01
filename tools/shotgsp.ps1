# Screenshot a .gsp file opened in 几何画板 (The Geometer's Sketchpad).
#   powershell -ExecutionPolicy Bypass -File tools\shotgsp.ps1 -File x.gsp -Out x.png
# The Sketchpad executable is auto-detected; override with -Exe or the GSP_EXE env var.
param([string]$File, [string]$Out, [int]$WaitSec = 16, [string]$Exe, [string]$Proc = 'GSP5chs')
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class WinCap {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
"@
if (-not $Exe) { $Exe = $env:GSP_EXE }
if (-not $Exe) {
  $Exe = @(
    'C:\Program Files (x86)\Sketchpad5\GSP5chs.exe',
    'C:\Program Files\Sketchpad5\GSP5chs.exe',
    'D:\Sketchpad5\GSP5chs.exe',
    'C:\Program Files (x86)\Sketchpad5\GSP5.exe',
    'D:\Sketchpad5\GSP5.exe'
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $Exe -or -not (Test-Path $Exe)) { throw 'Sketchpad executable not found; pass -Exe <path> or set $env:GSP_EXE' }
Stop-Process -Name GSP5chs, GSP5 -ErrorAction SilentlyContinue
Start-Sleep 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"')
Start-Sleep $WaitSec
$p = Get-Process $Proc | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Output 'no window'; exit 1 }
[WinCap]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
[WinCap]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep 4
$r = New-Object WinCap+RECT
[WinCap]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
$w = $r.R - $r.L; $h = $r.B - $r.T
if ($w -le 0 -or $h -le 0) { Write-Output 'bad rect'; exit 1 }
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.L, $r.T, 0, 0, (New-Object System.Drawing.Size $w, $h))
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Stop-Process -Name GSP5chs, GSP5 -ErrorAction SilentlyContinue
Write-Output ('saved ' + $Out + ' ' + $w + 'x' + $h)
