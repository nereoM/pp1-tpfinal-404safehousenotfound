import json
from flask import Blueprint, jsonify
from auth.decorators import role_required
from models.extensions import db
from models.schemes import Oferta_laboral, Licencia
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from models.schemes import Oferta_laboral, Licencia, Job_Application, Usuario, CV, Empresa
import os
from werkzeug.utils import secure_filename
from datetime import datetime, timezone

reclutador_bp = Blueprint("reclutador", __name__)

@reclutador_bp.route("/reclutador-home", methods=["GET"])
@role_required(["reclutador"])
def reclutador_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de reclutador"}), 200

@reclutador_bp.route("/definir_palabras_clave/<int:id_oferta>", methods=["POST"])
@role_required(["reclutador"])
def definir_palabras_clave(id_oferta):
    try:
        data = request.get_json()
        nuevas_palabras = data.get('palabras_clave')

        if not nuevas_palabras or not isinstance(nuevas_palabras, list):
            return jsonify({"error": "Se debe enviar una lista de palabras clave"}), 400

        oferta = Oferta_laboral.query.get(id_oferta)

        if not oferta:
            return jsonify({"error": f"No se encontró la oferta laboral con ID {id_oferta}"}), 404

        oferta.palabras_clave = json.dumps(nuevas_palabras)

        db.session.commit()

        return jsonify({"message": "Palabras clave actualizadas exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@reclutador_bp.route("/ver_candidatos/<int:id_oferta>", methods=["GET"])
@role_required(["reclutador"])
def ver_postulantes(id_oferta):
    try:
        oferta = Oferta_laboral.query.get(id_oferta)
        if not oferta:
            return jsonify({"error": "Oferta laboral no encontrada"}), 404

        postulaciones = Job_Application.query.filter_by(id_oferta=id_oferta).all()

        resultado = []
        for post in postulaciones:
            candidato = Usuario.query.get(post.id_candidato)
            cv = CV.query.get(post.id_cv) if post.id_cv else None

            resultado.append({
                "id_postulacion": post.id,
                "nombre": candidato.nombre,
                "email": candidato.correo,
                "fecha_postulacion": post.fecha_postulacion.isoformat(),
                "is_apto": post.is_apto,
                "cv_url": cv.url_cv if cv else None
            })

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reclutador_bp.route("/solicitud-licencia", methods=["POST"])
@role_required(["reclutador"])
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
        id_empresa=empleado.id_empresa
    )

    db.session.add(nueva_licencia)
    db.session.commit()

    return jsonify({
        "message": "Solicitud de licencia enviada exitosamente",
        "licencia": {
            "id": nueva_licencia.id,
            "tipo": nueva_licencia.tipo,
            "descripcion": nueva_licencia.descripcion,
            "estado": nueva_licencia.estado,
            "fecha_inicio": nueva_licencia.fecha_inicio.isoformat() if nueva_licencia.fecha_inicio else None,
            "empresa": {
                "id": nueva_licencia.id_empresa,
                "nombre": Empresa.query.get(nueva_licencia.id_empresa).nombre
            } 
        }
    }), 201

@reclutador_bp.route("/mis-licencias", methods=["GET"])
@role_required(["reclutador"])
def ver_mis_licencias():
    id_reclutador = get_jwt_identity()
    licencias = Licencia.query.filter_by(id_empleado=id_reclutador).all()

    resultado = [
        {
            "licencias": {
                "licencia": {
                    "id_licencia": licencia.id,
                    "tipo": licencia.tipo,
                    "descripcion": licencia.descripcion,
                    "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
                    "estado": licencia.estado,
                    "empresa": {
                        "id": licencia.id_empresa,
                        "nombre": Empresa.query.get(licencia.id_empresa).nombre
                    },
                    "certificado_url": licencia.certificado_url if licencia.certificado_url else None
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

@reclutador_bp.route("/subir-certificado/<int:id_licencia>", methods=["POST"])
@role_required(["reclutador"])
def subir_certificado(id_licencia):
    # Verificar si la licencia existe y pertenece al reclutador
    id_reclutador = get_jwt_identity()
    licencia = Licencia.query.get(id_licencia)
    empleado = Usuario.query.filter_by(id=id_reclutador).first()

    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    if licencia.id_empleado != empleado.id:
        return jsonify({"error": "No tienes permiso para modificar esta licencia"}), 403

    if licencia.estado != "aprobada":
        return jsonify({"error": "Solo se pueden subir certificados para licencias aprobadas"}), 400

    # Verificar si se envió un archivo
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    # Verificar si el archivo tiene un nombre válido y es un PDF
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Formato de archivo no permitido. Solo se aceptan archivos PDF"}), 400

    # Guardar el archivo en el servidor
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Actualizar la licencia con la URL del certificado
    licencia.certificado_url = f"/{UPLOAD_FOLDER}/{filename}"
    db.session.commit()

    return jsonify({"message": "Certificado subido exitosamente", "certificado_url": licencia.certificado_url}), 200