import json
import os
from datetime import datetime, timezone, date
from models.extensions import mail
from .notificacion import crear_notificacion
from flask_mail import Message
from .candidato import allowed_image
from sqlalchemy import and_, or_
from auth.decorators import role_required
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity
from models.extensions import db
from models.schemes import (
    CV,
    Empresa,
    Job_Application,
    Licencia,
    Oferta_analista,
    Oferta_laboral,
    Usuario,
    Notificacion,
    RendimientoEmpleado,
    Rol,
    UsuarioRol,
)
from werkzeug.utils import secure_filename
from flasgger import swag_from
from ml.desempeno_desarrollo.predictions import predecir_rot_post_individual

reclutador_bp = Blueprint("reclutador", __name__)


@reclutador_bp.route("/reclutador-home", methods=["GET"])
@role_required(["reclutador"])
def reclutador_dashboard():
    try:
        id_reclutador = get_jwt_identity()
        reclutador = Usuario.query.get(id_reclutador)
        
        if not reclutador:
            return jsonify({"error": "Reclutador no encontrado"}), 404
        
        return jsonify({
            "message": "Bienvenido al dashboard de reclutador",
            "nombre": reclutador.nombre,
            "apellido": reclutador.apellido
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
reclutador_bp.image_upload_folder = UPLOAD_FOLDER_IMG
os.makedirs(UPLOAD_FOLDER_IMG, exist_ok=True)

@reclutador_bp.route("/subir-image-reclutador", methods=["POST"])
@role_required(["reclutador"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_image(file.filename):
        id_reclutador = get_jwt_identity()
        usuario = Usuario.query.get(id_reclutador)

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"usuario_{id_reclutador}.{ext}"

        upload_folder = reclutador_bp.image_upload_folder

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


@swag_from('../docs/reclutador/definir-palabras-clave.yml')
@reclutador_bp.route("/definir_palabras_clave/<int:id_oferta>", methods=["POST"])
@role_required(["reclutador"])
def definir_palabras_clave(id_oferta):
    try:
        data = request.get_json()
        nuevas_palabras = data.get("palabras_clave")

        if not nuevas_palabras or not isinstance(nuevas_palabras, list):
            return jsonify({"error": "Se debe enviar una lista de palabras clave"}), 400

        oferta = Oferta_laboral.query.get(id_oferta)

        if not oferta:
            return jsonify(
                {"error": f"No se encontró la oferta laboral con ID {id_oferta}"}
            ), 404

        oferta.palabras_clave = json.dumps(nuevas_palabras)

        db.session.commit()

        return jsonify({"message": "Palabras clave actualizadas exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@swag_from('../docs/reclutador/ver-candidatos-oferta.yml')
@reclutador_bp.route("/ver_candidatos/<int:id_oferta>", methods=["GET"])
@role_required(["reclutador"])
def ver_postulantes(id_oferta):
    try:
        oferta = Oferta_laboral.query.get(id_oferta)
        if not oferta:
            return jsonify({"error": "Oferta laboral no encontrada"}), 404

        id_reclutador = get_jwt_identity()
        reclutador = Usuario.query.filter_by(id=id_reclutador).first()
        id_empresa = reclutador.id_empresa

        if oferta.id_empresa != id_empresa and oferta.id_reclutador != id_reclutador:
            return jsonify({"error": "No tienes permiso para ver esta oferta"}), 403

        nombre = request.args.get("nombre", default=None, type=str)
        email = request.args.get("email", type=str)
        is_apto = request.args.get("is_apto", default=None, type=str)
        fecha_desde = request.args.get("fecha_desde", default=None, type=str)
        fecha_hasta = request.args.get("fecha_hasta", default=None, type=str)

        filtros = [Job_Application.id_oferta == id_oferta]

        if is_apto is not None:
            filtros.append(Job_Application.is_apto == (is_apto.lower() == "true"))

        if nombre:
            filtros.append(Usuario.nombre.ilike(f"%{nombre}%"))

        if email:
            filtros.append(Usuario.correo.ilike(f"%{email}%"))

        if fecha_desde:
            filtros.append(Job_Application.fecha_postulacion >= fecha_desde)

        if fecha_hasta:
            filtros.append(Job_Application.fecha_postulacion <= fecha_hasta)

        postulaciones = (
            db.session.query(
                Job_Application.id,
                Usuario.nombre,
                Usuario.correo,
                Job_Application.fecha_postulacion,
                Job_Application.is_apto,
                CV.url_cv,
                Job_Application.estado_postulacion,
                Job_Application.porcentaje_similitud,
            )
            .join(Usuario, Usuario.id == Job_Application.id_candidato)
            .outerjoin(CV, CV.id == Job_Application.id_cv)
            .filter(and_(*filtros))
            .all()
        )

        resultado = [
            {
                "id_postulacion": id_postulacion,
                "nombre": nombre,
                "email": email,
                "fecha_postulacion": fecha.isoformat(),
                "is_apto": is_apto,
                "cv_url": cv_url,
                "estado_postulacion": estado_postulacion, 
                "porcentaje_similitud": porcentaje_similitud
            }
            for id_postulacion, nombre, email, fecha, is_apto, cv_url, estado_postulacion, porcentaje_similitud in postulaciones
        ]

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@reclutador_bp.route("/evaluar-postulacion/<int:id_postulacion>", methods=["POST"])
@role_required(["reclutador"])
def evaluar_postulacion(id_postulacion):
    id_reclutador = get_jwt_identity()
    postulacion = Job_Application.query.get(id_postulacion)
    data = request.get_json()
    nuevo_estado = data.get("estado")
    
    if nuevo_estado not in ["aprobada", "rechazada"]:
            return jsonify({"error": "Estado inválido"}), 400
    
    if not postulacion:
        return jsonify({"error": "Postulación no encontrada"}), 404

    candidato = Usuario.query.get(postulacion.id_candidato)
    if not candidato:
        return jsonify({"error": "Candidato no encontrado"}), 404
    
    id_oferta = postulacion.id_oferta
    oferta = Oferta_laboral.query.get(id_oferta)
    correo_candidato = candidato.correo
    
    if not oferta:
        return jsonify({"error": "Oferta laboral no encontrada"}), 404
    
    if postulacion.estado_postulacion != "pendiente":
        return jsonify({"error": "La postulación ya ha sido procesada"}), 400
    
    postulacion.estado_postulacion = nuevo_estado
    
    db.session.commit()
    
    nombre_empresa = Empresa.query.get(oferta.id_empresa).nombre
    nombre_oferta = oferta.nombre
    
    enviar_notificacion_candidato(correo_candidato, nuevo_estado, nombre_empresa, nombre_oferta)
    
    crear_notificacion(postulacion.id_candidato, f"Tu postulación a la oferta {nombre_oferta} ha sido {nuevo_estado}.")
    
    return jsonify({"message": f"Postulación {nuevo_estado} y notificación enviada"}), 200

def enviar_notificacion_candidato(email_destino, estado, nombre_empresa, nombre_oferta):
    try:
        asunto = "Actualización de tu Postulación al puesto de " + nombre_oferta
        cuerpo = f"Nos contactamos desde {nombre_empresa}. ¡Felicitaciones! Tu postulación a la oferta {nombre_oferta} ha sido aprobada." if estado == "aprobada" else f"Nos contactamos desde {nombre_empresa}. Lamentablemente, en esta ocasión hemos decidido avanzar con otro perfil para el puesto de {nombre_oferta}."
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")

# @swag_from('../docs/reclutador/solicitud-licencia.yml')
# @reclutador_bp.route("/solicitud-licencia", methods=["POST"])
# @role_required(["reclutador"])
# def solicitar_licencia1():
#     data = request.get_json()
#     tipo_licencia = data.get("lic_type")
#     descripcion = data.get("description")

#     id_empleado = get_jwt_identity()
#     empleado = Usuario.query.filter_by(id=id_empleado).first()

#     nueva_licencia = Licencia(
#         id_empleado=id_empleado,
#         tipo=tipo_licencia,
#         descripcion=descripcion,
#         estado="pendiente",
#         id_empresa=empleado.id_empresa,
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

# ESTA ERA LA ANTERIOR
# @reclutador_bp.route("/mis-licencias-reclutador", methods=["GET"])
# @role_required(["reclutador"])
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
# ESTA ERA LA ANTERIOR

# @swag_from('../docs/reclutador/mis-licencias.yml')
# @reclutador_bp.route("/mis-licencias", methods=["GET"])
# @role_required(["reclutador"])
# def ver_mis_licencias():
#     id_reclutador = get_jwt_identity()
#     licencias = Licencia.query.filter_by(id_empleado=id_reclutador).all()

#     resultado = [
#         {
#             "licencias": {
#                 "licencia": {
#                     "id_licencia": licencia.id,
#                     "tipo": licencia.tipo,
#                     "descripcion": licencia.descripcion,
#                     "fecha_inicio": licencia.fecha_inicio.isoformat()
#                     if licencia.fecha_inicio
#                     else None,
#                     "estado": licencia.estado,
#                     "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
#                     "empresa": {
#                         "id": licencia.id_empresa,
#                         "nombre": Empresa.query.get(licencia.id_empresa).nombre,
#                     },
#                     "certificado_url": licencia.certificado_url
#                     if licencia.certificado_url
#                     else None,
#                 }
#             }
#         }
#         for licencia in licencias
#     ]

#     return jsonify(resultado), 200


UPLOAD_FOLDER = "uploads/certificados"  # Carpeta donde se guardarán los certificados
ALLOWED_EXTENSIONS = {"pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@swag_from('../docs/reclutador/subir-certificado.yml')
@reclutador_bp.route("/subir-certificado", methods=["POST"])
@role_required(["reclutador"])
def subir_certificado_generico_reclutador():
    # Verificar si se envió un archivo
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    # Verificar si el archivo tiene un nombre válido y es un PDF
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify(
            {"error": "Formato de archivo no permitido. Solo se aceptan archivos PDF"}
        ), 400

    # Generar nombre único con timestamp para evitar sobrescritura
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = secure_filename(file.filename.rsplit(".", 1)[0])
    ext = file.filename.rsplit(".", 1)[1].lower()
    nombre_final = f"{filename}_{timestamp}.{ext}"

    # Guardar el archivo en el servidor
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

@swag_from('../docs/reclutador/ver-cv.yml')
@reclutador_bp.route("/ver-cv/<path:url_cv>", methods=["GET"])
@role_required(["reclutador"])
def ver_certificado(url_cv):
    if not url_cv:
        return jsonify({"error": "CV no encontrado"}), 404

    file_path = os.path.join(os.getcwd(), url_cv)

    try:
        return send_file(file_path, as_attachment=False)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@swag_from('../docs/reclutador/mis-ofertas-laborales.yml')
@reclutador_bp.route("/mis-ofertas-laborales-reclutador", methods=["GET"])
@role_required(["reclutador"])
def obtener_ofertas_asignadas():
    id_reclutador = get_jwt_identity()
    reclutador = Usuario.query.get(id_reclutador)
    empresa = Empresa.query.get(reclutador.id_empresa)

    ofertas = Oferta_analista.query.filter_by(id_analista=reclutador.id).all()

    resultado = resultado = [
        {
            "id_oferta": oferta.id,
            "nombre": oferta.nombre,
            "descripcion": oferta.descripcion,
            "location": oferta.location,
            "employment_type": oferta.employment_type,
            "workplace_type": oferta.workplace_type,
            "salary_min": oferta.salary_min,
            "salary_max": oferta.salary_max,
            "currency": oferta.currency,
            "experience_level": oferta.experience_level,
            "is_active": oferta.is_active,
            "palabras_clave": json.loads(oferta.palabras_clave),
            "fecha_publicacion": oferta.fecha_publicacion.isoformat()
            if oferta.fecha_publicacion
            else None,
            "fecha_cierre": oferta.fecha_cierre.isoformat()
            if oferta.fecha_cierre
            else None,
        }
        for relacion in ofertas
        for oferta in [Oferta_laboral.query.get(relacion.id_oferta)]
    ]

    return jsonify(
        {"ofertas": resultado, "empresa": {"id": empresa.id, "nombre": empresa.nombre}}
    ), 200

from datetime import datetime, timezone, timedelta

# @reclutador_bp.route("/solicitar-licencia-reclutador", methods=["POST"])
# @role_required(["reclutador"])
# def solicitar_licencia2():
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

# ESTA ERA LA ANTERIOR
# @reclutador_bp.route("/solicitar-licencia-reclutador", methods=["POST"])
# @role_required(["reclutador"])
# def solicitar_licencia():
#     data = request.get_json()
#     tipo_licencia = data.get("lic_type")
#     descripcion = data.get("description")
#     fecha_inicio = data.get("start_date")
#     fecha_fin = data.get("end_date")
#     certificado_url = data.get("certificado_url")
#     dias_requeridos = data.get("dias_requeridos")

#     id_empleado = get_jwt_identity()
#     empleado = Usuario.query.filter_by(id=id_empleado).first()

#     now = datetime.now(timezone.utc)

#     # Tipos de licencia válidos
#     tipos_validos = [
#         "accidente_laboral", "enfermedad", "maternidad", "nacimiento_hijo",
#         "duelo", "matrimonio", "mudanza", "estudios", "vacaciones", "otro"
#     ]
#     if tipo_licencia not in tipos_validos:
#         return jsonify({"error": "Tipo de licencia inválido"}), 400

#     estado = None
#     fecha_inicio_dt = None
#     fecha_fin_dt = None
#     dias_requeridos_val = None

#     # Accidente laboral
#     if tipo_licencia == "accidente_laboral":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para accidente laboral"}), 400
#         if not dias_requeridos:
#             return jsonify({"error": "Debe indicar la cantidad de días requeridos"}), 400
#         try:
#             dias_requeridos_val = int(dias_requeridos)
#         except ValueError:
#             return jsonify({"error": "Cantidad de días inválida"}), 400
#         if dias_requeridos_val < 1:
#             return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
#         fecha_inicio_dt = now
#         fecha_fin_dt = now + timedelta(days=dias_requeridos_val-1)
#         estado = "activa"

#     # Médica
#     elif tipo_licencia == "enfermedad":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para licencia médica"}), 400
#         if not dias_requeridos:
#             return jsonify({"error": "Debe indicar la cantidad de días requeridos"}), 400
#         try:
#             dias_requeridos_val = int(dias_requeridos)
#         except ValueError:
#             return jsonify({"error": "Cantidad de días inválida"}), 400
#         if dias_requeridos_val < 1:
#             return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
#         fecha_inicio_dt = now
#         fecha_fin_dt = now + timedelta(days=dias_requeridos_val-1)
#         estado = "activa"

#     # Maternidad
#     elif tipo_licencia == "maternidad":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para maternidad"}), 400
#         fecha_inicio_dt = now
#         fecha_fin_dt = now + timedelta(days=90-1)
#         estado = "activa"

#     # Paternidad
#     elif tipo_licencia == "nacimiento_hijo":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para paternidad"}), 400
#         fecha_inicio_dt = now
#         fecha_fin_dt = now + timedelta(days=10-1)
#         estado = "activa"

#     # Duelo
#     elif tipo_licencia == "duelo":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para duelo"}), 400
#         fecha_inicio_dt = now
#         fecha_fin_dt = now + timedelta(days=5-1)
#         estado = "activa"

#     # Matrimonio
#     elif tipo_licencia == "matrimonio":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para matrimonio"}), 400
#         if not fecha_inicio:
#             return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
#         try:
#             fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
#         except Exception:
#             return jsonify({"error": "Formato de fecha de inicio inválido"}), 400
#         fecha_fin_dt = fecha_inicio_dt + timedelta(days=10-1)
#         estado = "aprobada"

#     # Mudanza
#     elif tipo_licencia == "mudanza":
#         if not fecha_inicio:
#             return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
#         try:
#             fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
#         except Exception:
#             return jsonify({"error": "Formato de fecha de inicio inválido"}), 400
#         fecha_fin_dt = fecha_inicio_dt + timedelta(days=2-1)
#         estado = "aprobada"

#     # Estudios
#     elif tipo_licencia == "estudios":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
#         if not dias_requeridos:
#             return jsonify({"error": "Debe indicar la cantidad de dias requeridos"}), 400
#         if dias_requeridos < 1 or dias_requeridos > 10:
#             return jsonify({"error": "La cantidad de dias debe estar entre 1 y 10"}), 400
#         try:
#             dias_requeridos_val = int(dias_requeridos)
#         except ValueError:
#             return jsonify({"error": "Cantidad de días inválida"}), 400
#         if not fecha_inicio:
#             return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
#         fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
#         fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos_val-1)
#         estado = "aprobada"

#     # Vacaciones
#     elif tipo_licencia == "vacaciones":
#         if not dias_requeridos:
#             return jsonify({"error": "Debe indicar la cantidad de dias requeridos"}), 400
#         if dias_requeridos < 1:
#             return jsonify({"error": "La cantidad de dias debe ser mayor a 0"}), 400
#         try:
#             dias_requeridos_val = int(dias_requeridos)
#         except ValueError:
#             return jsonify({"error": "Cantidad de días inválida"}), 400
#         if not fecha_inicio:
#             return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
#         fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
#         fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos_val-1)
#         estado = "pendiente"

#     elif tipo_licencia == "otro":
#         if not certificado_url:
#             return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
#         if not dias_requeridos:
#             return jsonify({"error": "Debe indicar la cantidad de días requeridos"}), 400
#         try:
#             dias_requeridos_val = int(dias_requeridos)
#         except ValueError:
#             return jsonify({"error": "Cantidad de días inválida"}), 400
#         if dias_requeridos_val < 1:
#             return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
#         fecha_inicio_dt = now
#         fecha_fin_dt = now + timedelta(days=dias_requeridos_val-1)
#         estado = "pendiente"

#     nueva_licencia = Licencia(
#         id_empleado=id_empleado,
#         tipo=tipo_licencia,
#         descripcion=descripcion,
#         fecha_inicio=fecha_inicio_dt,
#         fecha_fin=fecha_fin_dt,
#         estado=estado,
#         id_empresa=empleado.id_empresa,
#         certificado_url=certificado_url,
#         dias_requeridos=dias_requeridos_val,
#     )

#     db.session.add(nueva_licencia)
#     db.session.commit()

#     # Si el estado de la licencia es activa, colocar al reclutador como inactivo
#     if nueva_licencia.estado == "activa":
#         empleado.activo = False
#         db.session.commit()

#     # Si el reclutador está inactivo, liberar las ofertas laborales que tenia asignadas
#     if not empleado.activo:
#         ofertas_asignadas = Oferta_analista.query.filter_by(id_analista=id_empleado).all()
#         if ofertas_asignadas:
#             for oferta in ofertas_asignadas:
#                 oferta.estado = "libre"
#                 db.session.commit()

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
# ESTA ERA LA ANTERIOR

@reclutador_bp.route("/notificaciones-reclutador-no-leidas", methods=["GET"])
@role_required(["reclutador"])
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
            return jsonify({"message": "No se encontraron notificaciones no leídas"}), 404

        resultado = [n.to_dict() for n in notificaciones]

        return jsonify({
            "message": "Notificaciones no leídas recuperadas correctamente",
            "notificaciones": resultado
        }), 200

    except Exception as e:
        print(f"Error al obtener notificaciones no leídas: {e}")
        return jsonify({"error": "Error interno al recuperar las notificaciones"}), 500
    

@reclutador_bp.route("/notificaciones-reclutador-todas", methods=["GET"])
@role_required(["reclutador"])
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



@reclutador_bp.route("/leer-notificacion-reclutador/<int:id_notificacion>", methods=["PUT"])
@role_required(["reclutador"])
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
    

@reclutador_bp.route("/notificaciones-reclutador-no-leidas-contador", methods=["GET"])
@role_required(["reclutador"])
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
    

def calcular_antiguedad(fecha_ingreso):
    hoy = date.today()
    if isinstance(fecha_ingreso, datetime):
        fecha_ingreso = fecha_ingreso.date()
    if fecha_ingreso > hoy:
        return 0
    antiguedad = hoy.year - fecha_ingreso.year - (
        (hoy.month, hoy.day) < (fecha_ingreso.month, fecha_ingreso.day)
    )
    return max(antiguedad, 0)


@reclutador_bp.route("/empleados-rendimiento-reclutador", methods=["GET"])
@role_required(["reclutador"])
def obtener_empleados_rendimiento_futuro():
    try:
        id_manager = get_jwt_identity()

        manager = Usuario.query.get(id_manager)

        if not manager or not manager.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        empleados = (
            db.session.query(Usuario, RendimientoEmpleado)
            .join(RendimientoEmpleado, Usuario.id == RendimientoEmpleado.id_usuario)
            .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
            .join(Rol, UsuarioRol.id_rol == Rol.id)
            .filter(Usuario.id_empresa == manager.id_empresa)
            .filter(Rol.slug == "empleado")
            .all()
        )

        if not empleados:
            return jsonify({"message": "No tienes empleados asociados con rendimiento registrado"}), 404

        def clasificar_rendimiento(valor):
            if valor is None:
                return "Sin Datos"
            elif valor >= 7.5:
                return "Alto Rendimiento"
            elif valor >= 5:
                return "Medio Rendimiento"
            else:
                return "Bajo Rendimiento"

        datos_empleados = []

        for empleado, rendimiento in empleados:
            datos_empleados.append({
                "id_usuario": empleado.id,
                "nombre": empleado.nombre,
                "apellido": empleado.apellido,
                "desempeno_previo": rendimiento.desempeno_previo,
                "horas_extras": rendimiento.horas_extras,
                "antiguedad": calcular_antiguedad(empleado.fecha_ingreso),
                "horas_capacitacion": rendimiento.horas_capacitacion,
                "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho,
                "clasificacion_rendimiento": clasificar_rendimiento(rendimiento.rendimiento_futuro_predicho),
                "puesto": empleado.puesto_trabajo,
                "fecha_calculo_rendimiento": rendimiento.fecha_calculo_rendimiento
            })

        resumen_rendimiento = {
            "Alto Rendimiento": sum(1 for emp in datos_empleados if emp["clasificacion_rendimiento"] == "Alto Rendimiento"),
            "Medio Rendimiento": sum(1 for emp in datos_empleados if emp["clasificacion_rendimiento"] == "Medio Rendimiento"),
            "Bajo Rendimiento": sum(1 for emp in datos_empleados if emp["clasificacion_rendimiento"] == "Bajo Rendimiento")
        }

        return jsonify({
            "message": "Datos cargados correctamente",
            "empleados": datos_empleados,
            "resumen_riesgo": resumen_rendimiento
        }), 200

    except Exception as e:
        print(f"Error en /empleados-rendimiento: {e}")
        return jsonify({"error": str(e)}), 500
    

@reclutador_bp.route("/empleados-riesgo-reclutador", methods=["GET"])
@role_required(["reclutador"])
def obtener_empleados_riesgo_futuro():
    try:
        id_manager = get_jwt_identity()

        manager = Usuario.query.get(id_manager)

        if not manager or not manager.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        empleados = (
            db.session.query(Usuario, RendimientoEmpleado)
            .join(RendimientoEmpleado, Usuario.id == RendimientoEmpleado.id_usuario)
            .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
            .join(Rol, UsuarioRol.id_rol == Rol.id)
            .filter(Usuario.id_empresa == manager.id_empresa)
            .filter(Rol.slug == "empleado")
            .all()
        )

        if not empleados:
            return jsonify({"message": "No tienes empleados asociados con rendimiento registrado"}), 404

        def clasificar_rendimiento(valor):
            if valor is None:
                return "Sin Datos"
            elif valor >= 7.5:
                return "Alto Rendimiento"
            elif valor >= 5:
                return "Medio Rendimiento"
            else:
                return "Bajo Rendimiento"

        datos_empleados = []

        for empleado, rendimiento in empleados:
            historial = sorted(empleado.historial_rendimiento_manual, key=lambda x: x.fecha_calculo, reverse=True)
            empleado_data = []
            cantidad_postulaciones = obtener_cantidad_postulaciones(empleado.id)
            if historial:
                ultimo_rendimiento_manual = historial[0].rendimiento
                desempeno_real_guardado = rendimiento.riesgo_rotacion_intencional
                if (desempeno_real_guardado is None or desempeno_real_guardado != ultimo_rendimiento_manual):
                    empleado_data = {
                        "cantidad_postulaciones": cantidad_postulaciones,
                        "desempeno_previo": ultimo_rendimiento_manual
                    }
                    riesgo_rotacion_intencional = predecir_rot_post_individual(empleado_data)
                    rendimiento.riesgo_rotacion_intencional = riesgo_rotacion_intencional
                    db.session.commit()
                    
                else:
                    riesgo_rotacion_intencional = desempeno_real_guardado
            else:
                ultimo_rendimiento_manual = "-"
                riesgo_rotacion_intencional = "-"
            
            
            datos_empleados.append({
                "id_usuario": empleado.id,
                "nombre": empleado.nombre,
                "apellido": empleado.apellido,
                "desempeno_previo": rendimiento.desempeno_previo,
                "antiguedad": calcular_antiguedad(empleado.fecha_ingreso),
                "horas_capacitacion": rendimiento.horas_capacitacion,
                "ausencias_injustificadas": rendimiento.ausencias_injustificadas,
                "llegadas_tarde": rendimiento.llegadas_tarde,
                "salidas_tempranas": rendimiento.salidas_tempranas,
                "puesto": empleado.puesto_trabajo if empleado.puesto_trabajo else "Analista",                
                "riesgo_rotacion_predicho": rendimiento.riesgo_rotacion_predicho,
                "riesgo_despido_predicho": rendimiento.riesgo_despido_predicho,
                "riesgo_renuncia_predicho": rendimiento.riesgo_renuncia_predicho,
                "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho,
                "clasificacion_rendimiento": clasificar_rendimiento(rendimiento.rendimiento_futuro_predicho),
                "fecha_calculo_rendimiento": rendimiento.fecha_calculo_rendimiento,
                "ultimo_rendimiento_manual": ultimo_rendimiento_manual,
                "cantidad_postulaciones": cantidad_postulaciones,
                "riesgo_rotacion_intencional": riesgo_rotacion_intencional
            })

        resumen_rendimiento = {
            "Alto Rendimiento": sum(1 for emp in datos_empleados if emp["clasificacion_rendimiento"] == "Alto Rendimiento"),
            "Medio Rendimiento": sum(1 for emp in datos_empleados if emp["clasificacion_rendimiento"] == "Medio Rendimiento"),
            "Bajo Rendimiento": sum(1 for emp in datos_empleados if emp["clasificacion_rendimiento"] == "Bajo Rendimiento")
        }

        resumen_rotacion = {
            "Alto Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_rotacion_predicho"] == "alto"),
            "Medio Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_rotacion_predicho"] == "medio"),
            "Bajo Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_rotacion_predicho"] == "bajo")
        }

        resumen_despido = {
            "Alto Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_despido_predicho"] == "alto"),
            "Medio Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_despido_predicho"] == "medio"),
            "Bajo Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_despido_predicho"] == "bajo")
        }

        resumen_renuncia = {
            "Alto Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_renuncia_predicho"] == "alto"),
            "Medio Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_renuncia_predicho"] == "medio"),
            "Bajo Rendimiento": sum(1 for emp in datos_empleados if emp["riesgo_renuncia_predicho"] == "bajo")
        }

        return jsonify({
            "message": "Datos cargados correctamente",
            "empleados": datos_empleados,
            "resumen_riesgo": resumen_rendimiento,
            "resumen_rotacion": resumen_rotacion,
            "resumen_despido": resumen_despido,
            "resumen_renuncia": resumen_renuncia
        }), 200

    except Exception as e:
        print(f"Error en /empleados-riesgo-analistas: {e}")
        return jsonify({"error": str(e)}), 500
    
