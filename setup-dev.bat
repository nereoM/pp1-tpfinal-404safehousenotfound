@echo off
echo 🛠️ Instalando hook pre-push para evitar conflictos...

copy setup\pre-push .git\hooks\pre-push >nul

if %ERRORLEVEL% NEQ 0 (
  echo ❌ No se pudo copiar el hook. Asegurate de que estés dentro del repo con .git.
  pause
  exit /b
)

echo ✅ Hook pre-push instalado con éxito.
pause
