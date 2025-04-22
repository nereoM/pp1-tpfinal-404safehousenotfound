@echo off
echo 🛠️ Instalando hook pre-push para evitar conflictos...

REM Copia el hook desde ./setup/pre-push a .git/hooks/pre-push
copy /Y "%~dp0setup\pre-push" "%~dp0.git\hooks\pre-push" >nul

IF %ERRORLEVEL% NEQ 0 (
  echo ❌ No se pudo copiar el hook. Asegurate de estar dentro del repo con .git.
  pause
  exit /b
)

echo ✅ Hook instalado con éxito en .git\hooks\pre-push
pause
