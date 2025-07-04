from flask import Flask, redirect
from models.extensions import db
from services.config import Config
from services.swagger_config import setup_swagger_ui
import os

from routes.notificacion import configurar_webhook

from routes.auth_routes import auth_bp
from routes.admin404 import admin_404_bp
from routes.candidato import candidato_bp
from routes.reclutador import reclutador_bp
from routes.manager import manager_bp
from routes.admin_emp import admin_emp_bp
from routes.empleado import empleado_bp
from routes.imagenes import imagenes_bp
from routes.reportes import reportes_bp
from routes.chatbot import chatbot_bp
from routes.notificacion import notificacion_bp

from apscheduler.schedulers.background import BackgroundScheduler
from models.schemes import Licencia
from datetime import datetime

from flask_cors import CORS
from flask_jwt_extended import JWTManager
#from initialize_admins import create_admins
from models.extensions import mail
from flask_migrate import Migrate

from ml.modelo import modelo_sbert
#from ml.desempeno_desarrollo.generation import main as ejecutar_generation

from flasgger import Swagger
import webbrowser
import threading
import time
import sys

app = Flask(__name__)
app.static_folder = os.path.join(os.path.abspath(os.path.dirname(__file__)), "dist")
app.config.from_object(Config)
mail.init_app(app)
jwt = JWTManager(app)
jwt.init_app(app)
#CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:5173", 
    "https://appsigrh-production.up.railway.app"
]}}, supports_credentials=True)
db.init_app(app)
#webbrowser.open("http://localhost:5000")
#BASE_DIR = os.path.abspath(os.path.dirname(__file__))
#sys.path.append(BASE_DIR)

app.register_blueprint(auth_bp,       url_prefix="/auth")
app.register_blueprint(candidato_bp,  url_prefix="/api")
app.register_blueprint(reclutador_bp, url_prefix="/api")
app.register_blueprint(manager_bp,    url_prefix="/api")
app.register_blueprint(admin_emp_bp,  url_prefix="/api")
app.register_blueprint(admin_404_bp,  url_prefix="/api")
app.register_blueprint(empleado_bp,   url_prefix="/api")
app.register_blueprint(imagenes_bp, url_prefix="/api")
app.register_blueprint(reportes_bp, url_prefix="/api")
app.register_blueprint(chatbot_bp, url_prefix="/api")
app.register_blueprint(notificacion_bp, url_prefix="/api")

#### AGREGADO PARA VER CERTIFICADOS ####
from flask import send_from_directory
from werkzeug.utils import secure_filename
import os

def open_frontend():
    time.sleep(1)
    webbrowser.open("http://localhost:5173")

@app.route('/uploads/certificados/<path:filename>')
def descargar_certificado(filename):
    filename = secure_filename(filename)  # evita rutas maliciosas
    carpeta = os.path.join(os.getcwd(), 'uploads', 'certificados')
    return send_from_directory(carpeta, filename)
#### FIN AGREGADO PARA VER CERTIFICADOS ####

@app.route('/uploads/fotos/<path:filename>')
def descargar_foto(filename):
    filename = secure_filename(filename)
    carpeta = os.path.join(os.getcwd(), 'uploads', 'fotos')
    return send_from_directory(carpeta, filename)

@app.route('/uploads/cvs/<path:filename>')
def descargar_cv(filename):
    filename = secure_filename(filename)
    carpeta = os.path.join(os.getcwd(), 'uploads', 'cvs')
    return send_from_directory(carpeta, filename)


# Para ver la documentacion ir a /apidocs
setup_swagger_ui(app=app)

migrate = Migrate(app, db)

@app.route("/apidocs")
def docs():
    return redirect("/apidocs")

@app.route('/assets/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    return send_from_directory(app.static_folder, 'index.html')

def iniciar_app():
    
    iniciar_db()
    return app

def iniciar_db():
    with app.app_context():
        print("Conectando a:", app.config["SQLALCHEMY_DATABASE_URI"])
        try:
            db.create_all()
            #create_admins()
            print("Conexión exitosa a la base de datos MySQL")
        except Exception as e:
            print("Error de conexión:", e)
"""
def activar_licencias():
    print(f"Revisando licencias aprobadas... - {datetime.now()}")
    
    # Buscar todas las licencias en estado "aprobada" y con fecha de inicio menor o igual a ahora
    licencias = Licencia.query.filter(Licencia.estado == "aprobada", Licencia.fecha_inicio <= datetime.now()).all()
    
    for licencia in licencias:
        print(f"Activando licencia: {licencia.id}")
        licencia.estado = "activa"
        db.session.commit()

scheduler = BackgroundScheduler()
scheduler.add_job(activar_licencias, 'interval', minutes=5)
scheduler.start()
"""            
with app.app_context():
    configurar_webhook()

if __name__ == "__main__":
    iniciar_db()
    #ejecutar_generation()
    #threading.Thread(target=open_frontend).start()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)