from flask import Flask
from models.extensions import db
from services.config import Config
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from initialize_admins import create_admins
from models.extensions import mail

app = Flask(__name__)
app.config.from_object(Config)
mail.init_app(app)
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
db.init_app(app)
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(dashboard_bp, url_prefix="/api")

@app.route("/")
def hello_world():
    return "Hello, World!"

def iniciar_app():
    
    iniciar_db()
    return app

def iniciar_db():
    with app.app_context():
        print("Conectando a:", app.config["SQLALCHEMY_DATABASE_URI"])
        try:
            db.create_all()
            create_admins()
            print("Conexión exitosa a la base de datos MySQL")
        except Exception as e:
            print("Error de conexión:", e)
            
if __name__ == "__main__":
    iniciar_db()

    app.run(debug=True)
