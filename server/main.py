from flask import Flask
from models.extensions import db
from services.config import Config
from routes.auth_routes import auth_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

app.register_blueprint(auth_bp, url_prefix="/auth")

@app.route("/")
def hello_world():
    return "Hello, World!"

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