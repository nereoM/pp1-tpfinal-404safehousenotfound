from flask import Blueprint, jsonify
from auth.decorators import role_required
from flask import request
from models.users import Usuario, Rol
from models.extensions import db
import os
from werkzeug.utils import secure_filename

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/candidato", methods=["GET"])
@role_required(["candidato"])
def candidato_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de candidato"}), 200

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads/cvs')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
dashboard_bp.config = {"UPLOAD_FOLDER": UPLOAD_FOLDER}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@dashboard_bp.route("/dashboard/candidato/upload-cv", methods=["POST"])
@role_required(["candidato"])
def upload_cv():
    print(request.files)
    print(request.form)
    if 'file' not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(dashboard_bp.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        return jsonify({"message": "CV subido exitosamente", "file_path": filepath}), 201

    return jsonify({"error": "Formato de archivo no permitido"}), 400

@dashboard_bp.route("/dashboard/reclutador", methods=["GET"])
@role_required(["reclutador"])
def reclutador_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de reclutador"}), 200

@dashboard_bp.route("/dashboard/admin/register-reclutador", methods=["POST"])
@role_required(["admin"])
def register_reclutador():
    data = request.get_json()
    nombre = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not nombre or not email or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if Usuario.query.filter_by(correo=email).first():
        return jsonify({"error": "El email ya está registrado"}), 400

    reclutador_role = db.session.query(Rol).filter_by(slug="reclutador").first()
    if not reclutador_role:
        # return jsonify({"error": "Default role 'candidato' not found"}), 500
        reclutador_role = Rol(nombre="Reclutador", permisos="permisos_reclutador", slug="reclutador")
        db.session.add(reclutador_role)
        db.session.commit()

    nuevo_reclutador = Usuario(
        nombre=nombre,
        correo=email,
        contrasena=password)
    nuevo_reclutador.roles.append(reclutador_role)

    db.session.add(nuevo_reclutador)
    db.session.commit()

    return jsonify({"message": "Reclutador registrado exitosamente"}), 201

@dashboard_bp.route("/dashboard/admin", methods=["GET"])
@role_required(["admin"])
def admin_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de admin"}), 200