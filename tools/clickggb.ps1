# Focus GeoGebra via AppActivate, then click window-relative coords.
param([string]$File, [string]$OutPrefix, [int]$WaitSec = 40, [string]$Exe, [string]$Clicks = "")
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing, Microsoft.VisualBasic
Add-Type @"
using System; using System.Runtime.InteropServices;
public class GC5 {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,int e);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k,byte s,uint f,int e);
}
"@
function Force-Foreground([IntPtr]$h) {
  [GC5]::keybd_event(0x12, 0, 0, 0)   # ALT down unlocks SetForegroundWindow
  [GC5]::SetForegroundWindow($h) | Out-Null
  [GC5]::keybd_event(0x12, 0, 2, 0)   # ALT up
}
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
  if ($p) { Start-Sleep 6; break }
}
if (-not $p) { Write-Output 'no GeoGebra window'; exit 1 }
[GC5]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
Start-Sleep 2
[Microsoft.VisualBasic.Interaction]::AppActivate($p.Id) | Out-Null
Start-Sleep 2
Force-Foreground $p.MainWindowHandle
Start-Sleep 2
$r = New-Object GC5+RECT
[GC5]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
$fg = [GC5]::GetForegroundWindow()
Force-Foreground $p.MainWindowHandle
Start-Sleep 1
$fg = [GC5]::GetForegroundWindow()
Write-Output ("rect " + $r.L + "," + $r.T + " " + ($r.R-$r.L) + "x" + ($r.B-$r.T) + " target=" + $p.MainWindowHandle + " fg=" + $fg + " match=" + ($fg -eq $p.MainWindowHandle))
$n = 0
function Shot($path) {
  $w = $r.R - $r.L; $h = $r.B - $r.T
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($r.L, $r.T, 0, 0, (New-Object System.Drawing.Size $w, $h))
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output ('saved ' + $path)
}
Shot ($OutPrefix + '_0.png')
foreach ($c in ($Clicks -split ';')) {
  if (-not $c.Trim()) { continue }
  $n++
  $xy = $c -split ','
  $X = $r.L + [int]$xy[0]; $Y = $r.T + [int]$xy[1]
  [GC5]::SetCursorPos($X, $Y) | Out-Null
  Start-Sleep 1
  [GC5]::mouse_event(0x0002, 0, 0, 0, 0)
  Start-Sleep -Milliseconds 180
  [GC5]::mouse_event(0x0004, 0, 0, 0, 0)
  Start-Sleep 2
  Shot ($OutPrefix + '_' + $n + '.png')
}
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
