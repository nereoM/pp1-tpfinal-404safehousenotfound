# Usa la imagen oficial de Docker Compose
FROM docker/compose:latest

WORKDIR /app
COPY . /app

# Levanta el docker-compose dentro del contenedor
CMD ["docker-compose", "-f", "docker-compose.yml", "up"]