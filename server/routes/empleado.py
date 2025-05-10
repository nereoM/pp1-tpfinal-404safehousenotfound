from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.extensions import db
from models.schemes import Empresa, Licencia, Usuario, Oferta_laboral, CV, Job_Application
from auth.decorators import role_required
import os
from werkzeug.utils import secure_filename
from datetime import datetime, timezone
from flasgger import swag_from
from sqlalchemy import or_
from ml.modelo import modelo_sbert
from ml.extraction import extraer_texto_pdf, extraer_texto_word, predecir_cv
from ml.matching_semantico import dividir_cv_en_partes
from sklearn.metrics.pairwise import cosine_similarity
import json

empleado_bp = Blueprint("empleado", __name__)


UPLOAD_FOLDER_CV = os.path.join(os.getcwd(), "uploads", "cvs")
UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")

ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}

empleado_bp.config = {
    "UPLOAD_FOLDER": UPLOAD_FOLDER_CV,
    "IMAGE_UPLOAD_FOLDER": UPLOAD_FOLDER_IMG,
}

os.makedirs(UPLOAD_FOLDER_CV, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_IMG, exist_ok=True)


def allowed_file(filename):
    return (
        "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_CV_EXTENSIONS
    )


@empleado_bp.route("/empleado", methods=["GET"])
@role_required(["empleado"])
def empleado_home():
    return jsonify({"message": "Bienvenido al Inicio de Empleado"}), 200

@swag_from("../docs/empleado/solicitar-licencia.yml")
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

