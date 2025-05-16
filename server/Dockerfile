# Dockerfile del backend
FROM python:3.11-slim

WORKDIR /app
COPY . /app

# 🔄 Esto permite que Flask encuentre el .env en su ubicación original
ENV FLASK_ENV=production
ENV ENV_FILE_LOCATION=/app/server/.env

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]