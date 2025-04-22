import os

from dotenv import load_dotenv

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Path to the .env file
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")


print("📦 Cargando .env...")
load_dotenv(dotenv_path=ENV_PATH)
print("✅ DATABASE_URL:", os.getenv("DATABASE_URL"))


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto")
