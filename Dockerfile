# Etapa 1: build del frontend
FROM node:20-alpine AS client-build
WORKDIR /app

# 👉 Variable de entorno para Vite
ENV VITE_API_URL=https://appsigrh-production.up.railway.app

# Copiar archivos necesarios para el build del frontend
COPY client/package.json ./package.json
COPY client/package-lock.json ./package-lock.json
COPY client/vite.config.js ./vite.config.js
COPY client/index.html ./index.html
COPY client/src ./src
COPY client/public ./public

RUN npm install && npm run build

# Etapa 2: Backend con Flask
FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

# Dependencias necesarias
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Mismo path que tenías localmente: /app/server
WORKDIR /app/server

# Instalar requirements
COPY requirements.txt ../requirements.txt
RUN pip install --no-cache-dir -r ../requirements.txt && \
    rm -rf ~/.cache && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copiar backend completo
COPY server/ .

# Copiar build del frontend al backend (dentro de /app/server/dist)
COPY --from=client-build /app/dist ./dist

# Exponer el puerto del backend
EXPOSE 5000

# Iniciar el servidor con gunicorn
CMD ["gunicorn", "--timeout", "120", "-w", "1", "-b", "0.0.0.0:5000", "main:app"]
