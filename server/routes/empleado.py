import json
import os
from datetime import datetime, timezone

from auth.decorators import role_required
from flasgger import swag_from
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_mail import Message
from ml.extraction import extraer_texto_pdf, extraer_texto_word, predecir_cv
from ml.matching_semantico import dividir_cv_en_partes
from ml.modelo import modelo_sbert
from models.extensions import db, mail
from models.schemes import (
    CV,
    Empresa,
    HistorialRendimientoEmpleadoManual,
    Job_Application,
    Licencia,
    Notificacion,
    Oferta_laboral,
    Usuario,
)
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import desc, func, or_
from werkzeug.utils import secure_filename

from .notificacion import crear_notificacion

empleado_bp = Blueprint("empleado", __name__)


UPLOAD_FOLDER_CV = os.path.join(os.getcwd(), "uploads", "cvs")
UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")

ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}

empleado_bp.upload_folder = UPLOAD_FOLDER_CV
empleado_bp.image_upload_folder = UPLOAD_FOLDER_IMG

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


# @swag_from("../docs/empleado/solicitar-licencia.yml")
# @empleado_bp.route("/solicitar-licencia", methods=["POST"])
# @role_required(["empleado"])
# def solicitar_licencia():
#     data = request.get_json()
#     tipo_licencia = data.get("lic_type")
#     descripcion = data.get("description")
#     fecha_inicio = data.get("start_date")
#     fecha_fin = data.get("end_date")
#     certificado_url = data.get("certificado_url")

#     id_empleado = get_jwt_identity()
#     empleado = Usuario.query.filter_by(id=id_empleado).first()

#     nueva_licencia = Licencia(
#         id_empleado=id_empleado,
#         tipo=tipo_licencia,
#         descripcion=descripcion,
#         fecha_inicio=datetime.strptime(fecha_inicio, "%Y-%m-%d"),
#         fecha_fin=datetime.strptime(fecha_fin, "%Y-%m-%d"),
#         estado="pendiente",
#         id_empresa=empleado.id_empresa,
#         certificado_url=certificado_url,
#     )

#     db.session.add(nueva_licencia)
#     db.session.commit()

#     return jsonify(
#         {
#             "message": "Solicitud de licencia enviada exitosamente",
#             "licencia": {
#                 "id": nueva_licencia.id,
#                 "tipo": nueva_licencia.tipo,
#                 "descripcion": nueva_licencia.descripcion,
#                 "estado": nueva_licencia.estado,
#                 "fecha_inicio": nueva_licencia.fecha_inicio.isoformat()
#                 if nueva_licencia.fecha_inicio
#                 else None,
#                 "empresa": {
#                     "id": nueva_licencia.id_empresa,
#                     "nombre": Empresa.query.get(nueva_licencia.id_empresa).nombre,
#                 },
#             },
#         }
#     ), 201

from datetime import timedelta

# @swag_from("../docs/empleado/solicitar-licencia.yml")
# @empleado_bp.route("/solicitar-licencia", methods=["POST"])
# @role_required(["empleado"])
# def solicitar_licencia():
#     data = request.get_json()
#     tipo_licencia = data.get("lic_type")
#     descripcion = data.get("description")
#     fecha_inicio = data.get("start_date")
#     fecha_fin = data.get("end_date")
#     certificado_url = data.get("certificado_url")
#     dias_requeridos = data.get("dias_requeridos")  # solo para estudio

#     id_empleado = get_jwt_identity()
#     empleado = Usuario.query.filter_by(id=id_empleado).first()

#     if tipo_licencia not in ["medica", "embarazo", "estudio", "vacaciones"]:
#         return jsonify({"error": "Tipo de licencia inválido"}), 400

#     # Licencia médica o embarazo: certificado obligatorio, estado activa
#     if tipo_licencia in ["medica", "embarazo"]:
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para este tipo de licencia"}), 400
#         estado = "activa"
#         fecha_inicio_dt = datetime.now(timezone.utc)
#         if not fecha_fin:
#             return jsonify({"error": "Debe indicar fecha de fin"}), 400
#         fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d")

#     # Licencia por estudio: máximo 10 días, estado pendiente
#     elif tipo_licencia == "estudio":
#         if not dias_requeridos or not fecha_inicio:
#             return jsonify({"error": "Debe indicar cantidad de días y fecha de inicio"}), 400
#         try:
#             dias_requeridos = int(dias_requeridos)
#         except ValueError:
#             return jsonify({"error": "Cantidad de días inválida"}), 400
#         if dias_requeridos < 1 or dias_requeridos > 10:
#             return jsonify({"error": "La cantidad máxima de días para licencia de estudio es 10"}), 400
#         estado = "pendiente"
#         fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d")
#         fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos-1)

