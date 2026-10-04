param([string]$File, [int]$WaitSec = 30, [string]$Exe, [string]$Out = 'out\shot.png')
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
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"') | Out-Null
Start-Sleep -Seconds $WaitSec
$wins = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle } | Select-Object ProcessName, MainWindowTitle
foreach ($w in $wins) { Write-Output ('  WIN ' + $w.ProcessName + ' | ' + $w.MainWindowTitle) }
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$dir = [System.IO.Path]::GetDirectoryName($Out)
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ('SHOT ' + $Out)
Stop-Process -Name GeoGebra,javaw -ErrorAction SilentlyContinue