@swag_from("../docs/empleado/mis-licencias.yml")
@empleado_bp.route("/mis-licencias-emp", methods=["GET"])
@role_required(["empleado"])
def ver_mis_licencias():
    id_empleado = get_jwt_identity()
    licencias = Licencia.query.filter_by(id_empleado=id_empleado).all()

    resultado = [
        {
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
        for licencia in licencias
    ]

    return jsonify(resultado), 200

UPLOAD_FOLDER = "uploads/certificados"  # Carpeta donde se guardarán los certificados
ALLOWED_EXTENSIONS = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@swag_from("../docs/empleado/subir-certificado.yml")
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
    
@swag_from("../docs/empleado/ver-ofertas-empresa.yml")
@empleado_bp.route("/ver-ofertas-empresa", methods=["GET"])
@role_required(["empleado"])
def ver_ofertas_empresa():
    try:
        id_empleado = get_jwt_identity()
        empleado = Usuario.query.filter_by(id=id_empleado).first()

        if not empleado:
            return jsonify({"error": "Empleado no encontrado"}), 404

        if not empleado.id_empresa:
            return jsonify({"error": "No pertenecés a ninguna empresa"}), 403

        ofertas = Oferta_laboral.query.filter_by(id_empresa=empleado.id_empresa).all()

        resultado = [
            {
                "id": oferta.id,
                "nombre": oferta.nombre,
                "id_creador": oferta.id_creador,
                "employment_type": oferta.employment_type,
                "descripcion": oferta.descripcion,
                "fecha_publicacion": oferta.fecha_publicacion.isoformat(),
                "empresa": {
                    "id": oferta.empresa.id,
                    "nombre": oferta.empresa.nombre,
                },
            }
            for oferta in ofertas
        ]

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@swag_from("../docs/empleado/recomendaciones.yml")
@empleado_bp.route("/recomendaciones-empleado", methods=["GET"])
@role_required(["empleado"])
def recomendar_ofertas():
    try:
        id_empleado = get_jwt_identity()

        empleado = Usuario.query.get(id_empleado)

        cv = (
            CV.query.filter_by(id_candidato=id_empleado)
            .order_by(CV.fecha_subida.desc())
            .first()
        )
        if not cv:
            return jsonify({"error": "El empleado no tiene un CV cargado"}), 400

        if cv.tipo_archivo == "application/pdf":
            texto_cv = extraer_texto_pdf(cv.url_cv)
        elif cv.tipo_archivo.startswith("application/vnd.openxmlformats"):
            texto_cv = extraer_texto_word(cv.url_cv)
        else:
            return jsonify({"error": "Formato de CV no compatible"}), 400

        partes_cv = dividir_cv_en_partes(texto_cv)

        palabras_clave_cv = set(partes_cv)

        ofertas = (
            db.session.query(Oferta_laboral)
            .filter(Oferta_laboral.is_active == True)
            .filter(Oferta_laboral.id_empresa == empleado.id_empresa)
            .filter(
                or_(*[Oferta_laboral.palabras_clave.like(f"%{palabra}%") for palabra in palabras_clave_cv])
            )
            .limit(10)
            .all()
        )

        recomendaciones = []

        for oferta in ofertas:
            palabras_clave = json.loads(oferta.palabras_clave)
            vectores_cv = modelo_sbert.encode(partes_cv)
            vector_keywords = modelo_sbert.encode(" ".join(palabras_clave))
            max_sim = max(cosine_similarity([vector_keywords], vectores_cv)[0])
            porcentaje = int(max_sim * 100)

            recomendaciones.append(
                {
                    "id_oferta": oferta.id,
                    "nombre_oferta": oferta.nombre,
                    "empresa": oferta.empresa.nombre,
                    "coincidencia": porcentaje,
                    "palabras_clave": palabras_clave,
                }
            )

        recomendaciones.sort(key=lambda r: r["coincidencia"], reverse=True)
        return jsonify(recomendaciones[:3]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@swag_from("../docs/empleado/subir-cv.yml")
@empleado_bp.route("/upload-cv-empleado", methods=["POST"])
@role_required(["empleado"])
def upload_cv():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_file(file.filename):
        id_candidato = get_jwt_identity()
        original_filename = secure_filename(file.filename)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        nombre_final = f"{original_filename.rsplit('.', 1)[0]}_{timestamp}.{original_filename.rsplit('.', 1)[1]}"

        upload_folder = empleado_bp.config["UPLOAD_FOLDER"]
        filepath = os.path.join(upload_folder, nombre_final)

        file.save(filepath)

        tipo_archivo = file.mimetype
        url_cv = f"uploads/cvs/{nombre_final}"

        nuevo_cv = CV(
            id_candidato=id_candidato,
            url_cv=url_cv,
            tipo_archivo=tipo_archivo,
            fecha_subida=datetime.now(timezone.utc),
        )

        db.session.add(nuevo_cv)
        db.session.commit()

        return jsonify(
            {
                "message": "CV subido exitosamente",
                "file_path": url_cv,
                "filename": nombre_final,
            }
        ), 201

    return jsonify({"error": "Formato de archivo no permitido"}), 400

@empleado_bp.route("/info-empleado", methods=["GET"])
@jwt_required()
@swag_from("../docs/empleado/info-empleado.yml")
def obtener_nombre_apellido_empleado():
    id_empleado = get_jwt_identity()
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Candidato no encontrado"}), 404

    return {
        "nombre": empleado.nombre,
        "apellido": empleado.apellido,
        "username": empleado.username,
        "correo": empleado.correo,
    }

@swag_from("../docs/empleado/ofertas-filtradas.yml")
@empleado_bp.route("/ofertas-filtradas-empleado", methods=["GET"])
@role_required(["empleado"])
def obtener_ofertas_filtradas():
    try:
        filtros = request.args.to_dict()
        query = db.session.query(Oferta_laboral)
        query = construir_query_con_filtros(filtros, query)
        ofertas = query.all()

        resultado = [
            {
                "id": oferta.id,
                "nombre_oferta": oferta.nombre,
                "empresa": oferta.empresa.nombre,
                "palabras_clave": json.loads(oferta.palabras_clave or "[]"),
            }
            for oferta in ofertas
        ]
        return jsonify(resultado), 200

    except Exception as e:
        print("Error en /ofertas-filtradas:", e)
        return jsonify({"error": str(e)}), 500

@swag_from("../docs/empleado/ofertas-por-empresa.yml")
@empleado_bp.route("/empresas-empleado/<string:nombre_empresa>/ofertas", methods=["GET"])
@role_required(["empleado"])
def obtener_ofertas_por_nombre_empresa(nombre_empresa):
    # Buscar la empresa por su nombre
    empresa = Empresa.query.filter_by(nombre=nombre_empresa).first()
    if not empresa:
        return jsonify({"error": "Empresa no encontrada"}), 404

    filtros = request.args.to_dict()
    query = Oferta_laboral.query.filter_by(id_empresa=empresa.id)

    query = construir_query_con_filtros(filtros, query)

    # Obtener las ofertas laborales asociadas a la empresa
    ofertas = query.all()
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
            "fecha_cierre": oferta.fecha_cierre,
        }
        for oferta in ofertas
    ]
    return jsonify(
        {
            "empresa": {
                "id": empresa.id,
                "nombre": empresa.nombre,
                "correo": empresa.correo,
            },
            "ofertas": resultado,
        }
    ), 200