def obtener_cantidad_postulaciones(id_empleado):
    cantidad = (
        db.session.query(db.func.count(Job_Application.id))
        .filter(Job_Application.id_candidato == id_empleado)
        .scalar()
    )
    return cantidad
    
@reclutador_bp.route("/notificar-bajo-rendimiento-empleados/<int:id_empleado>", methods=["POST"])
@role_required(["reclutador"])
def notificar_bajo_rendimiento(id_empleado):

    if not id_empleado:
        return jsonify({"error": "El ID del empleado es requerido"}), 400

    # Obtener el admin-emp autenticado
    id_analista = get_jwt_identity()
    analista = Usuario.query.get(id_analista)
    if not analista or not analista.id_empresa:
        return jsonify({"error": "No tienes una empresa asociada"}), 404

    # Obtener el empleado
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Verificar que el empleado pertenece a la misma empresa
    if empleado.id_empresa != analista.id_empresa:
        return jsonify({"error": "No tienes permiso para notificar a este empleado"}), 403

    mensaje = "Tu proyección de rendimiento ha sido clasificada como 'Bajo Rendimiento'. Te invitamos a que tomes las medidas necesarias para mejorar tu desempeño. Si tienes alguna duda, no dudes en contactar a tu superior."

    crear_notificacion(id_analista, mensaje)

    enviar_notificacion_empleado_rendimiento(empleado.correo, analista.id_empresa, mensaje)

    # Enviar la notificación (aquí puedes implementar la lógica para enviar el correo)
    # send_email(empleado.correo, "Notificación de Bajo Rendimiento", mensaje)

    return jsonify({
        "message": f"Notificación enviada al empleado {analista.nombre} {analista.apellido}"
    }), 200
    
