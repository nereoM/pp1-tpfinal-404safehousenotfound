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
    && apt-get clean

# Seteamos el directorio de trabajo
WORKDIR /app

# Copiamos el código
COPY . .

# Instalación de dependencias de Python
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Exponemos el puerto para Railway
EXPOSE 5000

# Comando para ejecutar Flask
CMD ["python3", "server/main.py"]