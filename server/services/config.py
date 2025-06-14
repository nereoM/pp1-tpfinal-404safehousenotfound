import os

from dotenv import load_dotenv

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Path to the .env file
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")


print("📦 Cargando .env...")
load_dotenv(dotenv_path=ENV_PATH)
print("✅ DATABASE_URL:", os.getenv("DATABASE_URL"))
print("📝 DOCUMENTACION: http://localhost:5000/apidocs")


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "clave_para_jwt")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    EMBEDDINGS_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
    DOMINIO_PUBLICO = os.getenv("DOMINIO_PUBLICO")
    
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_SAMESITE = "Lax"
    JWT_ACCESS_COOKIE_NAME = "access_token_cookie"
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_COOKIE_PATH = "/"

    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")

