param([string]$File, [string]$OutPrefix, [int]$WaitSec = 60, [string]$Exe, [int]$X1 = 1362, [int]$Y1 = 690, [int]$X2 = 1362, [int]$Y2 = 560)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class DG {
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
  public static void Flags(uint f) { var i = new INPUT[1]; i[0].type = 0; i[0].mi.dwFlags = f; SendInput(1, i, SZ); }
  public static void Drag(int x1, int y1, int x2, int y2) {
    MoveAbs(x1, y1); System.Threading.Thread.Sleep(200);
    Flags(0x0002); System.Threading.Thread.Sleep(250);
    for (int k = 1; k <= 10; k++) { MoveAbs(x1 + (x2-x1)*k/10, y1 + (y2-y1)*k/10); System.Threading.Thread.Sleep(80); }
    System.Threading.Thread.Sleep(250);
    Flags(0x0004); System.Threading.Thread.Sleep(300);
  }
}
"@ -ReferencedAssemblies 'System.Windows.Forms','System.Drawing'
if (-not $Exe) { $Exe = $env:GGB_EXE }
if (-not $Exe) { $Exe = @('C:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe','D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1 }
function Force-Foreground([IntPtr]$h) {
  [DG]::keybd_event(0x12, 0, 0, 0); [DG]::SetForegroundWindow($h) | Out-Null; [DG]::keybd_event(0x12, 0, 2, 0)
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
[DG]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
Force-Foreground $p.MainWindowHandle
Start-Sleep 4
$r = New-Object DG+RECT
[DG]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
Write-Output ("rect " + $r.L + "," + $r.T + " fgmatch=" + ([DG]::GetForegroundWindow() -eq $p.MainWindowHandle))
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
[DG]::Drag(($r.L + $X1), ($r.T + $Y1), ($r.L + $X2), ($r.T + $Y2))
Start-Sleep 2
Shot ($OutPrefix + '_after.png')
Stop-Process -Name GeoGebra, javaw -ErrorAction SilentlyContinue
