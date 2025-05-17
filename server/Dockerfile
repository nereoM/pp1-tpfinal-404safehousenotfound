# Imagen base oficial de Python, versión slim para que sea más liviana
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Seteamos el directorio de trabajo
WORKDIR /app

# Ignoramos node_modules y archivos innecesarios
COPY . .

# Eliminamos caché de pip y archivos innecesarios para reducir espacio
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Limpiamos el caché de pip y logs
RUN rm -rf /root/.cache/pip
RUN apt-get autoremove -y && apt-get clean

# Exponemos el puerto para Railway
EXPOSE 5000

# Comando para ejecutar Flask
CMD ["python3", "server/main.py"]
