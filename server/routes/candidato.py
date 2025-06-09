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
from flask_mail import Message
from models.extensions import mail
from models.schemes import (
    CV,
    Empresa,
    Job_Application,
    Oferta_laboral,
    Rol,
    TarjetaCredito,
    Usuario,
    Notificacion,
)
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.sql.expression import func, or_, and_
from werkzeug.utils import secure_filename
from flasgger import swag_from
from .notificacion import crear_notificacion

candidato_bp = Blueprint("candidato", __name__)


@candidato_bp.route("/candidato-home", methods=["GET"])
@role_required(["candidato"])
def candidato_home():
    return jsonify({"message": "Bienvenido al dashboard de candidato"}), 200


UPLOAD_FOLDER_CV = os.path.join(os.getcwd(), "uploads", "cvs")
UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")

ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}

candidato_bp.upload_folder = UPLOAD_FOLDER_CV
candidato_bp.image_upload_folder = UPLOAD_FOLDER_IMG

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
@candidato_bp.route("/postularme/<int:id_oferta>", methods=["POST"])
@role_required(["candidato"])
def postularme(id_oferta):
    data = request.get_json()
    id_cv = data.get("id_cv")

    if not id_oferta or not id_cv:
        return jsonify({"error": "Falta id de oferta o CV seleccionado"}), 400

    id_candidato = get_jwt_identity()
    
    candidato = Usuario.query.get(id_candidato)
    if not candidato:
        return jsonify({"error": "Candidato no encontrado"}), 404

    cv = CV.query.filter_by(id=id_cv, id_candidato=id_candidato).first()
    if not cv:
        return jsonify({"error": "CV inválido o no pertenece al usuario"}), 403

    oferta = Oferta_laboral.query.get(id_oferta)
    if not oferta:
        return jsonify({"error": "Oferta laboral no encontrada"}), 404
    
    aptitud_cv, porcentaje = predecir_cv(oferta.palabras_clave, cv, id_oferta)

    nueva_postulacion = Job_Application(
        id_candidato=id_candidato,
        id_oferta=id_oferta,
        id_cv=id_cv,
        is_apto=aptitud_cv,
        fecha_postulacion=datetime.now(timezone.utc),
        estado_postulacion="pendiente",
        porcentaje_similitud=porcentaje*100,
    )

    db.session.add(nueva_postulacion)
    db.session.commit()
    
    crear_notificacion(id_candidato, f"Postulación realizada en la oferta: {oferta.nombre}")
    
    empresa_nombre = Empresa.query.get(oferta.id_empresa).nombre
    
    mensaje = f"Hola {candidato.nombre}, has realizado una postulación a la oferta: {oferta.nombre}, de la empresa {empresa_nombre}.\n"
    
    enviar_notificacion_candidato_mail(candidato.correo, mensaje)

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

        upload_folder = candidato_bp.image_upload_folder

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

        upload_folder = candidato_bp.upload_folder
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
        query = Oferta_laboral.query
        query = construir_query_con_filtros(filtros, query)

        print(str(query.statement.compile(compile_kwargs={"literal_binds": True})))
        
        ofertas = query.all()

        resultado = []
        for oferta in ofertas:
            try:
                resultado.append({
                    "id": oferta.id,
                    "nombre_oferta": oferta.nombre,
                    "empresa": oferta.empresa.nombre,
                    "palabras_clave": json.loads(oferta.palabras_clave or "[]"),
                })
            except Exception as e:
                print(f"Error al procesar oferta {oferta.id}: {e}")

        if not resultado:
            return jsonify({"message": "No se encontraron ofertas para los filtros aplicados."}), 404

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
                or_(*[Oferta_laboral.palabras_clave.ilike(f"%{palabra}%") for palabra in palabras_clave_cv])
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
                print(f"🔎 Coincidencias encontradas en texto plano: {porcentaje_palabras}%")

                vectores_cv = modelo_sbert.encode(partes_cv)
                vector_keywords = modelo_sbert.encode(" ".join(palabras_clave))
                max_sim = max(cosine_similarity([vector_keywords], vectores_cv)[0])
                porcentaje_sbert = int(max_sim * 100)

                print(f"🔎 Coincidencia semántica calculada: {porcentaje_sbert}%")

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
        "foto_url":  candidato.foto_url 
    }

