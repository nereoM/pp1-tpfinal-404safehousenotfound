from flask import Blueprint, jsonify, request
from auth.decorators import role_required
import os
from werkzeug.utils import secure_filename
from models.schemes import Usuario, Rol, TarjetaCredito, Empresa
from models.extensions import db

candidato_bp = Blueprint("candidato", __name__)

@candidato_bp.route("/candidato-home", methods=["GET"])
@role_required(["candidato"])
def candidato_home():
    return jsonify({"message": "Bienvenido al dashboard de candidato"}), 200

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads/cvs')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
candidato_bp.config = {"UPLOAD_FOLDER": UPLOAD_FOLDER}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@candidato_bp.route("/upload-cv", methods=["POST"])
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
        filepath = os.path.join(candidato_bp.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        return jsonify({"message": "CV subido exitosamente", "file_path": filepath}), 201

    return jsonify({"error": "Formato de archivo no permitido"}), 400

@candidato_bp.route("/registrar-empresa", methods=["POST"])
@role_required(["candidato"])
def registrar_empresa():
    data = request.get_json()
    identifier = data.get("username")
    nombre_tarjeta = data.get("card_name")
    numero_tarjeta = data.get("card_number")
    cvv_tarjeta = data.get("card_cvv")
    tipo_tarjeta = data.get("card_type")
    nombre_empresa = data.get("company_name")
    
    if not identifier:
        return jsonify({"error": "Debe ingresar username o email"}), 400

    user = Usuario.query.filter((Usuario.username == identifier) | (Usuario.correo == identifier)).first()
    if user:
        if not nombre_tarjeta or not numero_tarjeta or not cvv_tarjeta:
            return jsonify({"error": "Los datos de la tarjeta son obligatorios"}), 400
        if not nombre_empresa:
            return jsonify({"error": "El nombre de la empresa es obligatorio"}), 400
        
        admin_emp_role = db.session.query(Rol).filter_by(slug="admin-emp").first()
        # Si no existe el rol admin-emp, crearlo
        if not admin_emp_role:
            admin_emp_role = Rol(nombre="Admin-EMP", permisos="permisos_admin_emp", slug="admin-emp")
            db.session.add(admin_emp_role)
            db.session.commit()

        user.roles.clear()
        user.roles.append(admin_emp_role)
        db.session.commit()

        # Crear la empresa asociada al usuario
        nueva_empresa = Empresa(
            nombre=nombre_empresa,
            id_admin_emp=user.id,
        )
        db.session.add(nueva_empresa)
        db.session.commit()
        nueva_empresa.admin_emp = user
        db.session.commit()

        # Crear la tarjeta asociada al usuario
        nueva_tarjeta = TarjetaCredito(
            numero_tarjeta=numero_tarjeta,
            nombre=nombre_tarjeta,
            tipo=tipo_tarjeta,
            cvv=cvv_tarjeta,
            usuario_id=user.id,
        )
        db.session.add(nueva_tarjeta)
        db.session.commit()
        nueva_tarjeta.usuario = user
        db.session.commit()

        return jsonify({"message": "Empresa registrada exitosamente"}), 201
    return jsonify({"error": "Usuario no encontrado"}), 404