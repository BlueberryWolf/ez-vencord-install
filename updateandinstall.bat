@echo off
set gitinstalled=no
set chocoinstalled=no
set scriptdir="%~dp0%~nx0"

title vencord install script by @BlueberryWolfi
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
	CMD /C "git -v" >nul 2>&1 && ( goto updaterepo )
	echo script is not elevated, elevating...
    powershell Start-Process -FilePath "%0" -ArgumentList "%cd%" -verb runas >NUL 2>&1
    exit /b
) else (
	echo script is elevated, checking dependencies...
	goto checkDependencies
)

cd /d %1
exit /B 0

:restartscriptunelevated
runas /trustlevel:0x20000 "cmd.exe /k %scriptdir%"
exit
exit /B 0

:installchoco
echo installing chocolatey...
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command " [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
call "%~dp0\lib\resetvars.bat"
goto checkDependencies
exit /B 0

:installgit
echo installing git...
choco install git.install -y
call "%~dp0\lib\resetvars.bat"
goto checkDependencies
exit /B 0

title vencord install script by @BlueberryWolfi


:updaterepo
if not exist "%~dp0\.git" (
    echo git not exist
    cmd /c git init
    cmd /c git remote add origin https://github.com/BlueberryWolf/ez-vencord-install
    cmd /c git fetch origin main
    cmd /c git checkout -f -b main origin/main
    cmd /c git pull
    echo updated, press any key to install vencord
    pause >nul
    start cmd.exe /k install.bat
    exit
) else (
    cmd /c git pull
    echo updated, press any key to install vencord
    pause >nul
    start cmd.exe /k install.bat
    exit
)

exit /B 0

:checkDependencies
set scriptdir="%~dp0%~nx0"

echo checking for git...
cmd /c git --version >nul 2>&1 && ( set gitinstalled=yes )
echo git: %gitinstalled%
echo.

echo checking for chocolatey...
cmd /c choco -v >nul 2>&1 && ( set chocoinstalled=yes )
echo chocolatey: %chocoinstalled%
echo.


if %gitinstalled%==yes (
    goto updaterepo
) else (
    if %chocoinstalled%==yes (
        goto installgit
    ) else (
        goto installchoco
    )
)

exit /B 0