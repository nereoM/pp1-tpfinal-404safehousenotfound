from flask import Flask
from models.extensions import db
from services.config import Config
from models.users import Usuario, Rol, UsuarioRol

app = Flask(__name__)
app.config.from_object(Config)

@app.route("/")
def hello_world():
    return "Hello, World!"

@app.route("/api/users")
def get_users():
    return {
        "users": ["Alice", "Bob", "Charlie"]
    }

def iniciar_db():
    db.init_app(app)
    with app.app_context():
        print("Conectando a:", app.config["SQLALCHEMY_DATABASE_URI"])
        try:
            db.create_all()
            print("Conexión exitosa a la base de datos MySQL")
        except Exception as e:
            print("Error de conexión:", e)

if __name__ == "__main__":
    iniciar_db()
    app.run(debug=True)