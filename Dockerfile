# ============================
# Etapa 1 - Construcción
# ============================
FROM python:3.11-slim AS builder

# Instalación de dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libmariadb-dev \
    python3-dev \
    gcc \
    libffi-dev \
    libxml2-dev \
    libxslt-dev \
    mariadb-client \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar solo el requirements para evitar reinstalar si el código cambia
COPY requirements.txt .

# Instalación de dependencias
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# ============================
# Etapa 2 - Imagen final
# ============================
FROM python:3.11-slim

WORKDIR /app

# Copiamos solamente las dependencias necesarias
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .

# Eliminamos caché de pip
RUN rm -rf /root/.cache/pip

# Exponemos el puerto
EXPOSE 5000

# Comando para ejecutar Flask
CMD ["python3", "server/main.py"]