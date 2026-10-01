param([string]$Proc, [string]$File, [string]$Out, [int]$WaitSec = 6)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
if ($File) { $p = Start-Process -FilePath $Proc -ArgumentList ('"' + $File + '"') -PassThru }
else { $p = Start-Process -FilePath $Proc -PassThru }
Start-Sleep -Seconds $WaitSec
$p.Refresh()
if ($p.MainWindowHandle -ne 0) {
  [Win32]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
  [Win32]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
  Start-Sleep -Seconds 2
}
$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ("saved " + $Out + " pid=" + $p.Id + " hwnd=" + $p.MainWindowHandle)