#     # Licencia por vacaciones: estado pendiente, requiere inicio y fin
#     elif tipo_licencia == "vacaciones":
#         if not fecha_inicio or not fecha_fin:
#             return jsonify({"error": "Debe indicar fecha de inicio y fin"}), 400
#         estado = "pendiente"
#         fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d")
#         fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d")

#     nueva_licencia = Licencia(
#         id_empleado=id_empleado,
#         tipo=tipo_licencia,
#         descripcion=descripcion,
#         fecha_inicio=fecha_inicio_dt,
#         fecha_fin=fecha_fin_dt,
#         estado=estado,
#         id_empresa=empleado.id_empresa,
#         certificado_url=certificado_url,
#         dias_requeridos=dias_requeridos if tipo_licencia == "estudio" else None,
#     )

#     db.session.add(nueva_licencia)
#     db.session.commit()

#     return jsonify(
#         {
#             "message": "Solicitud de licencia enviada exitosamente",
#             "licencia": {
#                 "id": nueva_licencia.id,
#                 "tipo": nueva_licencia.tipo,
#                 "descripcion": nueva_licencia.descripcion,
#                 "estado": nueva_licencia.estado,
#                 "fecha_inicio": nueva_licencia.fecha_inicio.isoformat() if nueva_licencia.fecha_inicio else None,
#                 "fecha_fin": nueva_licencia.fecha_fin.isoformat() if nueva_licencia.fecha_fin else None,
#                 "dias_requeridos": nueva_licencia.dias_requeridos,
#                 "empresa": {
#                     "id": nueva_licencia.id_empresa,
#                     "nombre": Empresa.query.get(nueva_licencia.id_empresa).nombre,
#                 },
#                 "certificado_url": nueva_licencia.certificado_url,
#             },
#         }
#     ), 201

# @swag_from("../docs/empleado/mis-licencias.yml")
# @empleado_bp.route("/mis-licencias-empleado", methods=["GET"])
# @role_required(["empleado"])
# def ver_mis_licencias():
#     id_empleado = get_jwt_identity()
#     licencias = Licencia.query.filter_by(id_empleado=id_empleado).all()

#     resultado = [
#         {
#           "id_licencia": licencia.id,
#           "tipo": licencia.tipo,
#           "descripcion": licencia.descripcion,
#           "fecha_inicio": licencia.fecha_inicio.isoformat()
#           if licencia.fecha_inicio
#           else None,
#           "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
#           "estado": licencia.estado,
#           "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
#           "empresa": {
#               "id": licencia.id_empresa,
#               "nombre": Empresa.query.get(licencia.id_empresa).nombre,
#           },
#           "certificado_url": licencia.certificado_url
#           if licencia.certificado_url
#           else None,
#         }
#         for licencia in licencias
#     ]

#     return jsonify(resultado), 200

