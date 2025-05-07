import json
import os
from datetime import datetime, timezone

from auth.decorators import role_required
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from ml.extraction import extraer_texto_pdf, extraer_texto_word, predecir_cv
from ml.matching_semantico import dividir_cv_en_partes
from ml.modelo import modelo_sbert
from models.extensions import db
from models.schemes import (
    CV,
    Empresa,
    Job_Application,
    Oferta_laboral,
    Rol,
    TarjetaCredito,
    Usuario,
)
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.sql.expression import func, or_
from werkzeug.utils import secure_filename
from flasgger import swag_from

candidato_bp = Blueprint("candidato", __name__)


@candidato_bp.route("/candidato-home", methods=["GET"])
@role_required(["candidato"])
def candidato_home():
    return jsonify({"message": "Bienvenido al dashboard de candidato"}), 200


UPLOAD_FOLDER_CV = os.path.join(os.getcwd(), "uploads", "cvs")
UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")

ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}

candidato_bp.config = {
    "UPLOAD_FOLDER": UPLOAD_FOLDER_CV,
    "IMAGE_UPLOAD_FOLDER": UPLOAD_FOLDER_IMG,
}

os.makedirs(UPLOAD_FOLDER_CV, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_IMG, exist_ok=True)


def allowed_file(filename):
    return (
        "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_CV_EXTENSIONS
    )


@swag_from('../docs/candidato/tiene-cv.yml')
@candidato_bp.route("/tiene-cv", methods=["GET"])
@role_required(["candidato"])
def tiene_cv():
    id_candidato = get_jwt_identity()
    cv = CV.query.filter_by(id_candidato=id_candidato).first()

    if cv:
        return jsonify({"has_cv": True, "cv_url": cv.url_cv}), 200
    else:
        return jsonify({"has_cv": False}), 200


@swag_from('../docs/candidato/postularme.yml')
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
        is_apto=predecir_cv(oferta.palabras_clave, cv),
        fecha_postulacion=datetime.now(timezone.utc),
    )

    db.session.add(nueva_postulacion)
    db.session.commit()

    return jsonify({"message": "Postulación realizada correctamente."}), 201

@swag_from('../docs/candidato/mis-cvs.yml')
@candidato_bp.route("/mis-cvs", methods=["GET"])
@role_required(["candidato"])
def listar_cvs():
    id_candidato = get_jwt_identity()
    cvs = (
        CV.query.filter_by(id_candidato=id_candidato)
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


def allowed_image(filename):
    allowed_extensions = {"png", "jpg", "jpeg", "gif"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

@swag_from('../docs/candidato/subir-image.yml')
@candidato_bp.route("/subir-image", methods=["POST"])
@role_required(["candidato"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_image(file.filename):
        id_candidato = get_jwt_identity()
        usuario = Usuario.query.get(id_candidato)

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"usuario_{id_candidato}.{ext}"
        upload_folder = candidato_bp.config["IMAGE_UPLOAD_FOLDER"]
        filepath = os.path.join(upload_folder, filename)

        if os.path.exists(filepath):
            os.remove(filepath)

        file.save(filepath)

        url_imagen = f"uploads/imagenes/{filename}"
        usuario.foto_url = url_imagen

        db.session.commit()

        return jsonify(
            {
                "message": "Imagen subida exitosamente",
                "file_path": url_imagen,
                "filename": filename,
            }
        ), 201

    return jsonify({"error": "Formato de imagen no permitido"}), 400

@swag_from('../docs/candidato/upload-cv.yml')
@candidato_bp.route("/upload-cv", methods=["POST"])
@role_required(["candidato"])
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

        upload_folder = candidato_bp.config["UPLOAD_FOLDER"]
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

@swag_from('../docs/candidato/registrar-empresa.yml')
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

    user = Usuario.query.filter(
        (Usuario.username == identifier) | (Usuario.correo == identifier)
    ).first()
    if user:
        if (
            not nombre_tarjeta
            or not numero_tarjeta
            or not cvv_tarjeta
            or not tipo_tarjeta
        ):
            return jsonify({"error": "Los datos de la tarjeta son obligatorios"}), 400
        if not nombre_empresa:
            return jsonify({"error": "El nombre de la empresa es obligatorio"}), 400

        admin_emp_role = db.session.query(Rol).filter_by(slug="admin-emp").first()
        # Si no existe el rol admin-emp, crearlo
        if not admin_emp_role:
            admin_emp_role = Rol(
                nombre="Admin-EMP", permisos="permisos_admin_emp", slug="admin-emp"
            )
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

@swag_from('../docs/candidato/empresas.yml')
@candidato_bp.route("/empresas", methods=["GET"])
@role_required(["candidato"])
def obtener_empresas():
    empresas = Empresa.query.all()
    resultado = [
        {"id": empresa.id, "nombre": empresa.nombre, "correo": empresa.correo}
        for empresa in empresas
    ]
    return jsonify(resultado), 200

@swag_from('../docs/candidato/todas-las-ofertas.yml')
@candidato_bp.route("/todas-las-ofertas", methods=["GET"])
@role_required(["candidato"])
def obtener_todas_las_ofertas():
    ofertas = Oferta_laboral.query.filter_by(is_active=True).all()

    resultado = [
        {
            "id": oferta.id,
            "nombre_oferta": oferta.nombre,
            "empresa": oferta.empresa.nombre,
            "coincidencia": 0,  # sin coincidencia, porque no se calcula aquí
            "palabras_clave": json.loads(oferta.palabras_clave),
        }
        for oferta in ofertas
    ]
    return jsonify(resultado), 200


@swag_from('../docs/candidato/ofertas-filtradas.yml')
@candidato_bp.route("/ofertas-filtradas", methods=["GET"])
@role_required(["candidato"])
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

@swag_from('../docs/candidato/ofertas-por-empresa.yml')
@candidato_bp.route("/empresas/<string:nombre_empresa>/ofertas", methods=["GET"])
@role_required(["candidato"])
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

@swag_from('../docs/candidato/recomendaciones.yml')
@candidato_bp.route("/recomendaciones", methods=["GET"])
@role_required(["candidato"])
def recomendar_ofertas():
    try:
        id_candidato = get_jwt_identity()

        cv = (
            CV.query.filter_by(id_candidato=id_candidato)
            .order_by(CV.fecha_subida.desc())
            .first()
        )
        if not cv:
            return jsonify({"error": "El candidato no tiene un CV cargado"}), 400

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
            .filter(
                or_(*[Oferta_laboral.palabras_clave.like(f"%{palabra}%") for palabra in palabras_clave_cv])
            )
            .limit(15)
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

@candidato_bp.route("/info-candidato", methods=["GET"])
@jwt_required()
@swag_from('../docs/candidato/info-candidato.yml')
def obtener_nombre_apellido_candidato():
    id_candidato = get_jwt_identity()
    candidato = Usuario.query.get(id_candidato)
    if not candidato:
        return jsonify({"error": "Candidato no encontrado"}), 404

    return {
        "nombre": candidato.nombre,
        "apellido": candidato.apellido,
        "username": candidato.username,
        "correo": candidato.correo,
    }


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
