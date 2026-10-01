param([string]$File, [string]$OutPrefix, [int]$WaitSec = 60, [string]$Exe, [int]$X = 1100, [int]$Y = 450, [int]$Ticks = 5)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class WH {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
  [StructLayout(LayoutKind.Sequential)] public struct MOUSEINPUT { public int dx; public int dy; public uint mouseData; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
  [StructLayout(LayoutKind.Sequential)] public struct INPUT { public uint type; public MOUSEINPUT mi; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint SendInput(uint n, INPUT[] inputs, int size);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k,byte s,uint f,int e);
  static int SZ = System.Runtime.InteropServices.Marshal.SizeOf(typeof(INPUT));
  public static void MoveAbs(int sx, int sy) {
    var scr = System.Windows.Forms.Screen.PrimaryScreen.Bounds;
    var inp = new INPUT[1];
    inp[0].type = 0;
    inp[0].mi.dx = (int)((sx * 65535.0) / (scr.Width - 1) + 0.5);
    inp[0].mi.dy = (int)((sy * 65535.0) / (scr.Height - 1) + 0.5);
    inp[0].mi.dwFlags = 0x0001 | 0x8000;
    SendInput(1, inp, SZ);
  }
  public static void Wheel(int delta) {
    var inp = new INPUT[1];
    inp[0].type = 0;
    inp[0].mi.dwFlags = 0x0800;             // MOUSEEVENTF_WHEEL
    inp[0].mi.mouseData = (uint)delta;
    SendInput(1, inp, SZ);
  }
  public static void Click(int sx, int sy) {
    MoveAbs(sx, sy);
    System.Threading.Thread.Sleep(120);
    var d = new INPUT[1]; d[0].type = 0; d[0].mi.dwFlags = 0x0002; SendInput(1, d, SZ);
    System.Threading.Thread.Sleep(150);
    var u = new INPUT[1]; u[0].type = 0; u[0].mi.dwFlags = 0x0004; SendInput(1, u, SZ);
  }
}
"@ -ReferencedAssemblies 'System.Windows.Forms','System.Drawing'
if (-not $Exe) { $Exe = $env:GGB_EXE }
if (-not $Exe) { $Exe = @('C:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe','D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1 }
function Force-Foreground([IntPtr]$h) {
  [WH]::keybd_event(0x12, 0, 0, 0); [WH]::SetForegroundWindow($h) | Out-Null; [WH]::keybd_event(0x12, 0, 2, 0)
}
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
Start-Sleep 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"')
$base = [System.IO.Path]::GetFileNameWithoutExtension($File)
$p = $null
for ($i = 0; $i -lt ($WaitSec * 2); $i++) {
  Start-Sleep 1
  $cand = Get-Process javaw -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
  $p = $cand | Where-Object { $_.MainWindowTitle -like ('*' + $base + '*') } | Select-Object -First 1
  if ($p) { Start-Sleep 8; break }
}
if (-not $p) { Write-Output 'no window'; exit 1 }
[WH]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
Force-Foreground $p.MainWindowHandle
Start-Sleep 4
$r = New-Object WH+RECT
[WH]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
Write-Output ("rect " + $r.L + "," + $r.T + " " + ($r.R-$r.L) + "x" + ($r.B-$r.T) + " fgmatch=" + ([WH]::GetForegroundWindow() -eq $p.MainWindowHandle))
function Shot($path) {
  $w = $r.R - $r.L; $h = $r.B - $r.T
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($r.L, $r.T, 0, 0, (New-Object System.Drawing.Size $w, $h))
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output ('saved ' + $path)
}
Shot ($OutPrefix + '_before.png')
Force-Foreground $p.MainWindowHandle
Start-Sleep -Milliseconds 300
[WH]::MoveAbs(($r.L + $X), ($r.T + $Y))
Start-Sleep -Milliseconds 400
for ($i = 0; $i -lt $Ticks; $i++) { [WH]::Wheel(-120); Start-Sleep -Milliseconds 200 }
Start-Sleep 2
Shot ($OutPrefix + '_after.png')
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