UPLOAD_FOLDER = "uploads/certificados"  # Carpeta donde se guardarán los certificados
ALLOWED_EXTENSIONS = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_image(filename):
    allowed_extensions = {"png", "jpg", "jpeg", "gif"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


@swag_from("../docs/empleado/subir-certificado.yml")
@empleado_bp.route("/subir-certificado-emp", methods=["POST"])
@role_required(["empleado"])
def subir_certificado_generico():
    # Verificar si se envió un archivo
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify(
            {"error": "Formato de archivo no permitido. Solo se aceptan archivos PDF"}
        ), 400

    # Generar nombre único con timestamp
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = secure_filename(file.filename.rsplit(".", 1)[0])
    ext = file.filename.rsplit(".", 1)[1].lower()
    nombre_final = f"{filename}_{timestamp}.{ext}"

    # Guardar archivo
    filepath = os.path.join(UPLOAD_FOLDER, nombre_final)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file.save(filepath)

    file_url = f"/{UPLOAD_FOLDER}/{nombre_final}"

    return jsonify(
        {
            "message": "Certificado subido exitosamente",
            "certificado_url": file_url,
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
            .filter(
                or_(
                    *[
                        Oferta_laboral.palabras_clave.ilike(f"%{palabra}%")
                        for palabra in palabras_clave_cv
                    ]
                )
            )
            .order_by(func.rand())
            .limit(20)
            .all()
        )

        recomendaciones = []

        for oferta in ofertas:
            palabras_clave = json.loads(oferta.palabras_clave)
            print(f"🔎 Palabras clave de la oferta: {palabras_clave}")

            coincidencias = len(set(palabras_clave) & palabras_clave_cv)
            total_palabras = len(palabras_clave)
            porcentaje_palabras = int((coincidencias / total_palabras) * 100)

            if porcentaje_palabras >= 40:
                print(
                    f"Coincidencias encontradas en texto plano: {porcentaje_palabras}%"
                )

                vectores_cv = modelo_sbert.encode(partes_cv)
                vector_keywords = modelo_sbert.encode(" ".join(palabras_clave))
                max_sim = max(cosine_similarity([vector_keywords], vectores_cv)[0])
                porcentaje_sbert = int(max_sim * 100)

                print(f"Coincidencia semántica calculada: {porcentaje_sbert}%")

                if porcentaje_sbert >= 50:
                    recomendaciones.append(
                        {
                            "id_oferta": oferta.id,
                            "nombre_oferta": oferta.nombre,
                            "empresa": oferta.empresa.nombre,
                            "coincidencia": porcentaje_sbert,
                            "palabras_clave": palabras_clave,
                        }
                    )

        recomendaciones.sort(key=lambda r: r["coincidencia"], reverse=True)
        return jsonify(recomendaciones[:3]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@swag_from("../docs/empleado/subir-imagen.yml")
@empleado_bp.route("/subir-image-empleado", methods=["POST"])
@role_required(["empleado"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_image(file.filename):
        id_empleado = get_jwt_identity()
        usuario = Usuario.query.get(id_empleado)

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"usuario_{id_empleado}.{ext}"

        upload_folder = empleado_bp.image_upload_folder

        filepath = os.path.join(upload_folder, filename)

        file.save(filepath)

        url_imagen = f"uploads/fotos/{filename}"
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

        upload_folder = empleado_bp.upload_folder
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
    id_empleado = get_jwt_identity()

    try:
        empleado = Usuario.query.get(id_empleado)

        filtros = request.args.to_dict()
        # query = db.session.query(Oferta_laboral)
        query = Oferta_laboral.query.filter_by(id_empresa=empleado.id_empresa)
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
@empleado_bp.route(
    "/empresas-empleado/<string:nombre_empresa>/ofertas", methods=["GET"]
)
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


@swag_from("../docs/empleado/mis-cvs.yml")
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


@swag_from("../docs/empleado/postularme.yml")
@empleado_bp.route("/postularme-empleado/<int:id_oferta>", methods=["POST"])
@role_required(["empleado"])
def postularme(id_oferta):
    data = request.get_json()
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

    aptitud_cv, porcentaje = predecir_cv(oferta.palabras_clave, cv, id_oferta)

    nueva_postulacion = Job_Application(
        id_candidato=id_empleado,
        id_oferta=id_oferta,
        id_cv=id_cv,
        is_apto=aptitud_cv,
        fecha_postulacion=datetime.now(timezone.utc),
        estado_postulacion="pendiente",
        porcentaje_similitud=porcentaje * 100,
    )

    db.session.add(nueva_postulacion)
    db.session.commit()

    crear_notificacion(
        id_empleado, f"Postulación realizada en la oferta: {oferta.nombre}"
    )

    empresa_nombre = Empresa.query.get(oferta.id_empresa).nombre

    mensaje = f"Hola {empleado.nombre}, has realizado una postulación a la oferta: {oferta.nombre}, de la empresa {empresa_nombre}.\n"

    enviar_notificacion_empleado_mail(empleado.correo, mensaje)

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


@swag_from("../docs/empleado/estado-postulaciones.yml")
@empleado_bp.route("/estado-postulaciones-empleado", methods=["GET"])
@role_required(["empleado"])
def estado_postulaciones():
    id_empleado = get_jwt_identity()

    postulaciones = (
        db.session.query(
            Job_Application.id,
            Oferta_laboral.id,
            Oferta_laboral.nombre,
            Job_Application.is_apto,
            Job_Application.fecha_postulacion,
        )
        .join(Oferta_laboral, Job_Application.id_oferta == Oferta_laboral.id)
        .filter(Job_Application.id_candidato == id_empleado)
        .all()
    )

    resultado = [
        {
            "id_postulacion": id_postulacion,
            "id_oferta": id_oferta,
            "nombre_oferta": nombre,
            "estado": "Apto" if estado else "No Apto",
            "fecha_postulacion": fecha.isoformat(),
        }
        for id_postulacion, id_oferta, nombre, estado, fecha in postulaciones
    ]

    if not resultado:
        return jsonify(
            {"message": "No se encontraron postulaciones para este empleado."}
        ), 404

    return jsonify(resultado), 200


@empleado_bp.route("/notificaciones-empleado-no-leidas", methods=["GET"])
@role_required(["empleado"])
def obtener_notificaciones_no_leidas():
    try:
        id_usuario = get_jwt_identity()

        # Leer el parámetro ?todas=true
        mostrar_todas = request.args.get("todas", "false").lower() == "true"

        query = Notificacion.query.filter_by(id_usuario=id_usuario)

        if not mostrar_todas:
            query = query.filter_by(leida=False)

        notificaciones = query.order_by(Notificacion.fecha_creacion.desc()).all()

        if not notificaciones:
            return jsonify(
                {"message": "No se encontraron notificaciones no leídas"}
            ), 404

        resultado = [n.to_dict() for n in notificaciones]

        return jsonify(
            {
                "message": "Notificaciones no leídas recuperadas correctamente",
                "notificaciones": resultado,
            }
        ), 200

    except Exception as e:
        print(f"Error al obtener notificaciones no leídas: {e}")
        return jsonify({"error": "Error interno al recuperar las notificaciones"}), 500


@empleado_bp.route("/leer-notificacion-empleado/<int:id_notificacion>", methods=["PUT"])
@role_required(["empleado"])
def leer_notificacion(id_notificacion):
    try:
        id_usuario = get_jwt_identity()

        notificacion = Notificacion.query.filter_by(
            id=id_notificacion, id_usuario=id_usuario
        ).first()

        if not notificacion:
            return jsonify(
                {"error": "Notificación no encontrada o no pertenece al usuario"}
            ), 404

        notificacion.leida = True
        db.session.commit()

        return jsonify(
            {
                "message": "Notificación marcada como leída",
                "notificacion_id": notificacion.id,
                "estado": "leída",
            }
        ), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al marcar notificación como leída: {e}")
        return jsonify({"error": "Error interno al actualizar la notificación"}), 500


@empleado_bp.route("/notificaciones-empleado-no-leidas-contador", methods=["GET"])
@role_required(["empleado"])
def obtener_contador_notificaciones_no_leidas():
    try:
        id_usuario = get_jwt_identity()

        contador = Notificacion.query.filter_by(
            id_usuario=id_usuario, leida=False
        ).count()

        return jsonify(
            {
                "message": "Contador de notificaciones no leídas recuperado correctamente",
                "total_no_leidas": contador,
            }
        ), 200

    except Exception as e:
        print(f"Error al obtener contador de notificaciones no leídas: {e}")
        return jsonify({"error": "Error interno al recuperar el contador"}), 500


def enviar_notificacion_empleado_mail(email_destino, cuerpo):
    try:
        asunto = "Postulación realizada"
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")


@swag_from("../docs/empleado/solicitar-licencia.yml")
@empleado_bp.route("/solicitar-licencia-empleado", methods=["POST"])
@role_required(["empleado"])
def solicitar_licencia():
    data = request.get_json()
    tipo_licencia = data.get("lic_type")
    descripcion = data.get("description")
    fecha_inicio = data.get("start_date")
    fecha_fin = data.get("end_date")
    certificado_url = data.get("certificado_url")
    dias_requeridos = data.get("dias_requeridos")

    id_empleado = get_jwt_identity()
    empleado = Usuario.query.filter_by(id=id_empleado).first()

    now = datetime.now(timezone.utc)

    # Obtener la empresa y los días máximos configurados
    empresa = Empresa.query.get(empleado.id_empresa)
    dias_maximos = {
        "maternidad": empresa.dias_maternidad,
        "nacimiento_hijo": empresa.dias_nac_hijo,
        "duelo": empresa.dias_duelo,
        "matrimonio": empresa.dias_matrimonio,
        "mudanza": empresa.dias_mudanza,
        "estudios": empresa.dias_estudios,
    }

    # Tipos de licencia válidos
    tipos_validos = [
        "accidente_laboral",
        "enfermedad",
        "maternidad",
        "nacimiento_hijo",
        "duelo",
        "matrimonio",
        "mudanza",
        "estudios",
        "vacaciones",
        "otro",
    ]
    if tipo_licencia not in tipos_validos:
        return jsonify(
            {
                "error": f"Tipo de licencia '{tipo_licencia}' inválido. Tipos permitidos: {', '.join(tipos_validos)}"
            }
        ), 400

    estado = None
    fecha_inicio_dt = None
    fecha_fin_dt = None
    dias_requeridos_val = None

    # Accidente laboral
    if tipo_licencia == "accidente_laboral":
        if not certificado_url:
            return jsonify(
                {"error": "Debe adjuntar un certificado para accidente laboral"}
            ), 400
        if not dias_requeridos:
            return jsonify(
                {"error": "Debe indicar la cantidad de días requeridos"}
            ), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1:
            return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_requeridos_val - 1)
        estado = "activa"

    # Médica
    elif tipo_licencia == "enfermedad":
        if not certificado_url:
            return jsonify(
                {"error": "Debe adjuntar un certificado para licencia médica"}
            ), 400
        if not dias_requeridos:
            return jsonify(
                {"error": "Debe indicar la cantidad de días requeridos"}
            ), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1:
            return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_requeridos_val - 1)
        estado = "activa"

    # Maternidad
    elif tipo_licencia == "maternidad":
        if not certificado_url:
            return jsonify(
                {"error": "Debe adjuntar un certificado para maternidad"}
            ), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_maximos["maternidad"] - 1)
        estado = "activa"

    # Paternidad
    elif tipo_licencia == "nacimiento_hijo":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not certificado_url:
            return jsonify(
                {"error": "Debe adjuntar un certificado para paternidad"}
            ), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_maximos["nacimiento_hijo"] - 1)
        estado = "activa"

    # Duelo
    elif tipo_licencia == "duelo":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para duelo"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_maximos["duelo"] - 1)
        estado = "activa"

    # Matrimonio
    elif tipo_licencia == "matrimonio":
        if not certificado_url:
            return jsonify(
                {"error": "Debe adjuntar un certificado para matrimonio"}
            ), 400
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except Exception:
            return jsonify({"error": "Formato de fecha de inicio inválido"}), 400
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_maximos["matrimonio"] - 1)
        estado = "aprobada"

    # Mudanza
    elif tipo_licencia == "mudanza":
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except Exception:
            return jsonify({"error": "Formato de fecha de inicio inválido"}), 400
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_maximos["mudanza"] - 1)
        estado = "aprobada"

    # Estudios
    # elif tipo_licencia == "estudios":
    #     if not certificado_url:
    #         return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
    #     if not dias_requeridos:
    #         return jsonify({"error": "Debe indicar la cantidad de dias requeridos"}), 400
    #     if dias_requeridos < 1 or dias_requeridos > 10:
    #         return jsonify({"error": "La cantidad de dias debe estar entre 1 y 10"}), 400
    #     try:
    #         dias_requeridos_val = int(dias_requeridos)
    #     except ValueError:
    #         return jsonify({"error": "Cantidad de días inválida"}), 400
    #     if not fecha_inicio:
    #         return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
    #     fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    #     fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos_val-1)
    #     estado = "aprobada"

    elif tipo_licencia == "estudios":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not dias_requeridos:
            return jsonify(
                {"error": "Debe indicar la cantidad de dias requeridos"}
            ), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1 or dias_requeridos_val > dias_maximos["estudios"]:
            return jsonify(
                {
                    "error": f"La cantidad de días para licencia de estudios debe estar entre 1 y {dias_maximos['estudios']}."
                }
            ), 400
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(
            tzinfo=timezone.utc
        )
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos_val - 1)
        estado = "aprobada"

    # Vacaciones
    elif tipo_licencia == "vacaciones":
        if not dias_requeridos:
            return jsonify(
                {"error": "Debe indicar la cantidad de dias requeridos"}
            ), 400
        if dias_requeridos < 1:
            return jsonify({"error": "La cantidad de dias debe ser mayor a 0"}), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(
            tzinfo=timezone.utc
        )
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos_val - 1)
        estado = "pendiente"

    elif tipo_licencia == "otro":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not dias_requeridos:
            return jsonify(
                {"error": "Debe indicar la cantidad de días requeridos"}
            ), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1:
            return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_requeridos_val - 1)
        estado = "pendiente"

    nueva_licencia = Licencia(
        id_empleado=id_empleado,
        tipo=tipo_licencia,
        descripcion=descripcion,
        fecha_inicio=fecha_inicio_dt,
        fecha_fin=fecha_fin_dt,
        estado=estado,
        id_empresa=empleado.id_empresa,
        certificado_url=certificado_url,
        dias_requeridos=dias_requeridos_val,
    )

    db.session.add(nueva_licencia)

    crear_notificacion_uso_especifico(id_empleado, f"Has solicitado una licencia del tipo {tipo_licencia}.")
    enviar_mail_empleado_licencia_cuerpo(empleado.correo, "Solicitud de licencia", f"Hola {empleado.nombre}, has solicitado una licencia del tipo {tipo_licencia}.")

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
                "fecha_fin": nueva_licencia.fecha_fin.isoformat()
                if nueva_licencia.fecha_fin
                else None,
                "dias_requeridos": nueva_licencia.dias_requeridos,
                "empresa": {
                    "id": nueva_licencia.id_empresa,
                    "nombre": Empresa.query.get(nueva_licencia.id_empresa).nombre,
                },
                "certificado_url": nueva_licencia.certificado_url,
            },
        }
    ), 201


