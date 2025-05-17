# ============================
# Etapa 1 - Construcción
# ============================
FROM python:3.11-slim AS builder

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

WORKDIR /app

# Copiar solo el requirements para evitar reinstalar si el código cambia
COPY requirements.txt .

# Instalación de dependencias en una carpeta aislada
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt -t /app/deps

# ============================
# Etapa 2 - Imagen final
# ============================
FROM python:3.11-slim

WORKDIR /app

# Copiamos solamente las dependencias necesarias
COPY --from=builder /app/deps /app
COPY . .

# Eliminamos caché de pip
RUN rm -rf /root/.cache/pip

# Exponemos el puerto
EXPOSE 5000

# Comando para ejecutar Flask
CMD ["python3", "server/main.py"]