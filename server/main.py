from flask import Flask, redirect
from models.extensions import db
from services.config import Config
from services.swagger_config import setup_swagger_ui

from routes.auth_routes import auth_bp
from routes.admin404 import admin_404_bp
from routes.candidato import candidato_bp
from routes.reclutador import reclutador_bp
from routes.manager import manager_bp
from routes.admin_emp import admin_emp_bp

from flask_cors import CORS
from flask_jwt_extended import JWTManager
from initialize_admins import create_admins
from models.extensions import mail
from flask_migrate import Migrate

from ml.modelo import modelo_sbert

from flasgger import Swagger

app = Flask(__name__)
app.config.from_object(Config)
mail.init_app(app)
jwt = JWTManager(app)
jwt.init_app(app)
#CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
db.init_app(app)

app.register_blueprint(auth_bp,       url_prefix="/auth")
app.register_blueprint(candidato_bp,  url_prefix="/api")
app.register_blueprint(reclutador_bp, url_prefix="/api")
app.register_blueprint(manager_bp,    url_prefix="/api")
app.register_blueprint(admin_emp_bp,  url_prefix="/api")
app.register_blueprint(admin_404_bp,  url_prefix="/api")

# Para ver la documentacion ir a /apidocs
setup_swagger_ui(app=app)

migrate = Migrate(app, db)

@app.route("/")
def hello_world():
    return redirect(location="/apidocs")

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