@empleado_bp.route("/mis-licencias-empleado", methods=["GET"])
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
            "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
            "estado": licencia.estado,
            "estado_sugerencia": licencia.estado_sugerencia
            if hasattr(licencia, "estado_sugerencia")
            else None,
            "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat()
            if hasattr(licencia, "fecha_inicio_sugerencia")
            and licencia.fecha_inicio_sugerencia
            else None,
            "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat()
            if hasattr(licencia, "fecha_fin_sugerencia")
            and licencia.fecha_fin_sugerencia
            else None,
            "motivo_rechazo": licencia.motivo_rechazo
            if licencia.motivo_rechazo
            else "-",
            "dias_requeridos": licencia.dias_requeridos
            if hasattr(licencia, "dias_requeridos")
            else None,
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


@swag_from("../docs/empleado/licencia-detalle.yml")
@empleado_bp.route(
    "/mi-licencia-<int:id_licencia>-empleado/informacion", methods=["GET"]
)
@role_required(["empleado"])
def obtener_detalle_licencia_empleado(id_licencia):
    id_empleado = get_jwt_identity()
    licencia = Licencia.query.filter_by(id=id_licencia, id_empleado=id_empleado).first()

    if not licencia:
        return jsonify(
            {"error": "Licencia no encontrada o no pertenece al empleado"}
        ), 404

    empresa = Empresa.query.get(licencia.id_empresa)

    detalle = {
        "id_licencia": licencia.id,
        "tipo": licencia.tipo,
        "descripcion": licencia.descripcion,
        "fecha_inicio": licencia.fecha_inicio.isoformat()
        if licencia.fecha_inicio
        else None,
        "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
        "estado": licencia.estado,
        "estado_sugerencia": getattr(licencia, "estado_sugerencia", None),
        "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat()
        if getattr(licencia, "fecha_inicio_sugerencia", None)
        else None,
        "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat()
        if getattr(licencia, "fecha_fin_sugerencia", None)
        else None,
        "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
        "dias_requeridos": getattr(licencia, "dias_requeridos", None),
        "empresa": {
            "id": licencia.id_empresa,
            "nombre": empresa.nombre if empresa else None,
        },
        "certificado_url": licencia.certificado_url
        if licencia.certificado_url
        else None,
    }

    return jsonify(detalle), 200


