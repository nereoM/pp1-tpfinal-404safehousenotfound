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

@reclutador_bp.route("/mis-licencias-reclutador", methods=["GET"])
@role_required(["reclutador"])
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
          "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
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

    id_empleado = get_jwt_identity()
    empleado = Usuario.query.filter_by(id=id_empleado).first()

    now = datetime.now(timezone.utc)

    # Tipos de licencia válidos
    tipos_validos = [
        "accidente_laboral", "enfermedad", "maternidad", "nacimiento_hijo",
        "duelo", "matrimonio", "mudanza", "estudios", "vacaciones", "otro"
    ]
    if tipo_licencia not in tipos_validos:
        return jsonify({"error": "Tipo de licencia inválido"}), 400

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
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para maternidad"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=90-1)
        estado = "activa"

    # Paternidad
    elif tipo_licencia == "nacimiento_hijo":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para paternidad"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=10-1)
        estado = "activa"

    # Duelo
    elif tipo_licencia == "duelo":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para duelo"}), 400
        fecha_inicio_dt = now
        fecha_fin_dt = now + timedelta(days=5-1)
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
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=10-1)
        estado = "aprobada"

    # Mudanza
    elif tipo_licencia == "mudanza":
        if not fecha_inicio:
            return jsonify({"error": "Debe indicar la fecha de inicio"}), 400
        try:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            return jsonify({"error": "Formato de fecha de inicio inválido"}), 400
        fecha_fin_dt = fecha_inicio_dt + timedelta(days=2-1)
        estado = "aprobada"

    # Estudios
    elif tipo_licencia == "estudios":
        if not certificado_url:
            return jsonify({"error": "Debe adjuntar un certificado para licencia"}), 400
        if not dias_requeridos:
            return jsonify({"error": "Debe indicar la cantidad de dias requeridos"}), 400
        if dias_requeridos < 1 or dias_requeridos > 10:
            return jsonify({"error": "La cantidad de dias debe estar entre 1 y 10"}), 400
        try:
            dias_requeridos_val = int(dias_requeridos)
        except ValueError:
            return jsonify({"error": "Cantidad de días inválida"}), 400
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
    db.session.commit()

    # Si el estado de la licencia es activa, colocar al reclutador como inactivo
    if nueva_licencia.estado == "activa":
        empleado.activo = False
        db.session.commit()

    # Si el reclutador está inactivo, liberar las ofertas laborales que tenia asignadas
    if not empleado.activo:
        ofertas_asignadas = Oferta_analista.query.filter_by(id_analista=id_empleado).all()
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


@reclutador_bp.route("/notificaciones-reclutador-no-leidas", methods=["GET"])
@role_required(["reclutador"])
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
    return hoy.year - fecha_ingreso.year - ((hoy.month, hoy.day) < (fecha_ingreso.month, fecha_ingreso.day))


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
                return "Sin datos"
            if valor >= 7.5:
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
                "desempeno_previo": rendimiento.desempeno_previo,
                "horas_extras": rendimiento.horas_extras,
                "antiguedad": calcular_antiguedad(empleado.fecha_ingreso),
                "horas_capacitacion": rendimiento.horas_capacitacion,
                "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho,
                "clasificacion_rendimiento": clasificar_rendimiento(rendimiento.rendimiento_futuro_predicho),
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
                return "Sin datos"
            if valor >= 7.5:
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
                "desempeno_previo": rendimiento.desempeno_previo,
                "antiguedad": calcular_antiguedad(empleado.fecha_ingreso),
                "horas_capacitacion": rendimiento.horas_capacitacion,
                "ausencias_injustificadas": rendimiento.ausencias_injustificadas,
                "llegadas_tarde": rendimiento.llegadas_tarde,
                "salidas_tempranas": rendimiento.salidas_tempranas,
                "riesgo_rotacion_predicho": rendimiento.riesgo_rotacion_predicho,
                "riesgo_despido_predicho": rendimiento.riesgo_despido_predicho,
                "riesgo_renuncia_predicho": rendimiento.riesgo_renuncia_predicho,
                "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho,
                "clasificacion_rendimiento": clasificar_rendimiento(rendimiento.rendimiento_futuro_predicho),
                "fecha_calculo_rendimiento": rendimiento.fecha_calculo_rendimiento
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
    
@reclutador_bp.route("/licencias-mis-empleados", methods=["GET"])
@role_required(["manager"])
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
            Usuario.id_superior == reclutador.id,
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
                        "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "No Aplica",
                        "empresa": {
                            "id": licencia.id_empresa,
                            "nombre": empresa.nombre,
                        },
                        "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
                    }
                }
            )

    return jsonify(resultado), 200