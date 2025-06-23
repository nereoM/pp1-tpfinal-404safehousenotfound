@echo off
echo Iniciando instalación...

:: Verificar si el entorno virtual existe
if not exist "venv\" (
    echo Creando entorno virtual...
    python -m venv venv
)

:: Activar el entorno virtual
echo Activando entorno virtual...
call venv\Scripts\activate

:: Instalar dependencias
echo Instalando dependencias...
pip install --upgrade pip
pip install -r requirements.txt

:: Cargar variables de entorno desde el .env
echo Configurando variables de entorno...
for /f "tokens=1,2 delims==" %%i in (".env") do (
    if not "%%i"=="" (
        set %%i=%%j
    )
)

:: Verificar conexión a la base de datos
echo Verificando conexión a la base de datos...
python -c "from sqlalchemy import create_engine; import os; engine = create_engine(os.getenv('DATABASE_URL')); print('✅ Conexión exitosa a la base de datos!') if engine.connect() else print('❌ Error al conectar a la base de datos')"

:: Levantar el backend (Flask)
echo Iniciando servidor Flask...
start cmd.exe /k "python server/main.py"

:: Ir al frontend y levantar Vite
echo Iniciando Vite en React...
cd client
start cmd.exe /k "npm install && npm run dev"

:: Esperar unos segundos y abrir el navegador
timeout /t 5 >nul
echo Abriendo navegador en http://localhost:5173
start http://localhost:5173

:: Mantener la ventana abierta
pause