@empleado_bp.route("/licencia-<int:id_licencia>/respuesta-sugerencia", methods=["PUT"])
@role_required(["empleado"])
def responder_sugerencia_licencia(id_licencia):
    """
    Permite al empleado aceptar o rechazar una sugerencia de fechas de licencia.
    Espera un JSON con {"aceptacion": True/False}
    """
    data = request.get_json()
    aceptacion = data.get("aceptacion")

    if aceptacion is None:
        return jsonify({"error": "Debe indicar si acepta o rechaza la sugerencia"}), 400

    id_empleado = get_jwt_identity()
    licencia = Licencia.query.filter_by(id=id_licencia, id_empleado=id_empleado).first()

    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404
    
    empleado = Usuario.query.get(id_empleado)
    superior = Usuario.query.get(empleado.id_superior)

    if aceptacion:
        licencia.estado_sugerencia = "sugerencia aceptada"
        if superior:
            crear_notificacion_uso_especifico(superior.id, f"El empleado {empleado.nombre} {empleado.apellido} ha aceptado la sugerencia de licencia.")
    else:
        licencia.estado = "rechazada"
        licencia.estado_sugerencia = "sugerencia rechazada"
        if superior:
            crear_notificacion_uso_especifico(superior.id, f"El empleado {empleado.nombre} {empleado.apellido} ha rechazado la sugerencia de licencia.")

    db.session.commit()

    return jsonify(
        {
            "message": f"Sugerencia {'aceptada' if aceptacion else 'rechazada'} correctamente",
            "estado_sugerencia": licencia.estado_sugerencia,
        }
    ), 200


