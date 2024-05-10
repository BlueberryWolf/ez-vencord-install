@echo off
set nodeinstalled=no
set gitinstalled=no
set chocoinstalled=no
set scriptdir="%~dp0%~nx0"

echo install script written by @blueberrywolfi on discord
echo.
echo press any key to continue.
pause >nul

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
	CMD /C "pnpm -v" >nul 2>&1 && ( goto installvencord )
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

:installnode
echo installing node...
choco install nodejs-lts -y
call "%~dp0\lib\resetvars.bat"
goto checkDependencies
exit /B 0

:installgit
echo installing git...
choco install git.install -y
call "%~dp0\lib\resetvars.bat"
goto checkDependencies
exit /B 0

:installpnpm
CMD /C "npm i -g pnpm@9.1.0"
goto restartscriptunelevated
exit /B 0

:installvencord
CMD /C "pnpm -v" >nul 2>&1 && (
	echo pnpm installed
) || (
	echo pnpm not installed
	goto installpnpm
)
cd /d "%~dp0"

net file 1>NUL 2>NUL
if not '%errorlevel%' == '0' (
	if not exist "%~dp0\Vencord\" (
		echo cloning vencord repo...
		
		git clone https://github.com/Vendicated/Vencord
		cd Vencord
	) else (
		cd Vencord
		echo updating local vencord repo
		git pull
	)

	echo installing vencord dependencies...
	cmd /c pnpm install --frozen-lockfile
	
	if exist "%~dp0\Vencord\src\userplugins" (
		rd /s /q "%~dp0\Vencord\src\userplugins"
	)
	echo copying patches to src...
	xcopy "%~dp0\patches\src" "%~dp0\Vencord\src" /E /H /C /I /Y

	echo building vencord...
	cmd /c pnpm build

	echo injecting vencord..
	cmd /c pnpm inject
	exit
) else (
	echo script is elevated, de-elevating...
	goto restartscriptunelevated
)
exit /B 0

:checkDependencies
set scriptdir="%~dp0%~nx0"

echo checking for chocolatey...
cmd /c choco -v >nul 2>&1 && ( set chocoinstalled=yes )
echo chocolatey: %chocoinstalled%
echo.

echo checking for node...
cmd /c node -v >nul 2>&1 && ( set nodeinstalled=yes )
echo node: %nodeinstalled%
echo.

echo checking for git...
cmd /c git --version >nul 2>&1 && ( set gitinstalled=yes )
echo git: %gitinstalled%
echo.

if %nodeinstalled%==yes (
	if %gitinstalled%==yes (
		goto installvencord
	) else (
		if %chocoinstalled%==yes (
			goto installgit
		) else (
			goto installchoco
		)
	)
) else (
	if %chocoinstalled%==yes (
		goto installnode
	) else (
		goto installchoco
	)
)

exit /B 0
