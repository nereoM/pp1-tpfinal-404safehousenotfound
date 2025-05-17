# Imagen base oficial de Python
FROM python:3.12-slim

# Instalación de dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    libssl-dev \
    libffi-dev \
    python3-dev \
    libmariadb-dev \
    gcc \
    pkg-config \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Seteamos el directorio de trabajo
WORKDIR /app

# Copiamos solo lo necesario (evita copiar node_modules, __pycache__, etc.)
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Luego copiamos el resto
COPY . .

# Exponemos el puerto para Railway
EXPOSE 5000

# Comando para ejecutar Flask
CMD ["python3", "server/main.py"]