@empleado_bp.route("/empleados-mi-area", methods=["GET"])
@role_required(["empleado"])
def empleados_mi_area():
    # Mapear jefe a área y puestos del área
    area_puestos = {
        "Jefe de Tecnología y Desarrollo": [
            "Desarrollador Backend",
            "Desarrollador Frontend",
            "Full Stack Developer",
            "DevOps Engineer",
            "Data Engineer",
            "Ingeniero de Machine Learning",
            "Analista de Datos",
            "QA Automation Engineer",
            "Soporte Técnico",
            "Administrador de Base de Datos",
            "Administrador de Redes",
            "Especialista en Seguridad Informática",
        ],
        "Jefe de Administración y Finanzas": [
            "Analista Contable",
            "Contador Público",
            "Analista de Finanzas",
            "Administrativo/a",
            "Asistente Contable",
        ],
        "Jefe Comercial y de Ventas": [
            "Representante de Ventas",
            "Ejecutivo de Cuentas",
            "Vendedor Comercial",
            "Supervisor de Ventas",
            "Asesor Comercial",
        ],
        "Jefe de Marketing y Comunicación": [
            "Especialista en Marketing Digital",
            "Analista de Marketing",
            "Community Manager",
            "Diseñador Gráfico",
            "Responsable de Comunicación",
        ],
        "Jefe de Industria y Producción": [
            "Técnico de Mantenimiento",
            "Operario de Producción",
            "Supervisor de Planta",
            "Ingeniero de Procesos",
            "Encargado de Logística",
        ],
        "Jefe de Servicios Generales y Gastronomía": [
            "Mozo/a",
            "Cocinero/a",
            "Encargado de Salón",
            "Recepcionista",
            "Limpieza",
        ],
    }

    id_usuario = get_jwt_identity()
    jefe = Usuario.query.get(id_usuario)
    if not jefe:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Verifica que sea jefe de área
    if jefe.puesto_trabajo not in area_puestos:
        return jsonify(
            {"error": "No tienes permisos para acceder a esta información"}
        ), 403

    # Busca empleados de la misma empresa y área
    empleados = Usuario.query.filter(
        Usuario.id_empresa == jefe.id_empresa,
        Usuario.puesto_trabajo.in_(area_puestos[jefe.puesto_trabajo]),
    ).all()

    # resultado = [
    #     {
    #         "id": e.id,
    #         "nombre": e.nombre,
    #         "apellido": e.apellido,
    #         "correo": e.correo,
    #         "username": e.username,
    #         "puesto_trabajo": e.puesto_trabajo
    #     }
    #     for e in empleados
    # ]

    resultado = []
    for e in empleados:
        # Buscar último rendimiento
        ultimo_rend = (
            HistorialRendimientoEmpleadoManual.query.filter_by(id_empleado=e.id)
            .order_by(desc(HistorialRendimientoEmpleadoManual.fecha_calculo))
            .first()
        )
        resultado.append(
            {
                "id": e.id,
                "nombre": e.nombre,
                "apellido": e.apellido,
                "correo": e.correo,
                "username": e.username,
                "puesto_trabajo": e.puesto_trabajo,
                "ultimo_rendimiento": ultimo_rend.rendimiento if ultimo_rend else None,
                "fecha_ultimo_rendimiento": ultimo_rend.fecha_calculo.isoformat()
                if ultimo_rend
                else None,
            }
        )

    return jsonify({"empleados_area": resultado}), 200


