# Dockerfile para inicializar Railway
FROM docker/compose:latest

WORKDIR /app
COPY . /app
CMD ["docker-compose", "up", "--build"]