@swag_from('../docs/empleado/mis-cvs.yml')
@empleado_bp.route("/mis-cvs-empleado", methods=["GET"])
@role_required(["empleado"])
def listar_cvs():
    id_empleado = get_jwt_identity()
    cvs = (
        CV.query.filter_by(id_candidato=id_empleado)
        .order_by(CV.fecha_subida.desc())
        .all()
    )

    return jsonify(
        [
            {
                "id": cv.id,
                "url": cv.url_cv,
                "tipo_archivo": cv.tipo_archivo,
                "fecha_subida": cv.fecha_subida.isoformat(),
            }
            for cv in cvs
        ]
    ), 200

@swag_from('../docs/empleado/postularme.yml')
@empleado_bp.route("/postularme-empleado", methods=["POST"])
@role_required(["empleado"])
def postularme():
    data = request.get_json()
    id_oferta = data.get("id_oferta")
    id_cv = data.get("id_cv")

    if not id_oferta or not id_cv:
        return jsonify({"error": "Falta id de oferta o CV seleccionado"}), 400

    id_empleado = get_jwt_identity()

    empleado = Usuario.query.filter_by(id=id_empleado).first()
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    cv = CV.query.filter_by(id=id_cv, id_candidato=id_empleado).first()
    if not cv:
        return jsonify({"error": "CV inválido o no pertenece al usuario"}), 403

    oferta = Oferta_laboral.query.get(id_oferta)
    if not oferta:
        return jsonify({"error": "Oferta laboral no encontrada"}), 404
    
    if empleado.id_empresa != oferta.id_empresa:
        return jsonify({"error": "No puedes postularte a esta oferta laboral"}), 403

    nueva_postulacion = Job_Application(
        id_candidato=id_empleado,
        id_oferta=id_oferta,
        id_cv=id_cv,
        is_apto=predecir_cv(oferta.palabras_clave, cv),
        fecha_postulacion=datetime.now(timezone.utc),
    )

    db.session.add(nueva_postulacion)
    db.session.commit()

    return jsonify({"message": "Postulación realizada correctamente."}), 201


def construir_query_con_filtros(filtros, query):
    if "location" in filtros and filtros["location"]:
        query = query.filter(Oferta_laboral.location.ilike(f"%{filtros['location']}%"))

    if "workplace_type" in filtros and filtros["workplace_type"]:
        query = query.filter(Oferta_laboral.workplace_type == filtros["workplace_type"])

    if "employment_type" in filtros and filtros["employment_type"]:
        query = query.filter(
            Oferta_laboral.employment_type == filtros["employment_type"]
        )

    if "experience_level" in filtros and filtros["experience_level"]:
        query = query.filter(
            Oferta_laboral.experience_level == filtros["experience_level"]
        )

    if "keywords" in filtros and filtros["keywords"]:
        keywords = [
            kw.strip().lower() for kw in filtros["keywords"].split(",") if kw.strip()
        ]
        for kw in keywords:
            query = query.filter(Oferta_laboral.palabras_clave.ilike(f"%{kw}%"))

    if "salary_min" in filtros and filtros["salary_min"]:
        try:
            query = query.filter(
                Oferta_laboral.salary_min >= int(filtros["salary_min"])
            )
        except ValueError:
            pass  # opcional: loguear error

    if "salary_max" in filtros and filtros["salary_max"]:
        try:
            query = query.filter(
                Oferta_laboral.salary_max <= int(filtros["salary_max"])
            )
        except ValueError:
            pass  # opcional: loguear error

    return query