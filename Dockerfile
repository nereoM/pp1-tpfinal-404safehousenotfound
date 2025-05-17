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
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar solo el requirements para evitar reinstalar si el código cambia
COPY requirements.txt .

# Instalación de pip y wheel
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 🔥 Descargar el wheel precompilado sin CUDA
RUN wget https://download.pytorch.org/whl/cpu/torch-2.0.1%2Bcpu-cp311-cp311-linux_x86_64.whl
RUN wget https://download.pytorch.org/whl/cpu/torchvision-0.15.2%2Bcpu-cp311-cp311-linux_x86_64.whl

# 🔥 Instalar la versión correcta (sin CUDA)
RUN pip install --no-cache-dir torch-2.0.1+cpu-cp311-cp311-linux_x86_64.whl
RUN pip install --no-cache-dir torchvision-0.15.2+cpu-cp311-cp311-linux_x86_64.whl
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