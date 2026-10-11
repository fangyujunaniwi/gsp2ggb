param([string]$File, [int]$WaitSec = 20, [string]$Exe = 'D:\Sketchpad5\GSP5chs.exe', [string]$Out = 'out\gspshot.png')
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
Stop-Process -Name GSP5chs -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Process -FilePath $Exe -ArgumentList ('"' + $File + '"') | Out-Null
Start-Sleep -Seconds $WaitSec
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$dir = [System.IO.Path]::GetDirectoryName($Out)
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ('SHOT ' + $Out)
