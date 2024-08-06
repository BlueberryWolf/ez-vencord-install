@echo off
goto checkprivileges

:UACEXIT
echo This script will not function if UAC is disabled. Please enable User Access Control.
pause>nul
exit /B 0

:checkprivileges
reg query "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v "ConsentPromptBehaviorAdmin" | find  "0x0" >NUL
if "%ERRORLEVEL%"=="0" goto UACEXIT

net file 1>NUL 2>NUL
if not '%errorlevel%' == '0' (
	echo script is not elevated, elevating...
	powershell Start-Process -FilePath "%0" -ArgumentList "%cd%" -verb runas >NUL 2>&1
	exit /b
) else (
	echo script is elevated, uninstalling pnpm...
	goto uninstallpnpm
)
cd /d %1
exit /B 0

cd /d %1
exit /B 0

:uninstallpnpm
echo uninstalling pnpm. press any key to continue
pause >nul
cmd /c npm uninstall -g pnpm

echo removing leftover pnpm files. press any key to continue
pause >nul

if exist "%localappdata%\pnpm" (
	echo removing %localappdata%\pnpm
	rd /s /q "%localappdata%\pnpm"
)
if exist "%localappdata%\pnpm-cache" (
	echo removing %localappdata%\pnpm-cache
	rd /s /q "%localappdata%\pnpm-cache"
)
if exist "%localappdata%\pnpm-state" (
	echo removing %localappdata%\pnpm-state
	rd /s /q "%localappdata%\pnpm-state"
)
goto installpnpm
exit /B 0

:installpnpm
echo installing pnpm. press any key to continue
pause >nul
cmd /c npm i -g pnpm@9.1.0
echo should be fixed now.
pause >nul
exit /B 0