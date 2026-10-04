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

# Enumerate *all* top-level windows: the "打开文件失败 / error in <expression>" dialog is a
# secondary window, so Get-Process MainWindowTitle (main window only) never sees it.
Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class WinEnum {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  public static List<string> Titles() {
    var list = new List<string>();
    EnumWindows((h, l) => { var sb = new StringBuilder(1024); GetWindowText(h, sb, 1024); if (sb.Length > 0) list.Add(sb.ToString()); return true; }, IntPtr.Zero);
    return list;
  }
}
"@

Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"') | Out-Null
Start-Sleep -Seconds $WaitSec
$titles = [WinEnum]::Titles()
$fname = [System.IO.Path]::GetFileName($File)
$ok = @($titles | Where-Object { $_ -like "*$fname*" }).Count -gt 0
# The error dialog's title is "GeoGebra - <word>"; the main window's title is the file name
# and the splash is "GeoGebra 5.4", so the "GeoGebra - " prefix uniquely identifies it.
# (ASCII-only pattern: Chinese literals in a .ps1 get mangled by PowerShell's ANSI reading.)
$err = @($titles | Where-Object { $_ -match 'GeoGebra - ' -or $_ -match 'Error|Fail' }).Count -gt 0
foreach ($t in $titles) { if ($t -match 'GeoGebra - ' -or $t -match 'Error|Fail') { Write-Output ('  ERRDIALOG ' + $t) } }
Write-Output ('RESULT file=' + $fname + ' ok=' + $ok + ' err=' + $err)
Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
