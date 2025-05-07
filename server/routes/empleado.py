from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from models.extensions import db
from models.schemes import Empresa, Licencia, Usuario
from auth.decorators import role_required
import os
from werkzeug.utils import secure_filename
from datetime import datetime

empleado_bp = Blueprint("empleado", __name__)

@empleado_bp.route("/empleado", methods=["GET"])
@role_required(["empleado"])
def empleado_home():
    return jsonify({"message": "Bienvenido al Inicio de Empleado"}), 200

@empleado_bp.route("/solicitar-licencia", methods=["POST"])
@role_required(["empleado"])
def solicitar_licencia():
    data = request.get_json()
    tipo_licencia = data.get("lic_type")
    descripcion = data.get("description")

    id_empleado = get_jwt_identity()
    empleado = Usuario.query.filter_by(id=id_empleado).first()

    nueva_licencia = Licencia(
        id_empleado=id_empleado,
        tipo=tipo_licencia,
        descripcion=descripcion,
        estado="pendiente",
        id_empresa=empleado.id_empresa,
    )

    db.session.add(nueva_licencia)
    db.session.commit()

    return jsonify(
        {
            "message": "Solicitud de licencia enviada exitosamente",
            "licencia": {
                "id": nueva_licencia.id,
                "tipo": nueva_licencia.tipo,
                "descripcion": nueva_licencia.descripcion,
                "estado": nueva_licencia.estado,
                "fecha_inicio": nueva_licencia.fecha_inicio.isoformat()
                if nueva_licencia.fecha_inicio
                else None,
                "empresa": {
                    "id": nueva_licencia.id_empresa,
                    "nombre": Empresa.query.get(nueva_licencia.id_empresa).nombre,
                },
            },
        }
    ), 201

@empleado_bp.route("/mis-licencias-emp", methods=["GET"])
@role_required(["empleado"])
def ver_mis_licencias():
    id_empleado = get_jwt_identity()
    licencias = Licencia.query.filter_by(id_empleado=id_empleado).all()

    resultado = [
        {
            "licencias": {
                "licencia": {
                    "id_licencia": licencia.id,
                    "tipo": licencia.tipo,
                    "descripcion": licencia.descripcion,
                    "fecha_inicio": licencia.fecha_inicio.isoformat()
                    if licencia.fecha_inicio
                    else None,
                    "estado": licencia.estado,
                    "empresa": {
                        "id": licencia.id_empresa,
                        "nombre": Empresa.query.get(licencia.id_empresa).nombre,
                    },
                    "certificado_url": licencia.certificado_url
                    if licencia.certificado_url
                    else None,
                }
            }
        }
        for licencia in licencias
    ]

    return jsonify(resultado), 200

UPLOAD_FOLDER = "uploads/certificados"  # Carpeta donde se guardarán los certificados
ALLOWED_EXTENSIONS = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@empleado_bp.route("/subir-certificado-emp/<int:id_licencia>", methods=["POST"])
@role_required(["empleado"])
def subir_certificado(id_licencia):
    # Verificar si la licencia existe y pertenece al empleado
    id_empleado = get_jwt_identity()
    licencia = Licencia.query.get(id_licencia)
    empleado = Usuario.query.filter_by(id=id_empleado).first()

    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    if licencia.id_empleado != empleado.id:
        return jsonify({"error": "No tienes permiso para modificar esta licencia"}), 403

    if licencia.estado != "aprobada":
        return jsonify(
            {"error": "Solo se pueden subir certificados para licencias aprobadas"}
        ), 400

    # Verificar si se envió un archivo
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify(
            {"error": "Formato de archivo no permitido. Solo se aceptan archivos PDF"}
        ), 400

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = secure_filename(file.filename.rsplit(".", 1)[0])
    ext = file.filename.rsplit(".", 1)[1].lower()
    nombre_final = f"{filename}_{timestamp}.{ext}"

    filepath = os.path.join(UPLOAD_FOLDER, nombre_final)
    file.save(filepath)

    licencia.certificado_url = f"/{UPLOAD_FOLDER}/{nombre_final}"
    db.session.commit()

    return jsonify(
        {
            "message": "Certificado subido exitosamente",
            "certificado_url": licencia.certificado_url,
        }
    ), 200