@empleado_bp.route("/establecer-rendimiento-empleado", methods=["POST"])
@role_required(["empleado"])
def establecer_rendimiento_empleado():
    data = request.get_json()
    id_empleado = data.get("id_empleado")
    rendimiento = data.get("rendimiento")

    # Validación básica
    if id_empleado is None or rendimiento is None:
        return jsonify(
            {"error": "Faltan datos requeridos (id_empleado, rendimiento)"}
        ), 400

    try:
        rendimiento = float(rendimiento)
    except ValueError:
        return jsonify({"error": "El rendimiento debe ser un número"}), 400

    if rendimiento < 0.0 or rendimiento > 10.0:
        return jsonify({"error": "El rendimiento debe estar entre 0.0 y 10.0"}), 400

    # Solo dos decimales
    rendimiento = round(rendimiento, 2)

    # Mapear jefe a área y puestos del área
    area_puestos = {
        "Jefe de Tecnología y Desarrollo": [
            "Desarrollador Backend",
            "Desarrollador Frontend",
            "Full Stack Developer",
            "DevOps Engineer",
            "Data Engineer",
            "Ingeniero de Machine Learning",
            "Analista de Datos",
            "QA Automation Engineer",
            "Soporte Técnico",
            "Administrador de Base de Datos",
            "Administrador de Redes",
            "Especialista en Seguridad Informática",
        ],
        "Jefe de Administración y Finanzas": [
            "Analista Contable",
            "Contador Público",
            "Analista de Finanzas",
            "Administrativo/a",
            "Asistente Contable",
        ],
        "Jefe Comercial y de Ventas": [
            "Representante de Ventas",
            "Ejecutivo de Cuentas",
            "Vendedor Comercial",
            "Supervisor de Ventas",
            "Asesor Comercial",
        ],
        "Jefe de Marketing y Comunicación": [
            "Especialista en Marketing Digital",
            "Analista de Marketing",
            "Community Manager",
            "Diseñador Gráfico",
            "Responsable de Comunicación",
        ],
        "Jefe de Industria y Producción": [
            "Técnico de Mantenimiento",
            "Operario de Producción",
            "Supervisor de Planta",
            "Ingeniero de Procesos",
            "Encargado de Logística",
        ],
        "Jefe de Servicios Generales y Gastronomía": [
            "Mozo/a",
            "Cocinero/a",
            "Encargado de Salón",
            "Recepcionista",
            "Limpieza",
        ],
    }

    id_jefe = get_jwt_identity()
    jefe = Usuario.query.get(id_jefe)
    if not jefe:
        return jsonify({"error": "Usuario jefe no encontrado"}), 404

    if jefe.puesto_trabajo not in area_puestos:
        return jsonify({"error": "No tienes permisos para calificar empleados"}), 403

    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Validar que el empleado pertenece a la misma empresa y área
    if (
        empleado.id_empresa != jefe.id_empresa
        or empleado.puesto_trabajo not in area_puestos[jefe.puesto_trabajo]
    ):
        return jsonify({"error": "No puedes calificar a este empleado"}), 403

    # Registrar el rendimiento
    nuevo_registro = HistorialRendimientoEmpleadoManual(
        id_empleado=id_empleado, fecha_calculo=datetime.now(), rendimiento=rendimiento
    )
    db.session.add(nuevo_registro)
    db.session.commit()

    # Buscar el último rendimiento registrado (debería ser el recién creado)
    ultimo_rend = (
        HistorialRendimientoEmpleadoManual.query.filter_by(id_empleado=id_empleado)
        .order_by(desc(HistorialRendimientoEmpleadoManual.fecha_calculo))
        .first()
    )

    return jsonify(
        {
            "message": "Rendimiento registrado correctamente",
            "id_empleado": id_empleado,
            "rendimiento": rendimiento,
            "ultimo_rendimiento": ultimo_rend.rendimiento if ultimo_rend else None,
            "fecha_ultimo_rendimiento": ultimo_rend.fecha_calculo.isoformat()
            if ultimo_rend
            else None,
        }
    ), 201