@swag_from('../docs/candidato/estado-postulaciones.yml')
@candidato_bp.route("/estado-postulaciones-candidato", methods=["GET"])
@role_required(["candidato"])
def estado_postulaciones():
    id_candidato = get_jwt_identity()

    postulaciones = (
        db.session.query(
            Job_Application.id,
            Oferta_laboral.id,
            Oferta_laboral.nombre,
            Job_Application.estado_postulacion,
            Job_Application.fecha_postulacion
        )
        .join(Oferta_laboral, Job_Application.id_oferta == Oferta_laboral.id)
        .filter(Job_Application.id_candidato == id_candidato)
        .all()
    )

    resultado = [
        {
            "id_postulacion": id_postulacion,
            "id_oferta": id_oferta,
            "nombre_oferta": nombre,
            "estado": estado,
            "fecha_postulacion": fecha.isoformat(),
        }
        for id_postulacion, id_oferta, nombre, estado, fecha in postulaciones
    ]

    if not resultado:
        return jsonify({"message": "No se encontraron postulaciones para este candidato."}), 404

    return jsonify(resultado), 200


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

@candidato_bp.route("/notificaciones-candidato-no-leidas", methods=["GET"])
@role_required(["candidato"])
def obtener_notificaciones_no_leidas():
    try:
        id_usuario = get_jwt_identity()

        notificaciones = (
            Notificacion.query
            .filter_by(id_usuario=id_usuario, leida=False)
            .order_by(Notificacion.fecha_creacion.desc())
            .all()
        )

        if not notificaciones:
            return jsonify({"message": "No se encontraron notificaciones no leídas"}), 404

        resultado = [n.to_dict() for n in notificaciones]

        return jsonify({
            "message": "Notificaciones no leídas recuperadas correctamente",
            "notificaciones": resultado
        }), 200

    except Exception as e:
        print(f"Error al obtener notificaciones no leídas: {e}")
        return jsonify({"error": "Error interno al recuperar las notificaciones"}), 500



@candidato_bp.route("/leer-notificacion-candidato/<int:id_notificacion>", methods=["PUT"])
@role_required(["candidato"])
def leer_notificacion(id_notificacion):
    try:
        id_usuario = get_jwt_identity()

        notificacion = Notificacion.query.filter_by(id=id_notificacion, id_usuario=id_usuario).first()

        if not notificacion:
            return jsonify({"error": "Notificación no encontrada o no pertenece al usuario"}), 404

        notificacion.leida = True
        db.session.commit()

        return jsonify({
            "message": "Notificación marcada como leída",
            "notificacion_id": notificacion.id,
            "estado": "leída"
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al marcar notificación como leída: {e}")
        return jsonify({"error": "Error interno al actualizar la notificación"}), 500
    

@candidato_bp.route("/notificaciones-candidato-no-leidas-contador", methods=["GET"])
@role_required(["candidato"])
def obtener_contador_notificaciones_no_leidas():
    try:
        id_usuario = get_jwt_identity()

        contador = Notificacion.query.filter_by(id_usuario=id_usuario, leida=False).count()

        return jsonify({
            "message": "Contador de notificaciones no leídas recuperado correctamente",
            "total_no_leidas": contador
        }), 200

    except Exception as e:
        print(f"Error al obtener contador de notificaciones no leídas: {e}")
        return jsonify({"error": "Error interno al recuperar el contador"}), 500
    
    
def enviar_notificacion_candidato_mail(email_destino, cuerpo):
    try:
        asunto = "Postulación realizada"
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")


@candidato_bp.route("/notificaciones-candidato-todas", methods=["GET"])
@role_required(["candidato"])
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
