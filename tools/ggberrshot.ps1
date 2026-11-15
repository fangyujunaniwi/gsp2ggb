param(
  [string]$File,
  [int]$WaitSec = 16,
  [string]$Exe = 'D:\Program Files (x86)\GeoGebra 5.4\GeoGebra.exe',
  [string]$Out
)
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinCap2 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
  public struct RECT { public int Left, Top, Right, Bottom; }
  public static IntPtr Find(string prefix) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, l) => {
      var sb = new StringBuilder(1024); GetWindowText(h, sb, 1024);
      if (sb.ToString().StartsWith(prefix) && IsWindowVisible(h)) { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
  public static int[] Rect(IntPtr h) { RECT r; GetWindowRect(h, out r); return new int[] { r.Left, r.Top, r.Right, r.Bottom }; }
}
"@
Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"') | Out-Null
Start-Sleep -Seconds $WaitSec
$hwnd = [WinCap2]::Find('GeoGebra - ')
if ($hwnd -eq [IntPtr]::Zero) { Write-Output 'NOERRDIALOG'; Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue; return }
[WinCap2]::ShowWindow($hwnd, 9) | Out-Null
[WinCap2]::SetWindowPos($hwnd, [IntPtr]::Zero, 0, 0, 1400, 820, 0x0004) | Out-Null
[WinCap2]::BringWindowToTop($hwnd) | Out-Null
[WinCap2]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 900
$r = [WinCap2]::Rect($hwnd)
$w = [Math]::Min($r[2], 1400); $h = [Math]::Min($r[3], 820)
if ($w -le 0 -or $h -le 0) { Write-Output ('BADRECT ' + ($r -join ',')); Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue; return }
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size($w, $h)))
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ('CROPPED ' + $Out + ' ' + $w + 'x' + $h)
Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
