from flask import Blueprint, jsonify, request
from auth.decorators import role_required
import os
from werkzeug.utils import secure_filename
from models.schemes import Usuario, Rol, TarjetaCredito, Empresa, Oferta_laboral
from models.extensions import db
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timezone
from models.schemes import CV, Job_Application
from ml.extraction import predecir_cv

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

@candidato_bp.route("/tiene-cv", methods=["GET"])
@role_required(["candidato"])
def tiene_cv():
    id_candidato = get_jwt_identity()
    cv = CV.query.filter_by(id_candidato=id_candidato).first()
    
    if cv:
        return jsonify({"has_cv": True, "cv_url": cv.url_cv}), 200
    else:
        return jsonify({"has_cv": False}), 200

@candidato_bp.route("/postularme", methods=["POST"])
@role_required(["candidato"])
def postularme():
    data = request.get_json()
    id_oferta = data.get("id_oferta")
    id_cv = data.get("id_cv")

    if not id_oferta or not id_cv:
        return jsonify({"error": "Falta id de oferta o CV seleccionado"}), 400

    id_candidato = get_jwt_identity()

    cv = CV.query.filter_by(id=id_cv, id_candidato=id_candidato).first()
    if not cv:
        return jsonify({"error": "CV inválido o no pertenece al usuario"}), 403
    
    oferta = Oferta_laboral.query.get(id_oferta)
    if not oferta:
        return jsonify({"error": "Oferta laboral no encontrada"}), 404

    nueva_postulacion = Job_Application(
        id_candidato=id_candidato,
        id_oferta=id_oferta,
        id_cv=id_cv,
        is_apto=predecir_cv(oferta.palabras_clave, cv.url_cv),
        fecha_postulacion=datetime.now(timezone.utc),
    )

    db.session.add(nueva_postulacion)
    db.session.commit()

    return jsonify({"message": "Postulación realizada correctamente."}), 201

@candidato_bp.route("/mis-cvs", methods=["GET"])
@role_required(["candidato"])
def listar_cvs():
    id_candidato = get_jwt_identity()
    cvs = CV.query.filter_by(id_candidato=id_candidato).order_by(CV.fecha_subida.desc()).all()

    return jsonify([
        {
            "id": cv.id,
            "url": cv.url_cv,
            "tipo_archivo": cv.tipo_archivo,
            "fecha_subida": cv.fecha_subida.isoformat()
        }
        for cv in cvs
    ]), 200


@candidato_bp.route("/upload-cv", methods=["POST"])
@role_required(["candidato"])
def upload_cv():
    if 'file' not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = candidato_bp.config["UPLOAD_FOLDER"]
        filepath = os.path.join(upload_folder, filename)

        file.save(filepath)

        id_candidato = get_jwt_identity()
        
        tipo_archivo = file.mimetype

        url_cv = f"/uploads/{filename}"

        nuevo_cv = CV(
            id_candidato=id_candidato,
            url_cv=url_cv,
            tipo_archivo=tipo_archivo,
            fecha_subida=datetime.now(timezone.utc)
        )

        db.session.add(nuevo_cv)
        db.session.commit()

        return jsonify({"message": "CV subido exitosamente", "file_path": url_cv}), 201

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
        user.id_empresa = nueva_empresa.id
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

@candidato_bp.route("/empresas", methods=["GET"])
@role_required(["candidato"])
def obtener_empresas():
    empresas = Empresa.query.all()
    resultado = [
        {
            "id": empresa.id,
            "nombre": empresa.nombre,
            "correo": empresa.correo
        }
        for empresa in empresas
    ]
    return jsonify(resultado), 200

@candidato_bp.route("/empresas/<string:nombre_empresa>/ofertas", methods=["GET"])
@role_required(["candidato"])
def obtener_ofertas_por_nombre_empresa(nombre_empresa):
    # Buscar la empresa por su nombre
    empresa = Empresa.query.filter_by(nombre=nombre_empresa).first()
    if not empresa:
        return jsonify({"error": "Empresa no encontrada"}), 404

    # Obtener las ofertas laborales asociadas a la empresa
    ofertas = Oferta_laboral.query.filter_by(id_empresa=empresa.id).all()
    resultado = [
        {
            "id": oferta.id,
            "nombre": oferta.nombre,
            "descripcion": oferta.descripcion,
            "location": oferta.location,
            "employment_type": oferta.employment_type,
            "workplace_type": oferta.workplace_type,
            "salary_min": oferta.salary_min,
            "salary_max": oferta.salary_max,
            "currency": oferta.currency,
            "experience_level": oferta.experience_level,
            "fecha_publicacion": oferta.fecha_publicacion,
            "fecha_cierre": oferta.fecha_cierre
        }
        for oferta in ofertas
    ]
    return jsonify({
        "empresa": {
            "id": empresa.id,
            "nombre": empresa.nombre,
            "correo": empresa.correo
        },
        "ofertas": resultado
    }), 200