@empleado_bp.route("/licencia-<int:id_licencia>/cancelar", methods=["PUT"])
@role_required(["empleado"])
def cancelar_licencia(id_licencia):
    """
    Permite a un empleado cancelar una solicitud de licencia.
    La licencia solo puede ser cancelada si su estado actual es 'sugerencia'.
    No requiere cuerpo de JSON.
    """
    id_empleado = get_jwt_identity()

    licencia = Licencia.query.filter_by(id=id_licencia, id_empleado=id_empleado).first()

    if not licencia:
        return jsonify(
            {
                "error": "Solicitud de licencia no encontrada o no pertenece a este empleado."
            }
        ), 404

    allowed_states_for_cancellation = ["pendiente", "activa"]
    if licencia.estado not in allowed_states_for_cancellation:
        return jsonify(
            {
                "error": f"La licencia no puede ser cancelada. Su estado actual es '{licencia.estado}'. Solo se pueden cancelar licencias en estado '{' o '.join(allowed_states_for_cancellation)}'."
            }
        ), 400

    # Change the state to "cancelada"
    licencia.estado = "cancelada"
    licencia.motivo_rechazo = (
        "Cancelado por el empleado."  # Optional: Add a default reason
    )

    try:
        empleado = Usuario.query.get(id_empleado)
        crear_notificacion_uso_especifico(id_empleado, f"La licencia {id_licencia} ha sido cancelada exitosamente.")
        enviar_mail_empleado_licencia(empleado.correo, "Licencia Cancelada",
            f"Hola {empleado.nombre},\n\nTu solicitud de licencia con ID {id_licencia} ha sido cancelada exitosamente.\n\nSaludos,\nEquipo de Recursos Humanos")
        db.session.commit()
        return jsonify(
            {
                "message": "Solicitud de licencia cancelada exitosamente.",
                "id_licencia": licencia.id,
                "nuevo_estado": licencia.estado,
            }
        ), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al cancelar la licencia: {str(e)}"}), 500
    

@empleado_bp.route("/notificaciones-empleado-todas", methods=["GET"])
@role_required(["empleado"])
def obtener_notificaciones_todas():
    try:
        id_usuario = get_jwt_identity()

        # Leer el parámetro ?todas=true
        mostrar_todas = request.args.get("todas", "false").lower() == "true"

        query = Notificacion.query.filter_by(id_usuario=id_usuario)

        notificaciones = query.order_by(Notificacion.fecha_creacion.desc()).all()

        if not notificaciones:
            return jsonify({"message": "No se encontraron notificaciones"}), 404

        resultado = [n.to_dict() for n in notificaciones]

        return jsonify({
            "message": "Notificaciones recuperadas correctamente",
            "notificaciones": resultado
        }), 200

    except Exception as e:
        print(f"Error al obtener notificaciones: {e}")
        return jsonify({"error": "Error interno al recuperar las notificaciones"}), 500
    

def enviar_mail_empleado_licencia(email_destino, asunto, cuerpo):
    try:
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")


def crear_notificacion_uso_especifico(id_usuario, mensaje):
    notificacion = Notificacion(
        id_usuario=id_usuario,
        mensaje=mensaje,
    )
    db.session.add(notificacion)

def enviar_mail_empleado_licencia_cuerpo(email_destino, asunto, cuerpo):
    try:
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")
