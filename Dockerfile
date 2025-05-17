# ============================
# Etapa 1 - Construcción
# ============================
FROM python:3.12-alpine AS builder

# Instalación de dependencias del sistema en Alpine
RUN apk update && apk add --no-cache \
    build-base \
    mariadb-dev \
    python3-dev \
    gcc \
    musl-dev \
    libffi-dev \
    pkg-config \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copiar solo el requirements para evitar reinstalar si el código cambia
COPY requirements.txt .

# Instalación de dependencias en una carpeta aislada
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt -t /app/deps

# ============================
# Etapa 2 - Imagen final
# ============================
FROM python:3.12-alpine

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