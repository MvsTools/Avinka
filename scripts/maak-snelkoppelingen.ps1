# Maakt (of vernieuwt) de bureaublad-snelkoppelingen Scherm 1 en Scherm 2.
$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')

$s1 = $ws.CreateShortcut("$desktop\Scherm 1.lnk")
$s1.TargetPath = 'C:\dev\wijs-platform\scripts\scherm-1.bat'
$s1.WorkingDirectory = 'C:\dev\wijs-werk\a'
$s1.Description = 'Claude Code - Scherm 1 (werkmap a, poort 3000)'
$s1.WindowStyle = 1
$s1.Save()
Write-Output "Scherm 1 -> $desktop\Scherm 1.lnk"

$s2 = $ws.CreateShortcut("$desktop\Scherm 2.lnk")
$s2.TargetPath = 'C:\dev\wijs-platform\scripts\scherm-2.bat'
$s2.WorkingDirectory = 'C:\dev\wijs-werk\b'
$s2.Description = 'Claude Code - Scherm 2 (werkmap b, poort 3001)'
$s2.WindowStyle = 1
$s2.Save()
Write-Output "Scherm 2 -> $desktop\Scherm 2.lnk"