def enviar_notificacion_empleado_rendimiento(email_destino, nombre_empresa, cuerpo):
    try:
        asunto = "Proyección de Rendimiento"
        cuerpo = f"Nos comunicamos desde {nombre_empresa}. " + cuerpo
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")

@reclutador_bp.route("/solicitar-licencia-reclutador", methods=["POST"])
@role_required(["reclutador"])
def solicitar_licencia():
    data = request.get_json()
    tipo_licencia = data.get("lic_type")
    descripcion = data.get("description")
    fecha_inicio = data.get("start_date")
    fecha_fin = data.get("end_date")
    certificado_url = data.get("certificado_url")
    dias_requeridos = data.get("dias_requeridos")

    id_reclutador = get_jwt_identity()
    reclutador = Usuario.query.filter_by(id=id_reclutador).first()

    now = datetime.now(timezone.utc)

    # Obtener la empresa y los días máximos configurados
    empresa = Empresa.query.get(reclutador.id_empresa)
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
        "accidente_laboral", "enfermedad", "maternidad", "nacimiento_hijo",
        "duelo", "matrimonio", "mudanza", "estudios", "vacaciones", "otro"
    ]
    if tipo_licencia not in tipos_validos:
        return jsonify({"error": f"Tipo de licencia '{tipo_licencia}' inválido. Tipos permitidos: {', '.join(tipos_validos)}"}), 400

    estado = None
    fecha_inicio_dt = None
    fecha_fin_dt = None
    dias_requeridos_val = None

    # Accidente laboral
    if tipo_licencia == "accidente_laboral":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para accidente laboral"}), 400
        if not dias_requeridos:
            return jsonify({"error": "Debe indicar la cantidad de días requeridos"}), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1:
            return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_requeridos_val-1)
        estado = "activa"

    # Médica
    elif tipo_licencia == "enfermedad":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia médica"}), 400
        if not dias_requeridos:
            return jsonify({"error": "Debe indicar la cantidad de días requeridos"}), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1:
            return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_requeridos_val-1)
        estado = "activa"

    # Maternidad
    elif tipo_licencia == "maternidad":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para maternidad"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_maximos["maternidad"]-1)
        estado = "activa"

    # Paternidad
    elif tipo_licencia == "nacimiento_hijo":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para paternidad"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_maximos["nacimiento_hijo"]-1)
        estado = "activa"

    # Duelo
    elif tipo_licencia == "duelo":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para duelo"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_maximos["duelo"]-1)
        estado = "activa"

    # Matrimonio
    elif tipo_licencia == "matrimonio":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para matrimonio"}), 400
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            return jsonify({"error": "Formato de fecha de inicio inválido"}), 400
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_maximos["matrimonio"]-1)
        estado = "aprobada"

    # Mudanza
    elif tipo_licencia == "mudanza":
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            return jsonify({"error": "Formato de fecha de inicio inválido"}), 400
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_maximos["mudanza"]-1)
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
            return jsonify({"error": "Debe indicar la cantidad de dias requeridos"}), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1 or dias_requeridos_val > dias_maximos["estudios"]:
            return jsonify({"error": f"La cantidad de días para licencia de estudios debe estar entre 1 y {dias_maximos['estudios']}."}), 400
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos_val-1)
        estado = "aprobada"

    # Vacaciones
    elif tipo_licencia == "vacaciones":
        if not dias_requeridos:
            return jsonify({"error": "Debe indicar la cantidad de dias requeridos"}), 400
        if dias_requeridos < 1:
            return jsonify({"error": "La cantidad de dias debe ser mayor a 0"}), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=dias_requeridos_val-1)
        estado = "pendiente"

    elif tipo_licencia == "otro":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not dias_requeridos:
            return jsonify({"error": "Debe indicar la cantidad de días requeridos"}), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
        if dias_requeridos_val < 1:
            return jsonify({"error": "La cantidad de días debe ser mayor a 0"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=dias_requeridos_val-1)
        estado = "pendiente"

    nueva_licencia = Licencia(
        id_empleado=id_reclutador,
        tipo=tipo_licencia,
        descripcion=descripcion,
        fecha_inicio=fecha_inicio_dt,
        fecha_fin=fecha_fin_dt,
        estado=estado,
        id_empresa=reclutador.id_empresa,
        certificado_url=certificado_url,
        dias_requeridos=dias_requeridos_val,
    )

    db.session.add(nueva_licencia)

    crear_notificacion_uso_especifico(id_reclutador, f"Has solicitado una licencia del tipo {tipo_licencia}")
    crear_notificacion_uso_especifico(reclutador.id_superior, f"El empleado {reclutador.nombre} ha solicitado una licencia del tipo {tipo_licencia}.")
    enviar_mail_empleado_licencia_cuerpo(reclutador.correo, "Solicitud de Licencia", f"Has solicitado una licencia del tipo {tipo_licencia}.")

    db.session.commit()

     # Si el estado de la licencia es activa, colocar al reclutador como inactivo
    if nueva_licencia.estado == "activa":
        reclutador.activo = False
        db.session.commit()

    # Si el reclutador está inactivo, liberar las ofertas laborales que tenia asignadas
    if not reclutador.activo:
        ofertas_asignadas = Oferta_analista.query.filter_by(id_analista=id_reclutador).all()
        if ofertas_asignadas:
            for oferta in ofertas_asignadas:
                oferta.estado = "libre"
                db.session.commit()

    return jsonify(
        {
            "message": "Solicitud de licencia enviada exitosamente",
            "licencia": {
                "id": nueva_licencia.id,
                "tipo": nueva_licencia.tipo,
                "descripcion": nueva_licencia.descripcion,
                "estado": nueva_licencia.estado,
                "fecha_inicio": nueva_licencia.fecha_inicio.isoformat() if nueva_licencia.fecha_inicio else None,
                "fecha_fin": nueva_licencia.fecha_fin.isoformat() if nueva_licencia.fecha_fin else None,
                "dias_requeridos": nueva_licencia.dias_requeridos,
                "empresa": {
                    "id": nueva_licencia.id_empresa,
                    "nombre": Empresa.query.get(nueva_licencia.id_empresa).nombre,
                },
                "certificado_url": nueva_licencia.certificado_url,
            },
        }
    ), 201

@reclutador_bp.route("/mis-licencias-reclutador", methods=["GET"])
@role_required(["reclutador"])
def ver_mis_licencias():
    id_reclutador = get_jwt_identity()
    licencias = Licencia.query.filter_by(id_empleado=id_reclutador).all()

    resultado = [
        {
            "id_licencia": licencia.id,
            "tipo": licencia.tipo,
            "descripcion": licencia.descripcion,
            "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
            "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
            "estado": licencia.estado,
            "estado_sugerencia": licencia.estado_sugerencia if hasattr(licencia, "estado_sugerencia") else None,
            "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat() if hasattr(licencia, "fecha_inicio_sugerencia") and licencia.fecha_inicio_sugerencia else None,
            "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat() if hasattr(licencia, "fecha_fin_sugerencia") and licencia.fecha_fin_sugerencia else None,
            "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
            "dias_requeridos": licencia.dias_requeridos if hasattr(licencia, "dias_requeridos") else None,
            "empresa": {
                "id": licencia.id_empresa,
                "nombre": Empresa.query.get(licencia.id_empresa).nombre,
            },
            "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
        }
        for licencia in licencias
    ]

    return jsonify(resultado), 200

@reclutador_bp.route("/mi-licencia-<int:id_licencia>-reclutador/informacion", methods=["GET"])
@role_required(["reclutador"])
def obtener_detalle_licencia_reclutador(id_licencia):
    id_reclutador = get_jwt_identity()
    licencia = Licencia.query.filter_by(id=id_licencia, id_empleado=id_reclutador).first()

    if not licencia:
        return jsonify({"error": "Licencia no encontrada o no pertenece al empleado"}), 404

    empresa = Empresa.query.get(licencia.id_empresa)

    detalle = {
        "id_licencia": licencia.id,
        "tipo": licencia.tipo,
        "descripcion": licencia.descripcion,
        "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
        "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
        "estado": licencia.estado,
        "estado_sugerencia": getattr(licencia, "estado_sugerencia", None),
        "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat() if getattr(licencia, "fecha_inicio_sugerencia", None) else None,
        "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat() if getattr(licencia, "fecha_fin_sugerencia", None) else None,
        "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
        "dias_requeridos": getattr(licencia, "dias_requeridos", None),
        "empresa": {
            "id": licencia.id_empresa,
            "nombre": empresa.nombre if empresa else None,
        },
        "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
    }

    return jsonify(detalle), 200

@reclutador_bp.route("/licencia-<int:id_licencia>-reclutador/respuesta-sugerencia", methods=["PUT"])
@role_required(["reclutador"])
def responder_sugerencia_licencia(id_licencia):
    """
    Permite al empleado aceptar o rechazar una sugerencia de fechas de licencia.
    Espera un JSON con {"aceptacion": True/False}
    """
    data = request.get_json()
    aceptacion = data.get("aceptacion")

    if aceptacion is None:
        return jsonify({"error": "Debe indicar si acepta o rechaza la sugerencia"}), 400

    id_reclutador = get_jwt_identity()
    licencia = Licencia.query.filter_by(id=id_licencia, id_empleado=id_reclutador).first()

    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    if aceptacion:
        licencia.estado_sugerencia = "sugerencia aceptada"
        crear_notificacion_uso_especifico(licencia.id_empleado, f"Tu sugerencia de licencia ha sido aceptada. Nueva fecha de inicio: {licencia.fecha_inicio_sugerencia.isoformat() if licencia.fecha_inicio_sugerencia else 'No definida'}, Nueva fecha de fin: {licencia.fecha_fin_sugerencia.isoformat() if licencia.fecha_fin_sugerencia else 'No definida'}")
    else:
        licencia.estado = "rechazada"
        licencia.estado_sugerencia = "sugerencia rechazada"
        crear_notificacion_uso_especifico(licencia.id_empleado, f"Tu sugerencia de licencia ha sido rechazada. Motivo: {licencia.motivo_rechazo if licencia.motivo_rechazo else 'No especificado'}")

    db.session.commit()

    return jsonify({
        "message": f"Sugerencia {'aceptada' if aceptacion else 'rechazada'} correctamente",
        "estado_sugerencia": licencia.estado_sugerencia
    }), 200

@reclutador_bp.route("/licencias-mis-empleados", methods=["GET"])
@role_required(["reclutador"])
def visualizar_licencias_empleados():
    id_reclutador = get_jwt_identity()
    reclutador = Usuario.query.filter_by(id=id_reclutador).first()
    empresa = Empresa.query.filter_by(id=reclutador.id_empresa).first()

    # Obtener los empleados de la empresa que dependen de este reclutador y tienen rol "empleado"
    empleados = (
        db.session.query(Usuario)
        .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
        .join(Rol, UsuarioRol.id_rol == Rol.id)
        .filter(
            Usuario.id_empresa == empresa.id,
            Rol.slug == "empleado"
        )
        .all()
    )
    ids_empleados = {e.id for e in empleados}

    # Filtrar licencias solo de estos empleados
    licencias = Licencia.query.filter(
        Licencia.id_empresa == empresa.id,
        Licencia.id_empleado.in_(ids_empleados)
    ).all()

    resultado = []
    for licencia in licencias:
        empleado = next((e for e in empleados if e.id == licencia.id_empleado), None)
        if empleado:
            resultado.append(
                {
                    "licencia": {
                        "id_licencia": licencia.id,
                        "empleado": {
                            "id": licencia.id_empleado,
                            "nombre": empleado.nombre,
                            "apellido": empleado.apellido,
                            "username": empleado.username,
                            "email": empleado.correo,
                        },
                        "tipo": licencia.tipo,
                        "descripcion": licencia.descripcion if licencia.descripcion else "Sin descripción",
                        "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
                        "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
                        "estado": licencia.estado,
                        "estado_sugerencia": licencia.estado_sugerencia if licencia.estado_sugerencia else None,
                        "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat() if licencia.fecha_inicio_sugerencia else None,
                        "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat() if licencia.fecha_fin_sugerencia else None,
                        "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "No Aplica",
                        "empresa": {
                            "id": licencia.id_empresa,
                            "nombre": empresa.nombre,
                        },
                        "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
                        "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None,
                    }
                }
            )

    return jsonify(resultado), 200

@reclutador_bp.route("/licencia-<int:id_licencia>-empleado/informacion", methods=["GET"])
@role_required(["reclutador"])
def obtener_detalle_licencia(id_licencia):
    id_reclutador = get_jwt_identity()
    reclutador = Usuario.query.get(id_reclutador)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Verificar que el usuario tiene rol "empleado"
    tiene_rol_empleado = (
        db.session.query(Rol)
        .join(UsuarioRol, UsuarioRol.id_rol == Rol.id)
        .filter(UsuarioRol.id_usuario == empleado.id, Rol.slug == "empleado")
        .first()
    )

    # Solo puede ver si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != reclutador.id_empresa and not tiene_rol_empleado:
        return jsonify({"error": "No tienes permiso para ver esta licencia"}), 403

    empresa = Empresa.query.get(licencia.id_empresa)

    return jsonify({
        "id_licencia": licencia.id,
        "empleado": {
            "id": empleado.id,
            "nombre": empleado.nombre,
            "apellido": empleado.apellido,
            "username": empleado.username,
            "email": empleado.correo,
        },
        "tipo": licencia.tipo,
        "descripcion": licencia.descripcion,
        "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
        "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
        "estado": licencia.estado,
        "estado_sugerencia": licencia.estado_sugerencia if licencia.estado_sugerencia else None,
        "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat() if licencia.fecha_inicio_sugerencia else None,
        "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat() if licencia.fecha_fin_sugerencia else None,
        "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
        "empresa": {
            "id": licencia.id_empresa,
            "nombre": empresa.nombre if empresa else None,
        },  
        "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
        "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None
    }), 200

@reclutador_bp.route("/licencia-<int:id_licencia>-empleado/evaluacion", methods=["PUT"])
@role_required(["reclutador"])
def eval_licencia(id_licencia):
    data = request.get_json()
    nuevo_estado = data.get("estado")  # "aprobada", "rechazada", "sugerencia", "activa y verificada", "invalidada"
    motivo = data.get("motivo")
    fecha_inicio_sugerida = data.get("fecha_inicio_sugerida")
    fecha_fin_sugerida = data.get("fecha_fin_sugerida")

    estados_validos = ["aprobada", "rechazada", "sugerencia", "activa y verificada", "invalidada"]
    if nuevo_estado not in estados_validos:
        return jsonify({"error": f"El estado debe ser uno de {', '.join(estados_validos)}"}), 400

    id_reclutador = get_jwt_identity()
    reclutador = Usuario.query.get(id_reclutador)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Verificar que el usuario tiene rol "empleado"
    tiene_rol_empleado = (
        db.session.query(Rol)
        .join(UsuarioRol, UsuarioRol.id_rol == Rol.id)
        .filter(UsuarioRol.id_usuario == empleado.id, Rol.slug == "empleado")
        .first()
    )

    # Permitir aprobar si la licencia está pendiente o si la sugerencia fue aceptada
    puede_aprobar = (
        (licencia.estado == "pendiente" and licencia.tipo in ["vacaciones"])
        or (licencia.estado == "pendiente" and licencia.estado_sugerencia == "sugerencia aceptada")
        or (licencia.estado == "sugerencia" and licencia.estado_sugerencia == "sugerencia aceptada")
    )

    # Solo puede evaluar si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != reclutador.id_empresa and not tiene_rol_empleado:
        return jsonify({"error": "No tienes permiso para evaluar esta licencia"}), 403
    
    message = f"Licencia {nuevo_estado} exitosamente"

    if nuevo_estado == "aprobada":
        if not puede_aprobar:
            return jsonify({"error": "Solo puedes aprobar licencias de vacaciones pendientes o con sugerencia aceptada"}), 403
        licencia.estado = nuevo_estado
        # Si la sugerencia fue aceptada, actualizar fechas
        if licencia.estado_sugerencia == "sugerencia aceptada":
            licencia.fecha_inicio = licencia.fecha_inicio_sugerencia
            licencia.fecha_fin = licencia.fecha_fin_sugerencia
        if motivo:
            licencia.motivo_rechazo = motivo
            crear_notificacion_uso_especifico(empleado.id, "Tu licencia ha sido aprobada.")
        enviar_mail_empleado_licencia(empleado.correo, "Tu licencia ha sido aprobada.")
    elif nuevo_estado == "sugerencia":
        # Guardar sugerencia de fechas y estado_sugerencia
        if not fecha_inicio_sugerida or not fecha_fin_sugerida:
            return jsonify({"error": "Debes indicar fecha de inicio y fin sugeridas"}), 400
        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio_sugerida, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            fecha_fin_dt = datetime.strptime(fecha_fin_sugerida, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            return jsonify({"error": "Formato de fecha sugerida inválido"}), 400

        licencia.estado = nuevo_estado
        licencia.estado_sugerencia = "sugerencia pendiente"
        licencia.fecha_inicio_sugerencia = fecha_inicio_dt
        licencia.fecha_fin_sugerencia = fecha_fin_dt
        # El estado de la licencia se mantiene pendiente
        if motivo:
            licencia.motivo_rechazo = motivo
        message = "Licencia sugerida exitosamente"
        crear_notificacion_uso_especifico(empleado.id, "Tu licencia ha sido sugerida y está pendiente de aprobación.")
        enviar_mail_empleado_licencia(empleado.correo, "Tu licencia ha sido sugerida y está pendiente de aprobación.")
    elif nuevo_estado == "activa y verificada":
        # Solo se puede verificar si está activa
        if licencia.estado != "activa":
            return jsonify({"error": "Solo puedes verificar licencias en estado 'activa'"}), 403
        licencia.estado = "activa y verificada"
        message = "Licencia verificada exitosamente"
        crear_notificacion_uso_especifico(empleado.id, "Tu licencia ha sido verificada y está activa.")
        enviar_mail_empleado_licencia(empleado.correo, "Tu licencia ha sido verificada y está activa.")
    elif nuevo_estado == "invalidada":
        # Solo se puede invalidar si está activa
        if licencia.estado != "activa":
            return jsonify({"error": "Solo puedes invalidar licencias en estado 'activa'"}), 403
        licencia.estado = "invalidada"
        if motivo:
            licencia.motivo_rechazo = motivo
        message = "Licencia invalidada exitosamente"
        crear_notificacion_uso_especifico(empleado.id, "Tu licencia ha sido invalidada.")
        enviar_mail_empleado_licencia(empleado.correo, "Tu licencia ha sido invalidada.")
    else:
        licencia.estado = nuevo_estado
        if motivo:
            licencia.motivo_rechazo = motivo

    db.session.commit()

    empresa = Empresa.query.get(licencia.id_empresa)

    return jsonify({
        "message": message,
        "licencia": {
            "id_licencia": licencia.id,
            "empleado": {
                "id": licencia.id_empleado,
                "nombre": empleado.nombre,
                "apellido": empleado.apellido,
                "username": empleado.username,
                "email": empleado.correo,
            },
            "tipo": licencia.tipo,
            "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
            "descripcion": licencia.descripcion,
            "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
            "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
            "estado": licencia.estado,
            "estado_sugerencia": licencia.estado_sugerencia if licencia.estado_sugerencia else None,
            "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat() if licencia.fecha_inicio_sugerencia else None,
            "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat() if licencia.fecha_fin_sugerencia else None,
            "empresa": {
                "id": licencia.id_empresa,
                "nombre": empresa.nombre if empresa else None,
            },
            "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
            "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None
        }
    }), 200

@reclutador_bp.route("/licencia-<int:id_licencia>-reclutador/cancelar", methods=["PUT"])
@role_required(["reclutador"])
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
        enviar_mail_empleado_licencia_cuerpo(empleado.correo, "Licencia Cancelada",
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
    

def enviar_mail_empleado_licencia(email_destino, cuerpo):
    try:
        asunto = "Estado de licencia"
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")

def enviar_mail_empleado_licencia_cuerpo(email_destino, asunto, cuerpo):
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