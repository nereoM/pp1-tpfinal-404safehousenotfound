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

# Reemplazar torch y torchvision por las versiones optimizadas
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir torch==2.0.1+cpu torchvision==0.15.2+cpu -f https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt -t /app/deps

# ============================
# Etapa 2 - Imagen final
# ============================
FROM python:3.11-slim

WORKDIR /app

# Copiamos solamente las dependencias necesarias
COPY --from=builder /app/deps /app
COPY . .

# Limpiar compiladores y caché
RUN apt-get remove -y gcc build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /root/.cache/pip

# Exponemos el puerto
EXPOSE 5000

# Comando para ejecutar Flask
CMD ["python3", "server/main.py"]