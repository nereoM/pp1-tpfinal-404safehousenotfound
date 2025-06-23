import json
import secrets
import re
import csv
import pandas as pd
from auth.decorators import role_required
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename
from models.extensions import db
from flasgger import swag_from
from sqlalchemy.sql import func
from sqlalchemy.orm import aliased
from sqlalchemy import and_
from datetime import datetime, timezone, date
from .notificacion import crear_notificacion, enviar_mensaje_telegram
from flask_mail import Message
from models.extensions import mail
import os
from .candidato import allowed_image
from models.schemes import (
    Empresa,
    Licencia,
    Oferta_analista,
    Oferta_laboral,
    Rol,
    Usuario,
    RendimientoEmpleado,
    UsuarioRol,
    Notificacion,
    HistorialRendimientoEmpleado,
    Job_Application,
    Preferencias_empresa,
    HistorialRendimientoEmpleadoManual,
    Periodo,
    Tarea,
    Encuesta,
    RespuestaEncuesta,
    PreguntaEncuesta,
    EncuestaAsignacion,
    UsuarioTelegram,
)
from ml.desempeno_desarrollo.predictions import predecir_rend_futuro_individual, predecir_riesgo_despido_individual, predecir_riesgo_rotacion_individual, predecir_riesgo_renuncia_individual, predecir_rot_post_individual

manager_bp = Blueprint("manager", __name__)


def validar_fecha(fecha_str):
    formatos_validos = ["%Y-%m-%d", "%d/%m/%Y", "%m-%d-%Y"]
    for formato in formatos_validos:
        try:
            datetime.strptime(fecha_str, formato)
            return True
        except ValueError:
            continue
    return False

@manager_bp.route("/manager-home", methods=["GET"])
@role_required(["manager"])
def manager_home():
    return jsonify({"message": "Bienvenido a la Pagina de Inicio de Manager"}), 200

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_file_certificados(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS_CERTIFICADOS

UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
manager_bp.image_upload_folder = UPLOAD_FOLDER_IMG
os.makedirs(UPLOAD_FOLDER_IMG, exist_ok=True)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "info_laboral")
ALLOWED_EXTENSIONS = {"csv", "pdf", "doc", "docx"}
ALLOWED_EXTENSIONS_CERTIFICADOS = {"pdf"}
manager_bp.upload_folder = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@manager_bp.route("/subir-image-manager", methods=["POST"])
@role_required(["manager"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_image(file.filename):
        id_manager = get_jwt_identity()
        usuario = Usuario.query.get(id_manager)

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"usuario_{id_manager}.{ext}"

        upload_folder = manager_bp.image_upload_folder

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

@swag_from('../docs/manager/editar-palabras-clave.yml')
@manager_bp.route("/oferta/<int:id_oferta>/palabras-clave", methods=["PUT"])
@role_required(["manager"])
def editar_palabras_clave(id_oferta):
    id_manager = int(get_jwt_identity())
    manager = Usuario.query.get(id_manager)

    if not manager:
        return jsonify({"error": "Usuario no encontrado"}), 404

    oferta = Oferta_laboral.query.get(id_oferta)
    if not oferta:
        return jsonify({"error": "Oferta no encontrada"}), 404

    if oferta.id_empresa != manager.id_empresa:
        return jsonify({"error": "No tenés permisos para editar esta oferta"}), 403

    data = request.get_json()
    nuevas_palabras = data.get("palabras_clave")

    if nuevas_palabras is None:
        return jsonify({"error": "Debés enviar 'palabras_clave' en el body"}), 400

    if isinstance(nuevas_palabras, list):
        oferta.palabras_clave = json.dumps(nuevas_palabras)
    elif nuevas_palabras == "":
        oferta.palabras_clave = json.dumps([])
    else:
        return jsonify({"error": "El campo 'palabras_clave' debe ser una lista o una cadena vacía"}), 400

    db.session.commit()
    return jsonify({"message": "Palabras clave actualizadas exitosamente"}), 200

@swag_from('../docs/manager/registrar-reclutador.yml')
@manager_bp.route("/registrar-reclutador", methods=["POST"])
@role_required(["manager"])
def register_reclutador():
    data = request.get_json()
    nombre = data.get("name")
    apellido = data.get("lastname")
    username = data.get("username")
    email = data.get("email")

    if not nombre or not apellido or not username or not email:
        return jsonify({"error": "Todos los campos son requeridos"}), 400
    
    if not validar_nombre(nombre) or not validar_nombre(apellido):
        return jsonify({"error": "El nombre o apellido no puede contener caracteres especiales"}), 400

    # Obtener el ID del manager autenticado
    id_manager = get_jwt_identity()

    # Verificar si el manager tiene una empresa asociada
    manager = Usuario.query.get(id_manager)
    if not manager or not manager.id_empresa:
        return jsonify({"error": "El manager no tiene una empresa asociada"}), 403
    
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, email):
        return jsonify({"error": "Formato de email no valido"}), 400

    id_empresa = manager.id_empresa  # Obtener la empresa del manager

    temp_password = secrets.token_urlsafe(8)

    if Usuario.query.filter_by(correo=email).first():
        return jsonify({"error": "El email ya está registrado"}), 400
    
    if Usuario.query.filter_by(username=username).first():
        return jsonify({"error": "El username ya está registrado"}), 400

    reclutador_role = db.session.query(Rol).filter_by(slug="reclutador").first()
    if not reclutador_role:
        # return jsonify({"error": "Default role 'candidato' not found"}), 500
        reclutador_role = Rol(
            nombre="Reclutador", permisos="permisos_reclutador", slug="reclutador"
        )
        db.session.add(reclutador_role)
        db.session.commit()

    nuevo_reclutador = Usuario(
        nombre=nombre,
        apellido=apellido,
        username=username,
        correo=email,
        contrasena=temp_password,
        id_empresa=id_empresa,
        id_superior=id_manager,
    )
    nuevo_reclutador.roles.append(reclutador_role)

    db.session.add(nuevo_reclutador)
    db.session.commit()

    # Devolver las credenciales generadas
    return jsonify(
        {
            "message": f"Reclutador '{username}' registrado exitosamente",
            "credentials": {"username": username, "password": temp_password},
            "reclutador": {
                "id": nuevo_reclutador.id,
                "nombre": nuevo_reclutador.nombre,
                "apellido": nuevo_reclutador.apellido,
                "username": nuevo_reclutador.username,
                "email": nuevo_reclutador.correo,
                "empresa": {
                    "id": nuevo_reclutador.id_empresa,
                    "nombre": Empresa.query.get(id_empresa).nombre,
                },
                "id_superior": nuevo_reclutador.id_superior,
            },
        }
    ), 201

EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Medio tiempo", "Contratado"]

WORKPLACE_TYPES = ["Remoto", "Presencial", "Híbrido"]

EXPERIENCE_LEVELS = ["Junior", "Semi Senior", "Senior", "Sin experiencia"]

def convertir_fecha(fecha_str):
    for formato in ("%Y-%m-%d", "%d/%m/%Y", "%m-%d-%Y"):
        try:
            return datetime.strptime(fecha_str, formato).date()
        except ValueError:
            continue
    return None

@swag_from('../docs/manager/crear-oferta-laboral.yml')
@manager_bp.route("/crear_oferta_laboral", methods=["POST"])
@role_required(["manager"])
def crear_oferta_laboral():
    try:
        data = request.get_json()

        nombre = data.get("nombre")
        descripcion = data.get("descripcion")
        location = data.get("location")
        employment_type = data.get("employment_type")
        etiquetas = data.get("etiquetas", "")
        workplace_type = data.get("workplace_type")
        salary_min = data.get("salary_min")
        salary_max = data.get("salary_max")
        currency = data.get("currency")
        experience_level = data.get("experience_level")
        fecha_cierre = data.get("fecha_cierre")
        umbral_individual = data.get("umbral_individual")

        if employment_type not in EMPLOYMENT_TYPES:
            return jsonify({"error": f"Tipo de empleo no válido. Las opciones permitidas son: {', '.join(EMPLOYMENT_TYPES)}"}), 400

        if workplace_type not in WORKPLACE_TYPES:
            return jsonify({"error": f"Modalidad de trabajo no válida. Las opciones permitidas son: {', '.join(WORKPLACE_TYPES)}"}), 400

        if experience_level not in EXPERIENCE_LEVELS:
            return jsonify({"error": f"Nivel de experiencia no válido. Las opciones permitidas son: {', '.join(EXPERIENCE_LEVELS)}"}), 400

        if not all(
            [
                nombre,
                location,
                employment_type,
                workplace_type,
                salary_min,
                salary_max,
                currency,
                experience_level,
            ]
        ):
            return jsonify(
                {"error": "Faltan datos obligatorios para crear la oferta laboral."}
            ), 400

        lista_palabras_clave = list(
            set(
                [p.strip().lower() for p in etiquetas.split(",") if len(p.strip()) >= 3]
            )
        )
        palabras_clave_json = json.dumps(lista_palabras_clave)

        id_manager = get_jwt_identity()
        manager = Usuario.query.filter_by(id=id_manager).first()
        if not manager:
            return jsonify({"error": "Manager no encontrado."}), 404

        id_empresa = manager.id_empresa
        empresa = Empresa.query.filter_by(id=id_empresa).first()
        if not empresa:
            return jsonify({"error": "Empresa no encontrada."}), 404
        
        salary_max = int(float(salary_max))
        salary_min = int(float(salary_min))
        try:
            if umbral_individual is not None and str(umbral_individual).strip() != "":
                umbral_individual = float(umbral_individual) / 100
            else:
                umbral_individual = 0.55
        except ValueError:
            return jsonify({"error": "Umbral individual debe ser un número válido entre 0 y 100."}), 400
                
        if salary_min == 0 and salary_max == 0:
            return jsonify({"error": "El salario mínimo y máximo no pueden ser 0."}), 400

        if salary_min >= salary_max:
            return jsonify({"error": "El salario mínimo no puede ser mayor que el salario máximo."}), 400
        
        if salary_min < 0 or salary_max < 0:
            return jsonify({"error": "El salario mínimo y máximo deben ser mayores o iguales a 0."}), 400
        
        if not validar_fecha(fecha_cierre):
            return jsonify({"error": "Formato de fecha de cierre no válido. Debe ser YYYY-MM-DD, DD/MM/YYYY o MM-DD-YYYY."}), 400
        
        fecha_cierre_obj = convertir_fecha(fecha_cierre)
        if not fecha_cierre_obj:
            return jsonify({"error": "Formato de fecha de cierre no válido."}), 400
        if fecha_cierre_obj < datetime.now().date():
            return jsonify({"error": "La fecha de cierre no puede ser anterior a la fecha actual."}), 400

        nueva_oferta = Oferta_laboral(
            id_empresa=empresa.id,
            id_creador=manager.id,
            nombre=nombre,
            descripcion=descripcion if descripcion else None,
            location=location,
            employment_type=employment_type,
            workplace_type=workplace_type,
            salary_min=salary_min,
            salary_max=salary_max,
            currency=currency,
            experience_level=experience_level,
            is_active=True,
            palabras_clave=palabras_clave_json,
            fecha_publicacion=db.func.now(),
            fecha_cierre=fecha_cierre_obj if fecha_cierre_obj else None,
            umbral_individual=umbral_individual,
        )

        db.session.add(nueva_oferta)
        db.session.commit()

        return jsonify(
            {
                "message": "Oferta laboral creada exitosamente.",
                "id_oferta": nueva_oferta.id,
                "nombre": nueva_oferta.nombre,
                "empresa": empresa.nombre,
            }
        ), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@swag_from('../docs/manager/ver-empleados.yml')
@manager_bp.route("/empleados-manager", methods=["GET"])
@role_required(["manager"])
def ver_empleados():
    id_manager = get_jwt_identity()

    empleados = Usuario.query.filter_by(id_superior=id_manager).all()

    resultado = [
        {
            "id": e.id,
            "nombre": e.nombre,
            "apellido": e.apellido,
            "correo": e.correo,
            "username": e.username,
            "roles": [rol.slug for rol in e.roles],
        }
        for e in empleados
    ]

    return jsonify(resultado), 200


@manager_bp.route("/info-manager", methods=["GET"])
@jwt_required()
@swag_from('../docs/manager/info-manager.yml')
def obtener_nombre_apellido_manager():
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager:
        return jsonify({"error": "Manager no encontrado"}), 404

    return {
        "nombre": manager.nombre,
        "apellido": manager.apellido,
        "username": manager.username,
        "correo": manager.correo,
    }

@swag_from('../docs/manager/desvincular-reclutador.yml')
@manager_bp.route("/desvincular-reclutador/<int:id_empleado>", methods=["PUT"])
@role_required(["manager"])
def desvincular_empleado(id_empleado):
    id_manager = int(get_jwt_identity())

    empleado = Usuario.query.get(id_empleado)

    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    if empleado.id_superior != id_manager:
        return jsonify(
            {"error": "No tenés permisos para desvincular a este usuario"}
        ), 403

    if not empleado.activo:
        return jsonify({"error": "El empleado ya está desvinculado"}), 400

    empleado.activo = False
    db.session.commit()

    empleado.roles.clear()
    db.session.commit()

    rol_candidato = Rol.query.filter_by(slug="candidato").first()
    if not rol_candidato:
        rol_candidato = Rol(nombre="Candidato", slug="candidato", permisos="")
        db.session.add(rol_candidato)
        db.session.commit()

    empleado.roles.append(rol_candidato)
    db.session.commit()

    return jsonify({"message": "Empleado desvinculado correctamente"}), 200

@swag_from('../docs/manager/asignar-analista-oferta.yml')
@manager_bp.route("/asignar-analista-oferta", methods=["POST"])
@role_required(["manager"])
def asignar_analista_a_oferta():
    data = request.get_json()
    id_oferta = data.get("id_oferta")
    id_analista = data.get("id_analista")

    oferta = Oferta_laboral.query.get(id_oferta)
    analista = Usuario.query.get(id_analista)
    id_empresa = analista.id_empresa

    if not oferta or not analista:
        return jsonify({"error": "Oferta o analista no encontrado."}), 404
    if id_empresa != oferta.id_empresa:
        return jsonify(
            {"error": "El analista no pertenece a la misma empresa que la oferta."}
        ), 403
    
    # Nueva validación: el analista no puede tener más de una oferta asignada
    #oferta_existente = Oferta_analista.query.filter_by(id_analista=analista.id).first()
    #if oferta_existente:
    #    return jsonify(
    #        {"error": "El analista ya tiene una oferta asignada. No se puede asignar otra."}
    #    ), 400
    
    # Validar que la oferta NO tenga otro analista asignado
    # analista_existente_oferta = Oferta_analista.query.filter_by(id_oferta=oferta.id).first()
    # if analista_existente_oferta:
    #     return jsonify(
    #         {"error": "La oferta ya tiene un analista asignado. No se puede asignar otro."}
    #     ), 400

    oferta_analista = Oferta_analista(
    id_oferta=oferta.id,
    id_analista=analista.id,
    estado='asignada'  # ✅ Estado explícito
    )
    db.session.add(oferta_analista)
    db.session.commit()

    return jsonify(
        {
            "message": "Analista asignado a la oferta laboral exitosamente.",
            "oferta": oferta.nombre,
            "analista": analista.username,
        }
    ), 201

@swag_from('../docs/manager/mis-ofertas-laborales.yml')
@manager_bp.route("/mis-ofertas-laborales", methods=["GET"])
@role_required(["manager"])
def obtener_ofertas():
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    empresa = Empresa.query.get(manager.id_empresa)

    ofertas = Oferta_laboral.query.filter_by(
        id_empresa=empresa.id
    ).all()

    resultado = [
        {
            "id_oferta": oferta.id,
            "id_creador": oferta.id_creador,
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
        for oferta in ofertas
    ]

    return jsonify(
        {"ofertas": resultado, "empresa": {"id": empresa.id, "nombre": empresa.nombre}}
    ), 200


def validar_nombre(nombre: str) -> bool:
    # Solo letras (mayúsculas/minúsculas), espacios y letras acentuadas comunes
    return re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$", nombre) is not None


@manager_bp.route("/rendimiento-futuro/<int:id_empleado>", methods=["GET"])
@role_required(["manager"])
def obtener_rendimiento_futuro(id_empleado):
    try:
        # Obtener datos del empleado
        empleado = Usuario.query.get(id_empleado)
        if not empleado:
            return jsonify({"error": "Empleado no encontrado"}), 404

        # Datos para la predicción
        datos_empleado = {
            "desempeno_previo": empleado.desempeno_previo,
            "cantidad_proyectos": empleado.cantidad_proyectos,
            "tamano_equipo": empleado.tamano_equipo,
            "horas_extras": empleado.horas_extras,
            "antiguedad": empleado.antiguedad,
            "horas_capacitacion": empleado.horas_capacitacion
        }

        # Obtener la predicción
        rendimiento_futuro = predecir_rend_futuro_individual(datos_empleado)

        # Devolver la respuesta
        return jsonify({
            "id_empleado": empleado.id,
            "nombre": empleado.nombre,
            "rendimiento_futuro_predicho": rendimiento_futuro,
            "detalles": datos_empleado
        }), 200

    except Exception as e:
        print(f"Error en /rendimiento-futuro: {e}")
        return jsonify({"error": str(e)}), 500
    
    

@manager_bp.route("/subir-info-laboral-analistas", methods=["POST"])
@role_required(["manager"])
def subir_info_laboral_empleados():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)

        file_path = os.path.join(UPLOAD_FOLDER, filename)

        file.save(file_path)
        
        try:
            resultado = registrar_info_laboral_empleados(file_path)
            if "error" in resultado:
                return jsonify(resultado), 400
            return jsonify({
                "message": "Información laboral registrada exitosamente",
                "total_empleados": len(resultado),
                "empleados": resultado
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file format'}), 400
            
            
def registrar_info_laboral_empleados(file_path):
    import csv
    from flask_jwt_extended import get_jwt_identity

    required_fields = {
        'id_empleado', 'horas_extras', 'horas_capacitacion',
        'ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas'
    }

    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        if not required_fields.issubset(reader.fieldnames):
            return {"error": f"El archivo CSV debe tener las columnas: {', '.join(required_fields)}"}

        id_manager = get_jwt_identity()
        manager = Usuario.query.get(id_manager)
        if not manager or not manager.id_empresa:
            return {"error": "El manager no tiene una empresa asociada"}

        empleados_empresa = Usuario.query.filter_by(id_empresa=manager.id_empresa).all()
        ids_validos = {e.id for e in empleados_empresa}

        resultado = []
        for row in reader:
            try:
                id_empleado = int(row['id_empleado'].strip())
            except Exception:
                return {"error": f"ID de empleado inválido: {row.get('id_empleado')}"}

            if id_empleado not in ids_validos:
                return {"error": f"El empleado con ID {id_empleado} no pertenece a tu empresa"}

            try:
                horas_extras = int(row['horas_extras'].strip())
                horas_capacitacion = int(row['horas_capacitacion'].strip())
                ausencias_injustificadas = int(row['ausencias_injustificadas'].strip())
                llegadas_tarde = int(row['llegadas_tarde'].strip())
                salidas_tempranas = int(row['salidas_tempranas'].strip())
            except Exception:
                return {"error": f"Datos numéricos inválidos para el empleado {id_empleado}"}

            rendimiento = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
            ultimo_rend = (
                HistorialRendimientoEmpleado.query
                .filter_by(id_empleado=id_empleado)
                .order_by(HistorialRendimientoEmpleado.fecha_calculo.desc())
                .first()
            )
            ultimo_rendimiento = ultimo_rend.rendimiento if ultimo_rend else 0
            antiguedad = Usuario.query.get(id_empleado).fecha_ingreso

            datos_cambiaron = False

            if rendimiento:
                datos_cambiaron = (
                    rendimiento.horas_extras != horas_extras or
                    rendimiento.horas_capacitacion != horas_capacitacion or
                    rendimiento.ausencias_injustificadas != ausencias_injustificadas or
                    rendimiento.llegadas_tarde != llegadas_tarde or
                    rendimiento.salidas_tempranas != salidas_tempranas
                )

                if datos_cambiaron:
                    rendimiento.desempeno_previo = ultimo_rendimiento
                    rendimiento.horas_extras = horas_extras
                    rendimiento.horas_capacitacion = horas_capacitacion
                    rendimiento.ausencias_injustificadas = ausencias_injustificadas
                    rendimiento.llegadas_tarde = llegadas_tarde
                    rendimiento.salidas_tempranas = salidas_tempranas
                    accion = "actualizado"
                else:
                    accion = "sin cambios"
            else:
                rendimiento = RendimientoEmpleado(
                    id_usuario=id_empleado,
                    desempeno_previo=ultimo_rendimiento,
                    horas_extras=horas_extras,
                    horas_capacitacion=horas_capacitacion,
                    antiguedad=calcular_antiguedad(antiguedad),
                    ausencias_injustificadas=ausencias_injustificadas,
                    llegadas_tarde=llegadas_tarde,
                    salidas_tempranas=salidas_tempranas
                )
                db.session.add(rendimiento)
                datos_cambiaron = True
                accion = "creado"

            if datos_cambiaron:
                empleados_bajo_rendimiento = 0
                empleados_alta_renuncia = 0
                empleados_alta_rotacion = 0
                try:
                    datos_rend_futuro = {
                        "desempeno_previo": ultimo_rendimiento,
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "horas_extras": horas_extras,
                        "antiguedad": calcular_antiguedad(antiguedad),
                        "horas_capacitacion": horas_capacitacion
                    }
                    fecha_actual = datetime.utcnow()
                    rendimiento.rendimiento_futuro_predicho = predecir_rend_futuro_individual(datos_rend_futuro)
                    existe_historial = HistorialRendimientoEmpleado.query.filter_by(
                        id_empleado=id_empleado,
                        fecha_calculo=fecha_actual
                    ).first()

                    if rendimiento.rendimiento_futuro_predicho is not None and rendimiento.rendimiento_futuro_predicho < 5:
                        empleados_bajo_rendimiento += 1

                    if not existe_historial:
                        nuevo_historial = HistorialRendimientoEmpleado(
                            id_empleado=id_empleado,
                            fecha_calculo=fecha_actual,
                            rendimiento=rendimiento.rendimiento_futuro_predicho
                        )
                        db.session.add(nuevo_historial)
                                        
                    datos_rotacion = {
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "desempeno_previo": ultimo_rendimiento
                    }
                    rendimiento.riesgo_rotacion_predicho = predecir_riesgo_rotacion_individual(datos_rotacion)

                    if rendimiento.riesgo_rotacion_predicho is not None and rendimiento.riesgo_rotacion_predicho == "alto":
                        empleados_alta_rotacion += 1

                    datos_despido = {
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "desempeno_previo": ultimo_rendimiento,
                        "Riesgo de rotacion predicho": rendimiento.riesgo_rotacion_predicho,
                        "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho
                    }
                    rendimiento.riesgo_despido_predicho = predecir_riesgo_despido_individual(datos_despido)

                    datos_renuncia = {
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "desempeno_previo": ultimo_rendimiento,
                        "Riesgo de rotacion predicho": rendimiento.riesgo_rotacion_predicho,
                        "Riesgo de despido predicho": rendimiento.riesgo_despido_predicho,
                        "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho
                    }
                    rendimiento.riesgo_renuncia_predicho = predecir_riesgo_renuncia_individual(datos_renuncia)

                    if rendimiento.riesgo_renuncia_predicho is not None and rendimiento.riesgo_renuncia_predicho == "alto":
                        empleados_alta_renuncia += 1

                    nombre_empleado = Usuario.query.get(id_empleado).nombre
                    nombre_empresa = Empresa.query.get(manager.id_empresa).nombre
                    nombre_manager = manager.nombre
                    mail_empleado = Usuario.query.get(id_empleado).correo

                    if rendimiento.riesgo_rotacion_predicho == 'alto':
                        mensaje = f"""Estimado/a {nombre_empleado}, hemos identificado ciertos indicadores relacionados a tu desempeño. Nos gustaría conversar contigo para explorar oportunidades de mejora y alineación en tu desarrollo profesional. Quedamos a disposición para coordinar una reunión.

                                        Atentamente,
                                        {nombre_manager},
                                        {nombre_empresa}"""
                        crear_notificacion_uso_especifico(id_empleado, mensaje)
                        enviar_notificacion_analista_riesgos(mail_empleado, mensaje)

                    if rendimiento.rendimiento_futuro_predicho >= 7.5:
                        mensaje = f"""Estimado/a {nombre_empleado},

                                    ¡Felicidades! Tu desempeño proyectado indica un alto rendimiento. 
                                    Seguimos apostando a tu crecimiento y éxito en la empresa.
                                    ¡Continúa así!

                                    Atentamente,
                                    {nombre_manager},
                                    {nombre_empresa}"""
                        crear_notificacion_uso_especifico(id_empleado, mensaje)
                        enviar_notificacion_analista_riesgos(mail_empleado, mensaje)

                    db.session.flush()

                except Exception as e:
                    print(f"Error al predecir para empleado {id_empleado}: {e}")

            resultado.append({
                "id_empleado": id_empleado,
                "accion": accion,
                "desempeno_previo": ultimo_rendimiento,
                "horas_extras": horas_extras,
                "antiguedad": calcular_antiguedad(antiguedad),
                "horas_capacitacion": horas_capacitacion,
                "ausencias_injustificadas": ausencias_injustificadas,
                "llegadas_tarde": llegadas_tarde,
                "salidas_tempranas": salidas_tempranas,
                "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho if datos_cambiaron else None,
                "riesgo_rotacion_predicho": rendimiento.riesgo_rotacion_predicho if datos_cambiaron else None,
                "riesgo_despido_predicho": rendimiento.riesgo_despido_predicho if datos_cambiaron else None,
                "riesgo_renuncia_predicho": rendimiento.riesgo_renuncia_predicho if datos_cambiaron else None
            })

        if empleados_bajo_rendimiento > 0:
            mensaje_manager = (
                f"Se detectaron {empleados_bajo_rendimiento} empleados con bajo rendimiento "
                f"en el último análisis. Se recomienda revisar sus casos individualmente."
            )
        crear_notificacion_uso_especifico(manager.id, mensaje_manager)

        if empleados_alta_renuncia > 0:
            mensaje_manager = (
                f"Se detectaron {empleados_alta_renuncia} empleados con alta probabilidad de renuncia "
                f"en el último análisis. Se recomienda revisar sus casos individualmente."
            )
        crear_notificacion_uso_especifico(manager.id, mensaje_manager)

        if empleados_alta_rotacion > 0:
            mensaje_manager = (
                f"Se detectaron {empleados_alta_renuncia} empleados con alta probabilidad de rotación "
                f"en el último análisis. Se recomienda revisar sus casos individualmente."
            )
        crear_notificacion_uso_especifico(manager.id, mensaje_manager)

        db.session.commit()
        return resultado
    

def registrar_info_laboral_empleados_tabla(file_path, id_periodo):
    import csv
    from flask_jwt_extended import get_jwt_identity

    required_fields = {
        'id_empleado', 'horas_extras', 'horas_capacitacion',
        'ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas'
    }

    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        if not required_fields.issubset(reader.fieldnames):
            return {"error": f"El archivo CSV debe tener las columnas: {', '.join(required_fields)}"}

        id_manager = get_jwt_identity()
        manager = Usuario.query.get(id_manager)
        if not manager or not manager.id_empresa:
            return {"error": "El manager no tiene una empresa asociada"}

        empleados_empresa = Usuario.query.filter_by(id_empresa=manager.id_empresa).all()
        ids_validos = {e.id for e in empleados_empresa}

        resultado = []
        for row in reader:
            try:
                id_empleado = int(row['id_empleado'].strip())
            except Exception:
                return {"error": f"ID de empleado inválido: {row.get('id_empleado')}"}

            if id_empleado not in ids_validos:
                return {"error": f"El empleado con ID {id_empleado} no pertenece a tu empresa"}

            try:
                horas_extras = int(row['horas_extras'].strip())
                horas_capacitacion = int(row['horas_capacitacion'].strip())
                ausencias_injustificadas = int(row['ausencias_injustificadas'].strip())
                llegadas_tarde = int(row['llegadas_tarde'].strip())
                salidas_tempranas = int(row['salidas_tempranas'].strip())
            except Exception:
                return {"error": f"Datos numéricos inválidos para el empleado {id_empleado}"}

            rendimiento = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado, id_periodo=id_periodo).first()
            ultimo_rend = (
                HistorialRendimientoEmpleado.query
                .filter_by(id_empleado=id_empleado, id_periodo=id_periodo)
                .order_by(HistorialRendimientoEmpleado.fecha_calculo.desc())
                .first()
            )
            ultimo_rendimiento = ultimo_rend.rendimiento if ultimo_rend else 0
            antiguedad = Usuario.query.get(id_empleado).fecha_ingreso

            datos_cambiaron = False

            if rendimiento:
                datos_cambiaron = any([
                    int(rendimiento.horas_extras or 0) != horas_extras,
                    int(rendimiento.horas_capacitacion or 0) != horas_capacitacion,
                    int(rendimiento.ausencias_injustificadas or 0) != ausencias_injustificadas,
                    int(rendimiento.llegadas_tarde or 0) != llegadas_tarde,
                    int(rendimiento.salidas_tempranas or 0) != salidas_tempranas
                ])

                if datos_cambiaron:
                    rendimiento.desempeno_previo = ultimo_rendimiento
                    rendimiento.horas_extras = horas_extras
                    rendimiento.horas_capacitacion = horas_capacitacion
                    rendimiento.ausencias_injustificadas = ausencias_injustificadas
                    rendimiento.llegadas_tarde = llegadas_tarde
                    rendimiento.salidas_tempranas = salidas_tempranas
                    accion = "actualizado"
                else:
                    accion = "sin cambios"
            else:
                rendimiento = RendimientoEmpleado(
                    id_usuario=id_empleado,
                    id_periodo=id_periodo,
                    desempeno_previo=ultimo_rendimiento,
                    horas_extras=horas_extras,
                    antiguedad=calcular_antiguedad(antiguedad),
                    horas_capacitacion=horas_capacitacion,
                    ausencias_injustificadas=ausencias_injustificadas,
                    llegadas_tarde=llegadas_tarde,
                    salidas_tempranas=salidas_tempranas
                )
                db.session.add(rendimiento)
                datos_cambiaron = True
                accion = "creado"

            if datos_cambiaron:
                empleados_bajo_rendimiento = 0
                empleados_alta_renuncia = 0
                empleados_alta_rotacion = 0
                try:
                    datos_rend_futuro = {
                        "desempeno_previo": ultimo_rendimiento,
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "horas_extras": horas_extras,
                        "antiguedad": calcular_antiguedad(antiguedad),
                        "horas_capacitacion": horas_capacitacion
                    }
                    fecha_actual = datetime.utcnow()
                    rendimiento.rendimiento_futuro_predicho = predecir_rend_futuro_individual(datos_rend_futuro)
                    existe_historial = HistorialRendimientoEmpleado.query.filter_by(
                        id_empleado=id_empleado,
                        id_periodo=id_periodo,
                        fecha_calculo=fecha_actual
                    ).first()

                    if rendimiento.rendimiento_futuro_predicho is not None and rendimiento.rendimiento_futuro_predicho < 5:
                        empleados_bajo_rendimiento += 1

                    if not existe_historial:
                        nuevo_historial = HistorialRendimientoEmpleado(
                            id_empleado=id_empleado,
                            id_periodo=id_periodo,
                            fecha_calculo=fecha_actual,
                            rendimiento=rendimiento.rendimiento_futuro_predicho
                        )
                        db.session.add(nuevo_historial)
                                        
                    datos_rotacion = {
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "desempeno_previo": ultimo_rendimiento
                    }
                    rendimiento.riesgo_rotacion_predicho = predecir_riesgo_rotacion_individual(datos_rotacion)

                    if rendimiento.riesgo_rotacion_predicho is not None and rendimiento.riesgo_rotacion_predicho == "alto":
                        empleados_alta_rotacion += 1

                    datos_despido = {
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "desempeno_previo": ultimo_rendimiento,
                        "Riesgo de rotacion predicho": rendimiento.riesgo_rotacion_predicho,
                        "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho
                    }
                    rendimiento.riesgo_despido_predicho = predecir_riesgo_despido_individual(datos_despido)

                    datos_renuncia = {
                        "ausencias_injustificadas": ausencias_injustificadas,
                        "llegadas_tarde": llegadas_tarde,
                        "salidas_tempranas": salidas_tempranas,
                        "desempeno_previo": ultimo_rendimiento,
                        "Riesgo de rotacion predicho": rendimiento.riesgo_rotacion_predicho,
                        "Riesgo de despido predicho": rendimiento.riesgo_despido_predicho,
                        "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho
                    }
                    rendimiento.riesgo_renuncia_predicho = predecir_riesgo_renuncia_individual(datos_renuncia)

                    if rendimiento.riesgo_renuncia_predicho is not None and rendimiento.riesgo_renuncia_predicho == "alto":
                        empleados_alta_renuncia += 1

                    nombre_empleado = Usuario.query.get(id_empleado).nombre
                    nombre_empresa = Empresa.query.get(manager.id_empresa).nombre
                    nombre_manager = manager.nombre
                    mail_empleado = Usuario.query.get(id_empleado).correo

                    if rendimiento.riesgo_rotacion_predicho == 'alto':
                        mensaje = f"""Estimado/a {nombre_empleado}, hemos identificado ciertos indicadores relacionados a tu desempeño. Nos gustaría conversar contigo para explorar oportunidades de mejora y alineación en tu desarrollo profesional. Quedamos a disposición para coordinar una reunión.

                                        Atentamente,
                                        {nombre_manager},
                                        {nombre_empresa}"""
                        crear_notificacion_uso_especifico(id_empleado, mensaje)
                        enviar_notificacion_analista_riesgos(mail_empleado, mensaje)

                    if rendimiento.rendimiento_futuro_predicho >= 7.5:
                        mensaje = f"""Estimado/a {nombre_empleado},

                                    ¡Felicidades! Tu desempeño proyectado indica un alto rendimiento. 
                                    Seguimos apostando a tu crecimiento y éxito en la empresa.
                                    ¡Continúa así!

                                    Atentamente,
                                    {nombre_manager},
                                    {nombre_empresa}"""
                        crear_notificacion_uso_especifico(id_empleado, mensaje)
                        enviar_notificacion_analista_riesgos(mail_empleado, mensaje)

                    db.session.flush()

                except Exception as e:
                    print(f"Error al predecir para empleado {id_empleado}: {e}")

            resultado.append({
                "id_empleado": id_empleado,
                "accion": accion,
                "desempeno_previo": ultimo_rendimiento,
                "horas_extras": horas_extras,
                "antiguedad": calcular_antiguedad(antiguedad),
                "horas_capacitacion": horas_capacitacion,
                "ausencias_injustificadas": ausencias_injustificadas,
                "llegadas_tarde": llegadas_tarde,
                "salidas_tempranas": salidas_tempranas,
                "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho if datos_cambiaron else None,
                "riesgo_rotacion_predicho": rendimiento.riesgo_rotacion_predicho if datos_cambiaron else None,
                "riesgo_despido_predicho": rendimiento.riesgo_despido_predicho if datos_cambiaron else None,
                "riesgo_renuncia_predicho": rendimiento.riesgo_renuncia_predicho if datos_cambiaron else None
            })

        if empleados_bajo_rendimiento > 0:
            mensaje_manager = (
                f"Se detectaron {empleados_bajo_rendimiento} empleados con bajo rendimiento "
                f"en el último análisis. Se recomienda revisar sus casos individualmente."
            )
            crear_notificacion_uso_especifico(manager.id, mensaje_manager)

        if empleados_alta_renuncia > 0:
            mensaje_manager = (
                f"Se detectaron {empleados_alta_renuncia} empleados con alta probabilidad de renuncia "
                f"en el último análisis. Se recomienda revisar sus casos individualmente."
            )
            crear_notificacion_uso_especifico(manager.id, mensaje_manager)

        if empleados_alta_rotacion > 0:
            mensaje_manager = (
                f"Se detectaron {empleados_alta_renuncia} empleados con alta probabilidad de rotación "
                f"en el último análisis. Se recomienda revisar sus casos individualmente."
            )
            crear_notificacion_uso_especifico(manager.id, mensaje_manager)

        db.session.commit()
        return resultado
    

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


@manager_bp.route("/cargar-rendimientos-empleados", methods=["POST"])
@role_required(["manager"])
def cargar_rendimientos_empleados_y_generar_csv():
    datos = request.get_json()
    empleados = datos.get("empleados", [])
    id_periodo = datos.get("id_periodo")

    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)

    if not manager or not manager.id_empresa:
        return jsonify({"error": "no tienes una empresa asociada"}), 404

    if not id_periodo:
        return jsonify({"error": "debes enviar el id del periodo"}), 400

    periodo = Periodo.query.filter_by(id_periodo=id_periodo, id_empresa=manager.id_empresa).first()
    if not periodo:
        return jsonify({"error": "no se encontró el periodo o no pertenece a tu empresa"}), 404
    
    if periodo.estado != "activo":
        return jsonify({"error": "El periodo no esta activo"}), 400

    errores = []
    registros = []

    # límites
    max_aus = periodo.dias_laborales_en_periodo
    max_ext = (periodo.horas_laborales_por_dia * periodo.dias_laborales_en_periodo) + ((periodo.cantidad_findes * 2) * periodo.horas_laborales_por_dia)
    max_cap = max_ext // 2
    max_lt  = periodo.dias_laborales_en_periodo
    max_st  = periodo.dias_laborales_en_periodo

    for row in empleados:
        ie = row.get("id_empleado")
        ai = row.get("ausencias_injustificadas", 0) or 0
        hc = row.get("horas_capacitacion", 0) or 0
        he = row.get("horas_extras", 0) or 0
        lt = row.get("llegadas_tarde", 0) or 0
        st = row.get("salidas_tempranas", 0) or 0

        if ai > max_aus:
            errores.append({
                "id_empleado": ie,
                "campo": "ausencias_injustificadas",
                "valor": ai,
                "maximo": max_aus
            })
        if hc > max_cap:
            errores.append({
                "id_empleado": ie,
                "campo": "horas_capacitacion",
                "valor": hc,
                "maximo": max_cap
            })
        if he > max_ext:
            errores.append({
                "id_empleado": ie,
                "campo": "horas_extras",
                "valor": he,
                "maximo": max_ext
            })
        if lt > max_lt:
            errores.append({
                "id_empleado": ie,
                "campo": "llegadas_tarde",
                "valor": lt,
                "maximo": max_lt
            })
        if st > max_st:
            errores.append({
                "id_empleado": ie,
                "campo": "salidas_tempranas",
                "valor": st,
                "maximo": max_st
            })

        registros.append({
            "id_empleado": ie,
            "horas_extras": he,
            "horas_capacitacion": hc,
            "ausencias_injustificadas": ai,
            "llegadas_tarde": lt,
            "salidas_tempranas": st
        })

    if errores:
        return jsonify({"errores": errores}), 400

    df = pd.DataFrame(registros)
    csv_dir = os.path.join(os.getcwd(), "uploads", "info_laboral")
    os.makedirs(csv_dir, exist_ok=True)
    path_csv = os.path.join(csv_dir, "rendimientos_empleados.csv")
    df.to_csv(path_csv, index=False)
    registrar_info_laboral_empleados_tabla(path_csv, id_periodo)

    return jsonify({"csv": path_csv, "status": "generado"}), 200


@manager_bp.route("/estado-periodo-seleccionado/<int:id_periodo>")
@role_required(["manager"])
def estado_periodo(id_periodo):
    try:
        user_id = get_jwt_identity()
        usuario = Usuario.query.get(user_id)

        if not usuario or not usuario.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        periodo = Periodo.query.filter_by(id_periodo=id_periodo, id_empresa=usuario.id_empresa).first()

        if not periodo:
            return jsonify({"error": "Periodo no encontrado"}), 404

        return jsonify({
            "id_periodo": periodo.id_periodo,
            "nombre_periodo": periodo.nombre_periodo,
            "estado": periodo.estado
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@manager_bp.route("/cerrar-periodo/<int:id_periodo>", methods=["PUT"])
@role_required(["manager"])
def cerrar_periodo(id_periodo):
    try:
        user_id = get_jwt_identity()
        usuario = Usuario.query.get(user_id)

        if not usuario or not usuario.id_empresa:
            return jsonify({"error": "El usuario no tiene una empresa asociada"}), 404

        periodo = Periodo.query.filter_by(id_periodo=id_periodo, id_empresa=usuario.id_empresa).first()

        if not periodo:
            return jsonify({"error": "Periodo no encontrado"}), 404

        if periodo.estado == "cerrado":
            return jsonify({"mensaje": "El periodo ya está cerrado"}), 200

        # 1. Buscar postulaciones aceptadas en el periodo
        fecha_inicio = periodo.fecha_inicio
        fecha_fin = periodo.fecha_fin

        postulaciones_aceptadas = (
            db.session.query(Job_Application, Oferta_laboral, Usuario)
            .join(Oferta_laboral, Job_Application.id_oferta == Oferta_laboral.id)
            .join(Usuario, Job_Application.id_candidato == Usuario.id)
            .filter(
                Oferta_laboral.id_empresa == usuario.id_empresa,
                Job_Application.estado_postulacion == "aprobada",
                Job_Application.fecha_postulacion >= fecha_inicio,
                Job_Application.fecha_postulacion <= fecha_fin
            )
            .all()
        )

        # 2. Agrupar por jefe de área (según puesto_trabajo del jefe y del postulado)
        # Mapear jefe de área a sus puestos
        area_puestos = {
            "Jefe de Tecnología y Desarrollo": [
                "Desarrollador Backend", "Desarrollador Frontend", "Full Stack Developer", "DevOps Engineer",
                "Data Engineer", "Ingeniero de Machine Learning", "Analista de Datos", "QA Automation Engineer",
                "Soporte Técnico", "Administrador de Base de Datos", "Administrador de Redes", "Especialista en Seguridad Informática",
            ],
            "Jefe de Administración y Finanzas": [
                "Analista Contable", "Contador Público", "Analista de Finanzas", "Administrativo/a", "Asistente Contable",
            ],
            "Jefe Comercial y de Ventas": [
                "Representante de Ventas", "Ejecutivo de Cuentas", "Vendedor Comercial", "Supervisor de Ventas", "Asesor Comercial",
            ],
            "Jefe de Marketing y Comunicación": [
                "Especialista en Marketing Digital", "Analista de Marketing", "Community Manager", "Diseñador Gráfico", "Responsable de Comunicación",
            ],
            "Jefe de Industria y Producción": [
                "Técnico de Mantenimiento", "Operario de Producción", "Supervisor de Planta", "Ingeniero de Procesos", "Encargado de Logística",
            ],
            "Jefe de Servicios Generales y Gastronomía": [
                "Mozo/a", "Cocinero/a", "Encargado de Salón", "Recepcionista", "Limpieza",
            ],
        }

        # Buscar todos los jefes de área de la empresa
        jefes_area = Usuario.query.filter(
            Usuario.id_empresa == usuario.id_empresa,
            Usuario.puesto_trabajo.in_(list(area_puestos.keys()))
        ).all()
        jefe_por_puesto = {jefe.puesto_trabajo: jefe for jefe in jefes_area}

        # Agrupar postulados aceptados por jefe de área
        encuestas_por_jefe = {}
        # for job_app, oferta, postulado in postulaciones_aceptadas:
        #     # Determinar jefe de área según el puesto al que va el postulado
        #     jefe_destino = None
        #     for jefe_area, puestos in area_puestos.items():
        #         if postulado.puesto_trabajo in puestos:
        #             jefe_destino = jefe_por_puesto.get(jefe_area)
        #             break
        #     if jefe_destino:
        #         if jefe_destino.id not in encuestas_por_jefe:
        #             encuestas_por_jefe[jefe_destino.id] = []
        #         encuestas_por_jefe[jefe_destino.id].append({
        #             "postulado": postulado,
        #             "oferta": oferta,
        #             "job_app": job_app
        #         })
        for job_app, oferta, postulado in postulaciones_aceptadas:
            # Determinar jefe de área según el puesto de la oferta laboral
            jefe_destino = None
            for jefe_area, puestos in area_puestos.items():
                if oferta.nombre in puestos:
                    jefe_destino = jefe_por_puesto.get(jefe_area)
                    break
            if jefe_destino:
                if jefe_destino.id not in encuestas_por_jefe:
                    encuestas_por_jefe[jefe_destino.id] = []
                encuestas_por_jefe[jefe_destino.id].append({
                    "postulado": postulado,
                    "oferta": oferta,
                    "job_app": job_app
                })

        # 3. Crear encuestas para cada jefe de área con postulados nuevos
        for id_jefe, postulados in encuestas_por_jefe.items():
            jefe = Usuario.query.get(id_jefe)
            encuesta = Encuesta(
                tipo="evaluacion_postulados",
                titulo=f"Opinión sobre postulados aceptados en tu área ({periodo.nombre_periodo})",
                descripcion="Por favor, evaluá a los nuevos postulados aceptados para tu área. Tu opinión será tenida en cuenta para futuras decisiones.",
                es_anonima=False,
                fecha_inicio=datetime.now(timezone.utc),
                fecha_fin=datetime.now(timezone.utc) + timedelta(days=7),
                creador_id=usuario.id,
                estado="activa"
            )
            db.session.add(encuesta)
            db.session.flush()  # Para obtener el id

            # Asignar la encuesta al jefe de área
            asignacion = EncuestaAsignacion(
                id_encuesta=encuesta.id,
                id_asignador=usuario.id,
                id_usuario=jefe.id,
                tipo_asignacion="individual"
            )
            db.session.add(asignacion)

            registro_telegram = UsuarioTelegram.query.filter_by(id_usuario=jefe.id).first()

            if registro_telegram:
                try:
                    mensaje_telegram = (
                        f"Hola {jefe.nombre}, se te ha asignado una nueva encuesta "
                        f"correspondiente al periodo '{periodo.nombre_periodo}'. Por favor, respondela antes del {encuesta.fecha_fin.strftime('%d/%m/%Y')}."
                    )
                    enviar_mensaje_telegram(registro_telegram.chat_id, mensaje_telegram)
                except Exception as e:
                    print(f"No se pudo enviar notificación a {jefe.nombre}: {e}")

            # 4. Crear preguntas de opción única para cada postulado
            for item in postulados:
                postulado = item["postulado"]
                oferta = item["oferta"]
                job_app = item["job_app"]
                # Identificar el reclutador responsable
                reclutador_rel = Oferta_analista.query.filter_by(id_oferta=oferta.id).first()
                id_reclutador = reclutador_rel.id_analista if reclutador_rel else None

                texto_pregunta = (
                    f"¿Considera adecuado al postulado '{postulado.nombre} {postulado.apellido}' "
                    f"para el puesto '{oferta.nombre}'? (Reclutador responsable: {Usuario.query.get(id_reclutador).nombre if id_reclutador else 'N/A'})"
                )
                opciones = json.dumps(["Sí, es adecuado", "No, no es adecuado", "No lo conozco lo suficiente"])
                pregunta = PreguntaEncuesta(
                    id_encuesta=encuesta.id,
                    texto=texto_pregunta,
                    tipo="unica_opcion",
                    opciones=opciones,
                    es_requerida=True
                )
                db.session.add(pregunta)

        periodo.estado = "cerrado"
        db.session.commit()

        return jsonify({"mensaje": f"Periodo '{periodo.nombre_periodo}' cerrado correctamente y encuestas generadas"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# @manager_bp.route("/cerrar-periodo/<int:id_periodo>", methods=["PUT"])
# @role_required(["manager"])
# def cerrar_periodo(id_periodo):
#     try:
#         user_id = get_jwt_identity()
#         usuario = Usuario.query.get(user_id)

#         if not usuario or not usuario.id_empresa:
#             return jsonify({"error": "El usuario no tiene una empresa asociada"}), 404

#         periodo = Periodo.query.filter_by(id_periodo=id_periodo, id_empresa=usuario.id_empresa).first()

#         if not periodo:
#             return jsonify({"error": "Periodo no encontrado"}), 404

#         if periodo.estado == "cerrado":
#             return jsonify({"mensaje": "El periodo ya está cerrado"}), 200

#         periodo.estado = "cerrado"
#         db.session.commit()

#         return jsonify({"mensaje": f"Periodo '{periodo.nombre_periodo}' cerrado correctamente"}), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e)}), 500

@manager_bp.route("/listar-periodos", methods=["GET"])
@role_required(["manager", "reclutador"])
def listar_periodos():
    try:
        user_id = get_jwt_identity()
        usuario = Usuario.query.get(user_id)

        if not usuario or not usuario.id_empresa:
            return jsonify({"error": "El usuario no tiene una empresa asociada"}), 404

        periodos = Periodo.query.filter_by(id_empresa=usuario.id_empresa).order_by(Periodo.fecha_inicio.desc()).all()

        resultado = [
            {
                "id_periodo": p.id_periodo,
                "nombre_periodo": p.nombre_periodo,
                "fecha_inicio": p.fecha_inicio.strftime("%Y-%m-%d"),
                "fecha_fin": p.fecha_fin.strftime("%Y-%m-%d"),
                "estado": p.estado
            }
            for p in periodos
        ]

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@manager_bp.route("/configurar-periodo", methods=["POST"])
@role_required(["manager"])
def configurar_periodo():
    try:
        data = request.get_json()
        nombre = data.get("nombre_periodo")
        fecha_inicio_str = data.get("fecha_inicio")
        fecha_fin_str = data.get("fecha_fin")
        horas_por_dia = data.get("horas_laborales_por_dia", 8)

        if not nombre or not fecha_inicio_str or not fecha_fin_str:
            return jsonify({"error": "Faltan campos obligatorios"}), 400

        fecha_inicio = datetime.strptime(fecha_inicio_str, "%Y-%m-%d").date()
        fecha_fin = datetime.strptime(fecha_fin_str, "%Y-%m-%d").date()

        if fecha_fin <= fecha_inicio:
            return jsonify({"error": "La fecha de fin debe ser posterior a la fecha de inicio"}), 400

        user_id = get_jwt_identity()
        usuario = Usuario.query.get(user_id)

        if not usuario or not usuario.id_empresa:
            return jsonify({"error": "El usuario no tiene una empresa asociada"}), 404

        # VALIDACIÓN: nombre único por empresa
        if Periodo.query.filter_by(id_empresa=usuario.id_empresa, nombre_periodo=nombre).first():
            return jsonify({"error": "Ya existe un periodo con ese nombre en la empresa"}), 400

        # VALIDACIÓN: fechas no se superponen
        periodos_existentes = Periodo.query.filter_by(id_empresa=usuario.id_empresa).all()
        for p in periodos_existentes:
            if not (fecha_fin < p.fecha_inicio or fecha_inicio > p.fecha_fin):
                return jsonify({"error": f"Las fechas se superponen con el periodo '{p.nombre_periodo}' ({p.fecha_inicio} a {p.fecha_fin})"}), 400

        periodo_activo = Periodo.query.filter_by(id_empresa=usuario.id_empresa, estado="activo").first()
        if periodo_activo:
            return jsonify({"error": "Ya existe un periodo activo. Debes cerrarlo antes de crear uno nuevo."}), 400

        cantidad_findes = sum(
            1 for i in range((fecha_fin - fecha_inicio).days + 1)
            if (fecha_inicio + timedelta(days=i)).weekday() >= 5
        )

        dias_total = (fecha_fin - fecha_inicio).days + 1
        dias_laborales = dias_total - cantidad_findes

        nuevo_periodo = Periodo(
            id_empresa=usuario.id_empresa,
            nombre_periodo=nombre,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            estado="activo",  # por defecto nuevo periodo comienza activo
            cantidad_findes=cantidad_findes,
            horas_laborales_por_dia=horas_por_dia,
            dias_laborales_en_periodo=dias_laborales
        )

        db.session.add(nuevo_periodo)
        db.session.commit()

        return jsonify({"mensaje": "Periodo creado correctamente"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@manager_bp.route("/empleados-datos-rendimiento-manager", methods=["GET"])
@role_required(["manager"])
def obtener_datos_rendimiento():
    try:
        id_manager = get_jwt_identity()
        id_periodo = request.args.get("periodo")  

        manager = Usuario.query.get(id_manager)

        if not manager or not manager.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        usuarios = (
            db.session.query(Usuario)
            .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
            .join(Rol, UsuarioRol.id_rol == Rol.id)
            .filter(Usuario.id_empresa == manager.id_empresa)
            .filter(Rol.slug.in_(["reclutador", "empleado"]))
            .all()
        )

        if not usuarios:
            return jsonify({"message": "No tienes empleados para mostrar"}), 404

        datos_empleados = []

        for usuario in usuarios:
            rendimiento = RendimientoEmpleado.query.filter_by(id_usuario=usuario.id, id_periodo=id_periodo).first()

            datos_empleados.append({
                "id_usuario": usuario.id,
                "nombre": usuario.nombre,
                "apellido": usuario.apellido,
                "puesto": usuario.puesto_trabajo,
                "horas_capacitacion": rendimiento.horas_capacitacion if rendimiento else None,
                "horas_extra_finde": rendimiento.horas_extras if rendimiento else None,
                "ausencias_injustificadas": rendimiento.ausencias_injustificadas if rendimiento else None,
                "llegadas_tarde": rendimiento.llegadas_tarde if rendimiento else None,
                "salidas_tempranas": rendimiento.salidas_tempranas if rendimiento else None
            })

        return jsonify({"datos_empleados": datos_empleados})
    
    except Exception as e:
        print(f"Error en /empleados-datos-rendimiento-manager: {e}")
        return jsonify({"error": str(e)}), 500


    
def crear_notificacion_uso_especifico(id_usuario, mensaje):
    notificacion = Notificacion(
        id_usuario=id_usuario,
        mensaje=mensaje,
    )
    db.session.add(notificacion)


@manager_bp.route("/empleados-rendimiento-analistas", methods=["GET"])
@role_required(["manager"])
def obtener_empleados_rendimiento_futuro():
    try:
        id_periodo = request.args.get("periodo")
        id_manager = get_jwt_identity()

        manager = Usuario.query.get(id_manager)

        if not manager or not manager.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        empleados = (
            db.session.query(Usuario, RendimientoEmpleado)
            .join(RendimientoEmpleado, and_(
                Usuario.id == RendimientoEmpleado.id_usuario,
                RendimientoEmpleado.id_periodo == id_periodo
            ))
            .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
            .join(Rol, UsuarioRol.id_rol == Rol.id)
            .filter(Usuario.id_empresa == manager.id_empresa)
            .filter(Rol.slug.in_(["reclutador", "empleado"]))
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
                "fecha_calculo_rendimiento": rendimiento.fecha_calculo_rendimiento,
                "puesto": empleado.puesto_trabajo if empleado.puesto_trabajo else "Analista"
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
    

@manager_bp.route("/empleados-riesgo-analistas", methods=["GET"])
@role_required(["manager"])
def obtener_empleados_riesgo_futuro():
    try:
        id_periodo = request.args.get("periodo")
        id_manager = get_jwt_identity()

        manager = Usuario.query.get(id_manager)

        if not manager or not manager.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        empleados = (
            db.session.query(Usuario, RendimientoEmpleado)
            .join(RendimientoEmpleado, and_(
                Usuario.id == RendimientoEmpleado.id_usuario,
                RendimientoEmpleado.id_periodo == id_periodo
            ))
            .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
            .join(Rol, UsuarioRol.id_rol == Rol.id)
            .filter(Usuario.id_empresa == manager.id_empresa)
            .filter(Rol.slug.in_(["reclutador", "empleado"]))
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
            historial = sorted(
                [h for h in empleado.historial_rendimiento_manual if h.id_periodo == id_periodo],
                key=lambda x: x.fecha_calculo,
                reverse=True
            )

            empleado_data = []
            cantidad_postulaciones = obtener_cantidad_postulaciones(empleado.id)

            if historial:
                ultimo_rendimiento_manual = historial[0].rendimiento
                desempeno_real_guardado = rendimiento.riesgo_rotacion_intencional

                if desempeno_real_guardado is None or desempeno_real_guardado != ultimo_rendimiento_manual:
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
    
@manager_bp.route("/cerrar_oferta/<int:id_oferta>", methods=["PUT"])
@role_required(["manager"])
def cerrar_oferta(id_oferta):
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)

    if not manager:
        return jsonify({"error": "Manager no encontrado"}), 404

    oferta = Oferta_laboral.query.get(id_oferta)
    if not oferta:
        return jsonify({"error": "Oferta no encontrada"}), 404

    if oferta.id_empresa != manager.id_empresa:
        return jsonify({"error": "No tenés permisos para cerrar esta oferta"}), 403

    if not oferta.is_active:
        return jsonify({"error": "La oferta ya está cerrada"}), 400

    oferta.is_active = False
    db.session.commit()

    return jsonify({"message": "Oferta cerrada exitosamente"}), 200

# ESTA ERA LA ANTERIOR
# @manager_bp.route("/licencias-mis-reclutadores", methods=["GET"])
# @role_required(["manager"])
# def visualizar_licencias():
#     id_manager = get_jwt_identity()
#     manager = Usuario.query.filter_by(id=id_manager).first()
#     empresa = Empresa.query.filter_by(id=manager.id_empresa).first()

#     licencias = Licencia.query.filter_by(id_empresa=empresa.id).all()

#     resultado = []
#     for licencia in licencias:
#         empleado = Usuario.query.filter_by(id=licencia.id_empleado).first()
#         if (
#             empleado.id_superior == manager.id
#             and empleado.id_empresa == manager.id_empresa
#         ):
#             resultado.append(
#                 {
#                     "licencia": {
#                         "id_licencia": licencia.id,
#                         "empleado": {
#                             "id": licencia.id_empleado,
#                             "nombre": empleado.nombre,
#                             "apellido": empleado.apellido,
#                             "username": empleado.username,
#                             "email": empleado.correo,
#                         },
#                         "tipo": licencia.tipo,
#                         "descripcion": licencia.descripcion if licencia.descripcion else "Sin descripción",
#                         "fecha_inicio": licencia.fecha_inicio.isoformat()
#                         if licencia.fecha_inicio
#                         else None,
#                         "fecha_fin": licencia.fecha_fin.isoformat()
#                         if licencia.fecha_fin
#                         else None,
#                         "estado": licencia.estado,
#                         "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "No Aplica",
#                         "empresa": {
#                             "id": licencia.id_empresa,
#                             "nombre": empresa.nombre,
#                         },
#                         "certificado_url": licencia.certificado_url
#                         if licencia.certificado_url
#                         else None,
#                     }
#                 }
#             )

#     return jsonify(resultado), 200
# ESTA ERA LA ANTERIOR

# @manager_bp.route("/licencia-<int:id_licencia>-reclutador/informacion", methods=["GET"])
# @role_required(["manager"])
# def obtener_detalle_licencia(id_licencia):
#     id_manager = get_jwt_identity()
#     manager = Usuario.query.get(id_manager)
#     licencia = Licencia.query.get(id_licencia)
#     if not licencia:
#         return jsonify({"error": "Licencia no encontrada"}), 404

#     empleado = Usuario.query.get(licencia.id_empleado)
#     if not empleado:
#         return jsonify({"error": "Empleado no encontrado"}), 404

#     # Solo puede ver si la licencia es de su empresa o de un empleado a su cargo
#     if licencia.id_empresa != manager.id_empresa and empleado.id_superior != manager.id:
#         return jsonify({"error": "No tienes permiso para ver esta licencia"}), 403

#     empresa = Empresa.query.get(licencia.id_empresa)

#     return jsonify({
#         "id_licencia": licencia.id,
#         "empleado": {
#             "id": empleado.id,
#             "nombre": empleado.nombre,
#             "apellido": empleado.apellido,
#             "username": empleado.username,
#             "email": empleado.correo,
#         },
#         "tipo": licencia.tipo,
#         "descripcion": licencia.descripcion,
#         "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
#         "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
#         "estado": licencia.estado,
#         "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
#         "empresa": {
#             "id": licencia.id_empresa,
#             "nombre": empresa.nombre if empresa else None,
#         },  
#         "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
#         "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None
#     }), 200

# @manager_bp.route("/licencia-<int:id_licencia>-reclutador/evaluacion", methods=["PUT"])
# @role_required(["manager"])
# def eval_licencia(id_licencia):
#     data = request.get_json()
#     nuevo_estado = data.get("estado")  # "aprobada" o "rechazada"
#     motivo = data.get("motivo")

#     if nuevo_estado not in ["aprobada", "rechazada"]:
#         return jsonify({"error": "El estado debe ser 'aprobada' o 'rechazada'"}), 400

#     id_manager = get_jwt_identity()
#     manager = Usuario.query.get(id_manager)
#     licencia = Licencia.query.get(id_licencia)
#     if not licencia:
#         return jsonify({"error": "Licencia no encontrada"}), 404

#     empleado = Usuario.query.get(licencia.id_empleado)
#     if not empleado:
#         return jsonify({"error": "Empleado no encontrado"}), 404

#     # Solo puede evaluar licencias de vacaciones o estudio en estado pendiente
#     if licencia.estado != "pendiente" or licencia.tipo not in ["vacaciones"]:
#         return jsonify({"error": "Solo puedes evaluar licencias de vacaciones pendientes"}), 403

#     # Solo puede evaluar si la licencia es de su empresa o de un empleado a su cargo
#     if licencia.id_empresa != manager.id_empresa and empleado.id_superior != manager.id:
#         return jsonify({"error": "No tienes permiso para evaluar esta licencia"}), 403

#     licencia.estado = nuevo_estado
#     if motivo:
#         licencia.motivo_rechazo = motivo

#     db.session.commit()

#     empresa = Empresa.query.get(licencia.id_empresa)

#     return jsonify({
#         "message": f"Licencia {nuevo_estado} exitosamente",
#         "licencia": {
#             "id_licencia": licencia.id,
#             "empleado": {
#                 "id": licencia.id_empleado,
#                 "nombre": empleado.nombre,
#                 "apellido": empleado.apellido,
#                 "username": empleado.username,
#                 "email": empleado.correo,
#             },
#             "tipo": licencia.tipo,
#             "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
#             "descripcion": licencia.descripcion,
#             "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
#             "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
#             "estado": licencia.estado,
#             "empresa": {
#                 "id": licencia.id_empresa,
#                 "nombre": empresa.nombre if empresa else None,
#             },
#             "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
#             "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None
#         }
#     }), 200

#         # ---------------#


@manager_bp.route("/ofertas-libres-reclutadores", methods=["GET"])
@role_required(["manager"])
def obtener_ofertas_libres_reclutadores():
    id_manager = get_jwt_identity()
    # Obtener los reclutadores que dependen de este manager
    reclutadores = Usuario.query.filter_by(id_superior=id_manager).all()
    ids_reclutadores = [r.id for r in reclutadores]

    if not ids_reclutadores:
        return jsonify({"message": "No hay reclutadores asociados a este manager"}), 404

    # Buscar ofertas_analista en estado libre creadas por estos reclutadores
    info_ofertas_libres = (
        Oferta_analista.query
        .filter_by(estado="libre")
        .filter(Oferta_analista.id_analista.in_(ids_reclutadores))
        .all()
    )
    ids_ofertas_libres = [oa.id_oferta for oa in info_ofertas_libres]

    if not ids_ofertas_libres:
        return jsonify({"message": "No hay ofertas libres de reclutadores asociados"}), 404

    ofertas_libres = Oferta_laboral.query.filter(Oferta_laboral.id.in_(ids_ofertas_libres)).all()

    resultado = [
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
            "fecha_publicacion": oferta.fecha_publicacion.isoformat() if oferta.fecha_publicacion else None,
            "fecha_cierre": oferta.fecha_cierre.isoformat() if oferta.fecha_cierre else None,
        }
        for oferta in ofertas_libres
    ]

    return jsonify({"ofertas_libres_reclutadores": resultado}), 200

@manager_bp.route('/ofertas-libres', methods=['GET'])
@role_required(["manager"])
def obtener_ids_ofertas_libres():
    id_manager = get_jwt_identity()
    
    reclutadores = Usuario.query.filter_by(id_superior=id_manager).all()
    ids_reclutadores = [r.id for r in reclutadores]

    if not ids_reclutadores:
        return jsonify({"libres": []})  # ✅ que devuelva lista vacía

    info_ofertas_libres = (
        Oferta_analista.query
        .filter_by(estado="libre")
        .filter(Oferta_analista.id_analista.in_(ids_reclutadores))
        .all()
    )
    ids_ofertas_libres = [oa.id_oferta for oa in info_ofertas_libres]

    return jsonify({"libres": ids_ofertas_libres})


@manager_bp.route('/ofertas-asignadas', methods=['GET'])
@role_required(["manager"])
def obtener_ofertas_asignadas():
    try:
        asignaciones = db.session.query(
            Oferta_analista.id_oferta,
            Oferta_analista.id_analista,
            Oferta_analista.estado  # ✅ INCLUIMOS EL ESTADO
        ).all()
        
        # 📦 PRINT DETALLADO PARA DEBUG VISUAL
        print("\n" + "="*50)
        print("📊 ASIGNACIONES DE OFERTAS A ANALISTAS ENCONTRADAS")
        print("="*50)
        if not asignaciones:
            print("⚠️  No se encontraron asignaciones registradas.")
        for id_oferta, id_analista, estado in asignaciones:
            print(f"🟢 Oferta ID: {id_oferta}\n🔵 Analista ID: {id_analista}\n📌 Estado: {estado}\n" + "-"*30)
        print("="*50 + "\n")

        return jsonify([
            {
                "id_oferta": id_oferta,
                "id_analista": id_analista,
                "estado": estado  # ✅ LO DEVOLVEMOS AL CLIENTE
            }
            for id_oferta, id_analista, estado in asignaciones
        ])
    except Exception as e:
        print("❌ Error al obtener asignaciones:", str(e))
        return jsonify({"error": "Error interno"}), 500

@manager_bp.route("/oferta-libre-<int:id_oferta>/informacion", methods=["GET"])
@role_required(["manager"])
def obtener_oferta_libre_reclutador(id_oferta):
    id_manager = get_jwt_identity()
    # Obtener los reclutadores del manager
    reclutadores = Usuario.query.filter_by(id_superior=id_manager).all()
    ids_reclutadores = [r.id for r in reclutadores]

    if not ids_reclutadores:
        return jsonify({"error": "No hay reclutadores asociados a este manager"}), 404

    # Buscar si la oferta está en estado libre y pertenece a un reclutador del manager
    oferta_analista = (
        Oferta_analista.query
        .filter_by(id_oferta=id_oferta, estado="libre")
        .filter(Oferta_analista.id_analista.in_(ids_reclutadores))
        .first()
    )

    if not oferta_analista:
        return jsonify({"error": "No existe una oferta libre de tus reclutadores con ese ID"}), 404

    oferta = Oferta_laboral.query.get(id_oferta)
    if not oferta:
        return jsonify({"error": "Oferta no encontrada"}), 404

    reclutador = Usuario.query.get(oferta_analista.id_analista)
    reclutador_info = {
        "id": reclutador.id,
        "nombre": reclutador.nombre,
        "apellido": reclutador.apellido,
        "correo": reclutador.correo,
        "username": reclutador.username,
        "estado": "Inactivo por licencia" if reclutador.activo == False else "No deberia llegar aca"
    } if reclutador else None

    return jsonify({
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
        "fecha_publicacion": oferta.fecha_publicacion.isoformat() if oferta.fecha_publicacion else None,
        "fecha_cierre": oferta.fecha_cierre.isoformat() if oferta.fecha_cierre else None,
        "reclutador_asignado": reclutador_info
    }), 200

# @manager_bp.route("/reasignar-oferta-libre", methods=["PUT"])
@manager_bp.route("/oferta-libre-<int:id_oferta>/reasignacion", methods=["PUT"])
@role_required(["manager"])
def reasignar_oferta_libre(id_oferta):
    data = request.get_json()
    # id_oferta = data.get("id_oferta")
    id_nuevo_reclutador = data.get("id_nuevo_reclutador")

    if not id_oferta or not id_nuevo_reclutador:
        return jsonify({"error": "Debes enviar 'id_oferta' y 'id_nuevo_reclutador'"}), 400

    id_manager = get_jwt_identity()
    # Reclutadores activos del manager
    reclutadores = Usuario.query.filter_by(id_superior=id_manager, activo=True).all()
    ids_reclutadores = [r.id for r in reclutadores]

    if id_nuevo_reclutador not in ids_reclutadores:
        return jsonify({"error": "El nuevo reclutador no es válido o está inactivo"}), 400

    # Buscar la oferta-analista en estado libre y que pertenezca a un reclutador del manager
    oferta_analista = (
        Oferta_analista.query
        .filter_by(id_oferta=id_oferta, estado="libre")
        .filter(Oferta_analista.id_analista.in_(ids_reclutadores))
        .first()
    )

    if not oferta_analista:
        return jsonify({"error": "No existe una oferta libre de tus reclutadores con ese ID"}), 404

    # Reasignar la oferta al nuevo reclutador
    oferta_analista.id_analista = id_nuevo_reclutador
    db.session.commit()

    nuevo_reclutador = Usuario.query.get(id_nuevo_reclutador)

    return jsonify({
        "message": "Oferta reasignada exitosamente",
        "id_oferta": id_oferta,
        "nuevo_reclutador": {
            "id": nuevo_reclutador.id,
            "nombre": nuevo_reclutador.nombre,
            "apellido": nuevo_reclutador.apellido,
            "correo": nuevo_reclutador.correo,
            "username": nuevo_reclutador.username,
        }
    }), 200
# -------------------------------


@manager_bp.route("/notificar-bajo-rendimiento-analista/<int:id_analista>", methods=["POST"])
@role_required(["manager"])
def notificar_bajo_rendimiento(id_analista):

    if not id_analista:
        return jsonify({"error": "El ID del analista es requerido"}), 400

    # Obtener el admin-emp autenticado
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager or not manager.id_empresa:
        return jsonify({"error": "No tienes una empresa asociada"}), 404

    # Obtener el empleado
    analista = Usuario.query.get(id_analista)
    if not analista:
        return jsonify({"error": "Analista no encontrado"}), 404

    # Verificar que el empleado pertenece a la misma empresa
    if analista.id_empresa != manager.id_empresa:
        return jsonify({"error": "No tienes permiso para notificar a este empleado"}), 403

    mensaje = "Tu proyección de rendimiento ha sido clasificada como 'Bajo Rendimiento'. Te invitamos a que tomes las medidas necesarias para mejorar tu desempeño. Si tienes alguna duda, no dudes en contactar a tu superior."

    crear_notificacion(id_analista, mensaje)

    enviar_notificacion_analista_rendimiento(analista.correo, manager.id_empresa, mensaje)

    # Enviar la notificación (aquí puedes implementar la lógica para enviar el correo)
    # send_email(empleado.correo, "Notificación de Bajo Rendimiento", mensaje)

    return jsonify({
        "message": f"Notificación enviada al empleado {analista.nombre} {analista.apellido}"
    }), 200

def enviar_notificacion_analista_rendimiento(email_destino, nombre_empresa, cuerpo):
    try:
        asunto = "Proyección de Rendimiento"
        cuerpo = f"Nos comunicamos desde {nombre_empresa}. " + cuerpo
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")
        

def enviar_notificacion_analista_riesgos(email_destino, cuerpo):
    try:
        asunto = "Proyección de Rendimiento"
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")
        





@manager_bp.route("/registrar-empleados-manager", methods=["POST"])
@role_required(["manager"])
def registrar_empleados():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)

        file_path = os.path.join(UPLOAD_FOLDER, filename)

        file.save(file_path)

        try:
            resultado = register_employees_from_csv(file_path)
            if "error" in resultado:
                return jsonify(resultado), 400

            return jsonify({
                "message": "Empleados registrados exitosamente",
                "total_empleados": len(resultado),
                "empleados": resultado
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid file format'}), 400


def register_employees_from_csv(file_path):
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        required_fields = {'nombre', 'apellido', 'email', 'username', 'contrasena', 'puesto'}
        puestos_validos = {
            # Tecnología y Desarrollo
            "Jefe de Tecnología y Desarrollo", "Desarrollador Backend", "Desarrollador Frontend", "Full Stack Developer",
            "DevOps Engineer", "Data Engineer", "Ingeniero de Machine Learning",
            "Analista de Datos", "QA Automation Engineer", "Soporte Técnico",
            "Administrador de Base de Datos", "Administrador de Redes", "Especialista en Seguridad Informática",

            # Administración y Finanzas
            "Jefe de Administración y Finanzas", "Analista Contable", "Contador Público", "Analista de Finanzas",
            "Administrativo/a", "Asistente Contable",

            # Comercial y Ventas
            "Jefe Comercial y de Ventas", "Representante de Ventas", "Ejecutivo de Cuentas", "Vendedor Comercial",
            "Supervisor de Ventas", "Asesor Comercial",

            # Marketing y Comunicación
            "Jefe de Marketing y Comunicación", "Especialista en Marketing Digital", "Analista de Marketing",
            "Community Manager", "Diseñador Gráfico", "Responsable de Comunicación",

            # Industria y Producción
            "Jefe de Industria y Producción", "Técnico de Mantenimiento", "Operario de Producción", "Supervisor de Planta",
            "Ingeniero de Procesos", "Encargado de Logística",

            # Servicios Generales y Gastronomía
            "Jefe de Servicios Generales y Gastronomía", "Mozo/a", "Cocinero/a", "Encargado de Salón", "Recepcionista", "Limpieza"
        }

        resultado = []

        for row in reader:
            if not required_fields.issubset(row.keys()):
                # Devuelve un diccionario con el error
                return {"error": "El archivo CSV no contiene las columnas requeridas: nombre, apellido, email, username, contrasena, puesto"}

            nombre = row['nombre'].strip()
            apellido = row['apellido'].strip()
            email = row['email'].strip()
            username = row['username'].strip()
            contrasena = row['contrasena'].strip()
            puesto = row['puesto'].strip()
            

            if not validar_nombre(nombre) or not validar_nombre(apellido):
                return {"error": "Nombre o apellido no válido"}
            
            if puesto not in puestos_validos:
                return {"error": "El puesto del empleado no es valido"}
            
            email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
            if not re.match(email_regex, email):
                return {"error": "Formato de email no válido"}

            existing_user = Usuario.query.filter_by(username=username).first()
            if existing_user:
                return {"error": f"El usuario '{username}' ya existe"}
            
            id_admin_emp = get_jwt_identity()

            admin_emp = Usuario.query.get(id_admin_emp)
            if not admin_emp or not admin_emp.id_empresa:
                return {"error": "El admin-emp no tiene una empresa asociada"}

            id_empresa = admin_emp.id_empresa

            new_user = Usuario(
                nombre=nombre,
                apellido=apellido,
                correo=email,
                username=username,
                contrasena=contrasena,
                id_empresa=id_empresa,
                id_superior=admin_emp.id,
                puesto_trabajo=puesto,
            )
            
            db.session.add(new_user)

            empleado_role = Rol.query.filter_by(slug="empleado").first()
            if not empleado_role:
                empleado_role = Rol(nombre="Empleado", slug="empleado", permisos="permisos_empleado")
                db.session.add(empleado_role)
                db.session.commit()

            new_user.roles.append(empleado_role)

            resultado.append({
                "username": username,
                "password": contrasena
            })

        db.session.commit()
        
        return resultado
    
    
@manager_bp.route("/notificaciones-manager-no-leidas", methods=["GET"])
@role_required(["manager"])
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



@manager_bp.route("/leer-notificacion-manager/<int:id_notificacion>", methods=["PUT"])
@role_required(["manager"])
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
    

@manager_bp.route("/notificaciones-manager-no-leidas-contador", methods=["GET"])
@role_required(["manager"])
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
    
from datetime import datetime, timezone, timedelta

@manager_bp.route("/solicitar-licencia-manager", methods=["POST"])
@role_required(["manager"])
def solicitar_licencia():
    data = request.get_json()
    tipo_licencia = data.get("lic_type")
    descripcion = data.get("description")
    fecha_inicio = data.get("start_date")
    fecha_fin = data.get("end_date")
    certificado_url = data.get("certificado_url")
    dias_requeridos = data.get("dias_requeridos")

    id_manager = get_jwt_identity()
    manager = Usuario.query.filter_by(id=id_manager).first()

    now = datetime.now(timezone.utc)

    # Obtener la empresa y los días máximos configurados
    empresa = Empresa.query.get(manager.id_empresa)
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
        id_empleado=id_manager,
        tipo=tipo_licencia,
        descripcion=descripcion,
        fecha_inicio=fecha_inicio_dt,
        fecha_fin=fecha_fin_dt,
        estado=estado,
        id_empresa=manager.id_empresa,
        certificado_url=certificado_url,
        dias_requeridos=dias_requeridos_val,
    )

    db.session.add(nueva_licencia)

    crear_notificacion_uso_especifico(id_manager, f"Has solicitado una licencia de tipo '{tipo_licencia}'. Tu solicitud está en estado '{estado}'.")
    crear_notificacion_uso_especifico(manager.id_superior, f"El empleado {manager.nombre} ha solicitado una licencia del tipo {tipo_licencia}.")
    enviar_mail_manager_licencia_cuerpo(manager.correo, "Solicitud de licencia", f"Has solicitado una licencia de tipo '{tipo_licencia}'. Tu solicitud está en estado '{estado}'.")

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

@manager_bp.route("/mis-licencias-manager", methods=["GET"])
@role_required(["manager"])
def ver_mis_licencias():
    id_manager = get_jwt_identity()
    licencias = Licencia.query.filter_by(id_empleado=id_manager).all()

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

@manager_bp.route("/mi-licencia-<int:id_licencia>-manager/informacion", methods=["GET"])
@role_required(["manager"])
def obtener_detalle_licencia_manager(id_licencia):
    id_manager = get_jwt_identity()
    licencia = Licencia.query.filter_by(id=id_licencia, id_empleado=id_manager).first()

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

@manager_bp.route("/licencia-<int:id_licencia>-manager/respuesta-sugerencia", methods=["PUT"])
@role_required(["manager"])
def responder_sugerencia_licencia(id_licencia):
    """
    Permite al empleado aceptar o rechazar una sugerencia de fechas de licencia.
    Espera un JSON con {"aceptacion": True/False}
    """
    data = request.get_json()
    aceptacion = data.get("aceptacion")

    if aceptacion is None:
        return jsonify({"error": "Debe indicar si acepta o rechaza la sugerencia"}), 400

    id_manager = get_jwt_identity()
    licencia = Licencia.query.filter_by(id=id_licencia, id_empleado=id_manager).first()

    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    if aceptacion:
        licencia.estado_sugerencia = "sugerencia aceptada"
        crear_notificacion_uso_especifico(licencia.id_empleado, f"Tu sugerencia de licencia ha sido aceptada. Fecha de inicio: {licencia.fecha_inicio_sugerencia.isoformat() if licencia.fecha_inicio_sugerencia else 'No definida'}, Fecha de fin: {licencia.fecha_fin_sugerencia.isoformat() if licencia.fecha_fin_sugerencia else 'No definida'}")
    else:
        licencia.estado = "rechazada"
        licencia.estado_sugerencia = "sugerencia rechazada"
        crear_notificacion_uso_especifico(licencia.id_empleado, f"Tu sugerencia de licencia ha sido rechazada. Motivo: {licencia.motivo_rechazo if licencia.motivo_rechazo else 'No especificado'}")

    db.session.commit()

    return jsonify({
        "message": f"Sugerencia {'aceptada' if aceptacion else 'rechazada'} correctamente",
        "estado_sugerencia": licencia.estado_sugerencia
    }), 200

@manager_bp.route("/licencias-mis-reclutadores", methods=["GET"])
@role_required(["manager"])
def visualizar_licencias_reclutadores():
    id_manager = get_jwt_identity()
    manager = Usuario.query.filter_by(id=id_manager).first()
    empresa = Empresa.query.filter_by(id=manager.id_empresa).first()

    # Reclutadores de la empresa
    empleados = (
        db.session.query(Usuario)
        .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
        .join(Rol, UsuarioRol.id_rol == Rol.id)
        .filter(
            Usuario.id_empresa == empresa.id,
            Rol.slug == "reclutador"
        )
        .all()
    )
    ids_empleados = {e.id for e in empleados}

    # Filtrar licencias solo de estos reclutadores
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

@manager_bp.route("/licencia-<int:id_licencia>-reclutador/informacion", methods=["GET"])
@role_required(["manager"])
def obtener_detalle_licencia(id_licencia):
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Verificar que el usuario tiene rol "empleado"
    tiene_rol_reclutador = (
        db.session.query(Rol)
        .join(UsuarioRol, UsuarioRol.id_rol == Rol.id)
        .filter(UsuarioRol.id_usuario == empleado.id, Rol.slug == "reclutador")
        .first()
    )

    # Solo puede ver si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != manager.id_empresa and not tiene_rol_reclutador:
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

# @manager_bp.route("/licencia-<int:id_licencia>-reclutador/evaluacion", methods=["PUT"])
# @role_required(["manager"])
# def eval_licencia(id_licencia):
#     data = request.get_json()
#     nuevo_estado = data.get("estado")  # "aprobada" o "rechazada"
#     motivo = data.get("motivo")
#     fecha_inicio_sugerida = data.get("fecha_inicio_sugerida")
#     fecha_fin_sugerida = data.get("fecha_fin_sugerida")

#     if nuevo_estado not in ["aprobada", "rechazada", "sugerencia"]:
#         return jsonify({"error": "El estado debe ser 'aprobada', 'rechazada' o 'sugerencia'"}), 400

#     id_manager = get_jwt_identity()
#     manager = Usuario.query.get(id_manager)
#     licencia = Licencia.query.get(id_licencia)
#     if not licencia:
#         return jsonify({"error": "Licencia no encontrada"}), 404

#     empleado = Usuario.query.get(licencia.id_empleado)
#     if not empleado:
#         return jsonify({"error": "Empleado no encontrado"}), 404
    
#     rol_reclutador = (
#         db.session.query(Rol)
#         .join(UsuarioRol, UsuarioRol.id_rol == Rol.id)
#         .filter(UsuarioRol.id_usuario == empleado.id, Rol.slug == "reclutador")
#         .first()
#     )

#     # Permitir aprobar si la licencia está pendiente o si la sugerencia fue aceptada
#     puede_aprobar = (
#         (licencia.estado == "pendiente" and licencia.tipo in ["vacaciones"])
#         or (licencia.estado == "pendiente" and licencia.estado_sugerencia == "sugerencia aceptada")
#         or (licencia.estado == "sugerencia" and licencia.estado_sugerencia == "sugerencia aceptada")
#     )

#     # Solo puede evaluar licencias de vacaciones o estudio en estado pendiente
#     # if licencia.estado != "pendiente" or licencia.tipo not in ["vacaciones"]:
#     #     return jsonify({"error": "Solo puedes evaluar licencias de vacaciones pendientes"}), 403

#     # Solo puede evaluar si la licencia es de su empresa o de un empleado a su cargo
#     if licencia.id_empresa != manager.id_empresa and not rol_reclutador:
#         return jsonify({"error": "No tienes permiso para evaluar esta licencia"}), 403
    
#     message = f"Licencia {nuevo_estado} exitosamente"
#     if nuevo_estado == "aprobada":
#         if not puede_aprobar:
#             return jsonify({"error": "Solo puedes aprobar licencias de vacaciones pendientes o con sugerencia aceptada"}), 403
#         licencia.estado = nuevo_estado
#         # Si la sugerencia fue aceptada, actualizar fechas
#         if licencia.estado_sugerencia == "sugerencia aceptada":
#             licencia.fecha_inicio = licencia.fecha_inicio_sugerencia
#             licencia.fecha_fin = licencia.fecha_fin_sugerencia
#         if motivo:
#             licencia.motivo_rechazo = motivo
#     elif nuevo_estado == "sugerencia":
#         # Guardar sugerencia de fechas y estado_sugerencia
#         if not fecha_inicio_sugerida or not fecha_fin_sugerida:
#             return jsonify({"error": "Debes indicar fecha de inicio y fin sugeridas"}), 400
#         try:
#             fecha_inicio_dt = datetime.strptime(fecha_inicio_sugerida, "%Y-%m-%d").replace(tzinfo=timezone.utc)
#             fecha_fin_dt = datetime.strptime(fecha_fin_sugerida, "%Y-%m-%d").replace(tzinfo=timezone.utc)
#         except Exception:
#             return jsonify({"error": "Formato de fecha sugerida inválido"}), 400

#         licencia.estado = nuevo_estado
#         licencia.estado_sugerencia = "sugerencia pendiente"
#         licencia.fecha_inicio_sugerencia = fecha_inicio_dt
#         licencia.fecha_fin_sugerencia = fecha_fin_dt
#         # El estado de la licencia se mantiene pendiente
#         if motivo:
#             licencia.motivo_rechazo = motivo
#         message = "Licencia sugerida exitosamente"
#     else:
#         licencia.estado = nuevo_estado
#         if motivo:
#             licencia.motivo_rechazo = motivo

#     db.session.commit()

#     empresa = Empresa.query.get(licencia.id_empresa)

#     return jsonify({
#         "message": message,
#         # "message": f"Licencia {nuevo_estado} exitosamente",
#         "licencia": {
#             "id_licencia": licencia.id,
#             "empleado": {
#                 "id": licencia.id_empleado,
#                 "nombre": empleado.nombre,
#                 "apellido": empleado.apellido,
#                 "username": empleado.username,
#                 "email": empleado.correo,
#             },
#             "tipo": licencia.tipo,
#             "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
#             "descripcion": licencia.descripcion,
#             "fecha_inicio": licencia.fecha_inicio.isoformat() if licencia.fecha_inicio else None,
#             "fecha_fin": licencia.fecha_fin.isoformat() if licencia.fecha_fin else None,
#             "estado": licencia.estado,
#             "estado_sugerencia": licencia.estado_sugerencia if licencia.estado_sugerencia else None,
#             "fecha_inicio_sugerida": licencia.fecha_inicio_sugerencia.isoformat() if licencia.fecha_inicio_sugerencia else None,
#             "fecha_fin_sugerida": licencia.fecha_fin_sugerencia.isoformat() if licencia.fecha_fin_sugerencia else None,
#             "empresa": {
#                 "id": licencia.id_empresa,
#                 "nombre": empresa.nombre if empresa else None,
#             },
#             "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
#             "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None
#         }
#     }), 200

@manager_bp.route("/licencia-<int:id_licencia>-reclutador/evaluacion", methods=["PUT"])
@role_required(["manager"])
def eval_licencia(id_licencia):
    data = request.get_json()
    nuevo_estado = data.get("estado")  # "aprobada", "rechazada", "sugerencia", "activa y verificada", "invalidada"
    motivo = data.get("motivo")
    fecha_inicio_sugerida = data.get("fecha_inicio_sugerida")
    fecha_fin_sugerida = data.get("fecha_fin_sugerida")

    estados_validos = ["aprobada", "rechazada", "sugerencia", "activa y verificada", "invalidada"]
    if nuevo_estado not in estados_validos:
        return jsonify({"error": f"El estado debe ser uno de {', '.join(estados_validos)}"}), 400

    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Verificar que el usuario tiene rol "reclutador"
    tiene_rol_reclutador = (
        db.session.query(Rol)
        .join(UsuarioRol, UsuarioRol.id_rol == Rol.id)
        .filter(UsuarioRol.id_usuario == empleado.id, Rol.slug == "reclutador")
        .first()
    )

    # Permitir aprobar si la licencia está pendiente o si la sugerencia fue aceptada
    puede_aprobar = (
        (licencia.estado == "pendiente" and licencia.tipo in ["vacaciones"])
        or (licencia.estado == "pendiente" and licencia.estado_sugerencia == "sugerencia aceptada")
        or (licencia.estado == "sugerencia" and licencia.estado_sugerencia == "sugerencia aceptada")
    )

    # Solo puede evaluar si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != manager.id_empresa and not tiene_rol_reclutador:
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
        crear_notificacion_uso_especifico(empleado.id, mensaje=f"Tu licencia ha sido aprobada.")
        enviar_mail_analista_licencia(empleado.correo, cuerpo=f"Tu licencia ha sido aprobada por el manager {manager.nombre} {manager.apellido}.")
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
        crear_notificacion_uso_especifico(empleado.id, mensaje=f"Tu licencia ha recibido una sugerencia de cambio de dias.")
        enviar_mail_analista_licencia(empleado.correo, cuerpo=f"Tu licencia ha recibido una sugerencia de cambio de días por parte del manager {manager.nombre} {manager.apellido}.")
    elif nuevo_estado == "activa y verificada":
        # Solo se puede verificar si está activa
        if licencia.estado != "activa":
            return jsonify({"error": "Solo puedes verificar licencias en estado 'activa'"}), 403
        licencia.estado = "activa y verificada"
        message = "Licencia verificada exitosamente"
        crear_notificacion(empleado.id, mensaje=f"Tu licencia ha sido verificada y está activa.")
        enviar_mail_analista_licencia(empleado.correo, cuerpo=f"Tu licencia ha sido verificada y está activa por el manager {manager.nombre} {manager.apellido}.")
    elif nuevo_estado == "invalidada":
        # Solo se puede invalidar si está activa
        if licencia.estado != "activa":
            return jsonify({"error": "Solo puedes invalidar licencias en estado 'activa'"}), 403
        licencia.estado = "invalidada"
        if motivo:
            licencia.motivo_rechazo = motivo
        message = "Licencia invalidada exitosamente"
        crear_notificacion_uso_especifico(empleado.id, mensaje=f"Tu licencia ha sido invalidada. Motivo: {motivo}" if motivo else "Tu licencia ha sido invalidada.")
        enviar_mail_analista_licencia(empleado.correo, cuerpo=f"Tu licencia ha sido invalidada por el manager {manager.nombre} {manager.apellido}. Motivo: {motivo}" if motivo else f"Tu licencia ha sido invalidada por el manager {manager.nombre} {manager.apellido}.")
    else:
        licencia.estado = nuevo_estado
        if motivo:
            licencia.motivo_rechazo = motivo
        crear_notificacion_uso_especifico(empleado.id, mensaje=f"Tu licencia ha sido {nuevo_estado}. Motivo: {motivo}" if motivo else f"Tu licencia ha sido {nuevo_estado}.")
        enviar_mail_analista_licencia(empleado.correo, cuerpo=f"Tu licencia ha sido {nuevo_estado} por el manager {manager.nombre} {manager.apellido}. Motivo: {motivo}" if motivo else f"Tu licencia ha sido {nuevo_estado} por el manager {manager.nombre} {manager.apellido}.")

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

@manager_bp.route("/licencia-<int:id_licencia>-manager/cancelar", methods=["PUT"])
@role_required(["manager"])
def cancelar_licencia(id_licencia):
    """
    Permite a un manager cancelar una solicitud de licencia.
    La licencia solo puede ser cancelada si su estado actual es 'sugerencia' o 'activa'.
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
        crear_notificacion_uso_especifico(
            licencia.id_empleado,
            mensaje=f"Tu solicitud de licencia con ID {licencia.id} ha sido cancelada por el manager."
        )
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
    


def enviar_mail_analista_licencia(email_destino, cuerpo):
    try:
        asunto = "Estado de licencia"
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")

def enviar_mail_manager_licencia_cuerpo(email_destino, asunto, cuerpo):
    try:
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")

@manager_bp.route("/subir-certificado-manager", methods=["POST"])
@role_required(["manager"])
def subir_certificado_generico():
    # Verificar si se envió un archivo
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "" or not allowed_file_certificados(file.filename):
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


@manager_bp.route("/notificaciones-manager-todas", methods=["GET"])
@role_required(["manager"])
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
    
@manager_bp.route("/crear-encuesta/manager", methods=["POST"])
@role_required(["manager"])
def crear_encuesta_completa():
    """
    Permite a un manager crear una encuesta y asignarla solo a sus reclutadores:
    - A todos los reclutadores a cargo (todos_reclutadores: true)
    - A una lista de emails de sus reclutadores (emails: [...])
    """
    from sqlalchemy.exc import SQLAlchemyError
    data = request.get_json()
    tipo = data.get("tipo")
    titulo = data.get("titulo")
    descripcion = data.get("descripcion")
    anonima = data.get("anonima")
    fecha_inicio = data.get("fecha_inicio")
    fecha_fin = data.get("fecha_fin")
    todos_reclutadores = data.get("todos_reclutadores", False)
    emails = data.get("emails")
    preguntas = data.get("preguntas", [])

    # Validaciones de campos requeridos
    if not all([tipo, titulo, anonima is not None, fecha_inicio, fecha_fin]):
        return jsonify({"error": "Faltan campos requeridos para la encuesta"}), 400

    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager:
        return jsonify({"error": "Manager no encontrado"}), 404

    # Obtener reclutadores a cargo
    reclutadores = (
        db.session.query(Usuario)
        .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
        .join(Rol, UsuarioRol.id_rol == Rol.id)
        .filter(Usuario.id_superior == id_manager)
        .filter(Rol.slug == "reclutador")
        .all()
    )
    emails_reclutadores = {r.correo for r in reclutadores}
    ids_reclutadores = {r.id for r in reclutadores}

    # Validar fechas
    try:
        fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
        fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
    except Exception:
        return jsonify({"error": "Formato de fecha inválido (YYYY-MM-DD)"}), 400

    hoy = date.today()
    if fecha_inicio_dt < hoy or fecha_fin_dt < hoy:
        return jsonify({"error": "No se pueden elegir fechas pasadas"}), 400
    if fecha_fin_dt < fecha_inicio_dt:
        return jsonify({"error": "La fecha de fin no puede ser anterior a la de inicio"}), 400

    estado = "activa" if fecha_inicio_dt == hoy else "pendiente"

    try:
        # Crear la encuesta
        encuesta = Encuesta(
            tipo=tipo,
            titulo=titulo,
            descripcion=descripcion,
            es_anonima=bool(anonima),
            fecha_inicio=fecha_inicio_dt,
            fecha_fin=fecha_fin_dt,
            creador_id=id_manager,
            estado=estado,
        )
        db.session.add(encuesta)
        db.session.flush()  # Para obtener el id de la encuesta

        asignaciones = []

        if todos_reclutadores:
            # Asignar a todos los reclutadores a cargo
            for reclutador in reclutadores:
                asignacion = EncuestaAsignacion(
                    id_encuesta=encuesta.id,
                    id_usuario=reclutador.id,
                    area=None,
                    puesto_trabajo=reclutador.puesto_trabajo,
                    tipo_asignacion="todos_reclutadores",
                    id_asignador=id_manager,
                    limpia=False
                )
                db.session.add(asignacion)
                asignaciones.append(reclutador.correo)
        elif emails and isinstance(emails, list):
            # Asignar solo a los reclutadores de la lista de emails
            for correo in emails:
                if correo not in emails_reclutadores:
                    db.session.rollback()
                    return jsonify({"error": f"El correo {correo} no corresponde a un reclutador a tu cargo"}), 400
                usuario = next((r for r in reclutadores if r.correo == correo), None)
                asignacion = EncuestaAsignacion(
                    id_encuesta=encuesta.id,
                    id_usuario=usuario.id,
                    area=None,
                    puesto_trabajo=usuario.puesto_trabajo,
                    tipo_asignacion="email_reclutador",
                    id_asignador=id_manager,
                    limpia=False
                )
                db.session.add(asignacion)
                asignaciones.append(usuario.correo)
        else:
            db.session.rollback()
            return jsonify({"error": "Debes indicar todos_reclutadores=true o una lista de emails de reclutadores a cargo"}), 400

        # Preguntas
        preguntas_creadas = []
        for pregunta in preguntas:
            texto = pregunta.get("texto")
            tipo_preg = pregunta.get("tipo")
            opciones = pregunta.get("opciones")
            es_requerida = pregunta.get("es_requerida")
            if not all([texto, tipo_preg, es_requerida is not None]):
                db.session.rollback()
                return jsonify({"error": "Faltan campos requeridos en una pregunta"}), 400
            if tipo_preg in ["opcion_multiple", "unica_opcion"]:
                if not opciones or not isinstance(opciones, list) or not all(isinstance(o, str) for o in opciones):
                    db.session.rollback()
                    return jsonify({"error": "Debes enviar una lista de opciones de respuesta"}), 400
                opciones_json = json.dumps(opciones)
            else:
                opciones_json = None
            pregunta_obj = PreguntaEncuesta(
                id_encuesta=encuesta.id,
                texto=texto,
                tipo=tipo_preg,
                opciones=opciones_json,
                es_requerida=bool(es_requerida)
            )
            db.session.add(pregunta_obj)
            db.session.flush()
            preguntas_creadas.append({
                "id": pregunta_obj.id,
                "texto": texto,
                "tipo": tipo_preg,
                "opciones": opciones if opciones_json else None,
                "es_requerida": bool(es_requerida)
            })

        usuarios_asignados = Usuario.query.filter(Usuario.correo.in_(asignaciones)).all()

        for user in usuarios_asignados:
            if user.telegram and user.telegram.chat_id:
                try:
                    mensaje = f"¡Hola {user.nombre}!\nTu manager te asignó una nueva encuesta: \"{titulo}\".\nResponda entre el {fecha_inicio_dt.strftime('%d/%m/%Y')} y el {fecha_fin_dt.strftime('%d/%m/%Y')}."
                    enviar_mensaje_telegram(user.telegram.chat_id, mensaje)
                except Exception as e:
                    print(f"No se pudo enviar notificación a {user.nombre}: {e}")

        db.session.commit()
        return jsonify({
            "message": "Encuesta creada, asignada y preguntas agregadas exitosamente",
            "encuesta": {
                "id": encuesta.id,
                "tipo": encuesta.tipo,
                "titulo": encuesta.titulo,
                "descripcion": encuesta.descripcion,
                "anonima": encuesta.es_anonima,
                "fecha_inicio": encuesta.fecha_inicio.isoformat(),
                "fecha_fin": encuesta.fecha_fin.isoformat(),
                "estado": encuesta.estado,
            },
            "asignados": asignaciones,
            "preguntas": preguntas_creadas
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": f"Error de base de datos: {str(e)}"}), 500
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500

@manager_bp.route("/obtener-encuestas-creadas/manager", methods=["GET"])
@role_required(["manager"])
def obtener_encuestas_jefe():
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager:
        return jsonify({"error": "Usuario no encontrado"}), 404

    encuestas = Encuesta.query.filter_by(creador_id=id_manager).order_by(Encuesta.fecha_inicio.desc()).all()
    resultado = []
    for encuesta in encuestas:
        # Obtener asignaciones y preguntas
        asignaciones = EncuestaAsignacion.query.filter_by(id_encuesta=encuesta.id).all()
        preguntas = PreguntaEncuesta.query.filter_by(id_encuesta=encuesta.id).all()
        resultado.append({
            "id": encuesta.id,
            "tipo": encuesta.tipo,
            "titulo": encuesta.titulo,
            "descripcion": encuesta.descripcion,
            "anonima": encuesta.es_anonima,
            "fecha_inicio": encuesta.fecha_inicio.isoformat() if encuesta.fecha_inicio else None,
            "fecha_fin": encuesta.fecha_fin.isoformat() if encuesta.fecha_fin else None,
            "estado": encuesta.estado,
            "asignaciones": [
                {
                    "id_usuario": a.id_usuario,
                    "area": a.area,
                    "puesto_trabajo": a.puesto_trabajo,
                    "tipo_asignacion": a.tipo_asignacion
                } for a in asignaciones
            ],
            "preguntas": [
                {
                    "id": p.id,
                    "texto": p.texto,
                    "tipo": p.tipo,
                    "opciones": json.loads(p.opciones) if p.opciones else None,
                    "es_requerida": p.es_requerida
                } for p in preguntas
            ]
        })
    return jsonify(resultado), 200

@manager_bp.route("/obtener-encuestas-asignadas/manager", methods=["GET"])
@role_required(["manager"])
def obtener_encuestas_asignadas():
    """
    Devuelve todas las encuestas asignadas al manager autenticado.
    """
    id_manager = get_jwt_identity()
    asignaciones = EncuestaAsignacion.query.filter_by(id_usuario=id_manager).all()

    if not asignaciones:
        return jsonify({"message": "No tienes encuestas asignadas"}), 404

    resultado = []
    for asignacion in asignaciones:
        encuesta = Encuesta.query.get(asignacion.id_encuesta)
        if encuesta:
            resultado.append({
                "id_encuesta": encuesta.id,
                "titulo": encuesta.titulo,
                "descripcion": encuesta.descripcion,
                "tipo": encuesta.tipo,
                "anonima": encuesta.es_anonima,
                "fecha_inicio": encuesta.fecha_inicio.isoformat() if encuesta.fecha_inicio else None,
                "fecha_fin": encuesta.fecha_fin.isoformat() if encuesta.fecha_fin else None,
                "estado": encuesta.estado,
                "asignacion": {
                    "tipo_asignacion": asignacion.tipo_asignacion,
                    "area": asignacion.area, 
                    "puesto_trabajo": asignacion.puesto_trabajo 
                }
            })

    return jsonify(resultado), 200

@manager_bp.route("/encuesta-asignada/<int:id_encuesta>/manager", methods=["GET"])
@role_required(["manager"])
def obtener_encuesta_asignada_detalle(id_encuesta):
    """
    Devuelve toda la información de una encuesta asignada al manager autenticado, incluyendo preguntas y detalles de asignación.
    """
    id_manager = get_jwt_identity()
    asignacion = EncuestaAsignacion.query.filter_by(id_encuesta=id_encuesta, id_usuario=id_manager).first()
    if not asignacion:
        return jsonify({"error": "No tienes esta encuesta asignada"}), 404

    encuesta = Encuesta.query.get(id_encuesta)
    if not encuesta:
        return jsonify({"error": "Encuesta no encontrada"}), 404

    preguntas = PreguntaEncuesta.query.filter_by(id_encuesta=id_encuesta).all()
    preguntas_info = [
        {
            "id": p.id,
            "texto": p.texto,
            "tipo": p.tipo,
            "opciones": json.loads(p.opciones) if p.opciones else None,
            "es_requerida": p.es_requerida
        }
        for p in preguntas
    ]

    return jsonify({
        "id_encuesta": encuesta.id,
        "titulo": encuesta.titulo,
        "descripcion": encuesta.descripcion,
        "tipo": encuesta.tipo,
        "anonima": encuesta.es_anonima,
        "fecha_inicio": encuesta.fecha_inicio.isoformat() if encuesta.fecha_inicio else None,
        "fecha_fin": encuesta.fecha_fin.isoformat() if encuesta.fecha_fin else None,
        "estado": encuesta.estado,
        "asignacion": {
            "tipo_asignacion": asignacion.tipo_asignacion,
            "area": asignacion.area, #
            "puesto_trabajo": asignacion.puesto_trabajo #
        },
        "preguntas": preguntas_info
    }), 200

@manager_bp.route("/responder-encuesta/<int:id_encuesta>/manager", methods=["POST"])
@role_required(["manager"])
def responder_encuesta(id_encuesta):
    """
    Permite a un manager responder una encuesta asignada.
    Espera un JSON con {"respuestas": [{"id_pregunta": int, "respuesta": ...}, ...]}
    """
    id_manager = get_jwt_identity()
    asignacion = EncuestaAsignacion.query.filter_by(id_encuesta=id_encuesta, id_usuario=id_manager).first()
    if not asignacion:
        return jsonify({"error": "No tienes esta encuesta asignada"}), 403

    encuesta = Encuesta.query.get(id_encuesta)
    if not encuesta:
        return jsonify({"error": "Encuesta no encontrada"}), 404

    if encuesta.estado not in ["activa"]:
        return jsonify({"error": "La encuesta no está activa"}), 400

    data = request.get_json()
    respuestas = data.get("respuestas")
    if not respuestas or not isinstance(respuestas, list):
        return jsonify({"error": "Debes enviar una lista de respuestas"}), 400

    preguntas = {p.id: p for p in PreguntaEncuesta.query.filter_by(id_encuesta=id_encuesta).all()}
    preguntas_requeridas = {p.id for p in preguntas.values() if p.es_requerida}

    respondidas = set()
    for r in respuestas:
        id_pregunta = r.get("id_pregunta")
        respuesta = r.get("respuesta")
        if id_pregunta not in preguntas:
            return jsonify({"error": f"Pregunta {id_pregunta} inválida"}), 400
        if preguntas[id_pregunta].es_requerida and (respuesta is None or respuesta == ""):
            return jsonify({"error": f"La pregunta {id_pregunta} es requerida"}), 400
        # Validar opciones si corresponde
        if preguntas[id_pregunta].tipo in ["opcion_multiple", "unica_opcion"]:
            opciones = json.loads(preguntas[id_pregunta].opciones or "[]")
            if isinstance(respuesta, list):
                if not all(opt in opciones for opt in respuesta):
                    return jsonify({"error": f"Respuesta inválida para la pregunta {id_pregunta}"}), 400
            else:
                if respuesta not in opciones:
                    return jsonify({"error": f"Respuesta inválida para la pregunta {id_pregunta}"}), 400
        respondidas.add(id_pregunta)

    # Verificar que todas las requeridas estén respondidas
    if not preguntas_requeridas.issubset(respondidas):
        return jsonify({"error": "Debes responder todas las preguntas requeridas"}), 400

    # Guardar respuestas
    for r in respuestas:
        id_pregunta = r["id_pregunta"]
        respuesta = r["respuesta"]
        # Si la respuesta es lista, guardar como JSON string
        if isinstance(respuesta, list):
            respuesta_db = json.dumps(respuesta)
        else:
            respuesta_db = str(respuesta)
        nueva_respuesta = RespuestaEncuesta(
            id_pregunta=id_pregunta,
            id_usuario=id_manager,
            respuesta=respuesta_db,
            fecha_respuesta=datetime.now(timezone.utc)
        )
        db.session.add(nueva_respuesta)

    db.session.commit()
    return jsonify({"message": "Respuestas guardadas correctamente"}), 201

@manager_bp.route("/encuesta/<int:id_encuesta>/respuestas-info/manager", methods=["GET"])
@role_required(["manager"])
def estado_respuestas_encuesta(id_encuesta):
    """
    Devuelve para una encuesta creada por el manager:
    - Si es anónima: solo totales y lista de no respondieron (sin lista de respondieron)
    - Si NO es anónima: totales y listas completas
    """
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager:
        return jsonify({"error": "Usuario no encontrado"}), 404
    encuesta = Encuesta.query.get(id_encuesta)
    if not encuesta:
        return jsonify({"error": "Encuesta no encontrada"}), 404
    if encuesta.creador_id != manager.id:
        return jsonify({"error": "No tienes permisos para ver esta información"}), 403

    asignaciones = EncuestaAsignacion.query.filter_by(id_encuesta=id_encuesta).all()
    preguntas = PreguntaEncuesta.query.filter_by(id_encuesta=id_encuesta).all()
    preguntas_ids = [p.id for p in preguntas]
    respuestas = (
        RespuestaEncuesta.query
        .filter(RespuestaEncuesta.id_pregunta.in_(preguntas_ids))
        .with_entities(RespuestaEncuesta.id_usuario)
        .distinct()
        .all()
    )
    respondieron_ids = {r.id_usuario for r in respuestas}

    respondieron = []
    no_respondieron = []
    for asignacion in asignaciones:
        usuario = Usuario.query.get(asignacion.id_usuario)
        if not usuario:
            continue
        if encuesta.es_anonima:
            info = {
                "id": usuario.id,
                "nombre": "Empleado Anónimo",
                "apellido": "",
                "correo": None,
                "puesto_trabajo": usuario.puesto_trabajo
            }
        else:
            info = {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "apellido": usuario.apellido,
                "correo": usuario.correo,
                "puesto_trabajo": usuario.puesto_trabajo
            }
        if usuario.id in respondieron_ids:
            respondieron.append(info)
        else:
            no_respondieron.append(info)

    if encuesta.es_anonima:
        # Mostrar ambas listas pero con nombres anónimos
        return jsonify({
            "total_asignados": len(asignaciones),
            "total_respondieron": len(respondieron),
            "total_no_respondieron": len(no_respondieron),
            "respondieron": respondieron,
            "no_respondieron": no_respondieron
        }), 200
    else:
        # Mostrar ambas listas con datos reales
        return jsonify({
            "total_asignados": len(asignaciones),
            "total_respondieron": len(respondieron),
            "total_no_respondieron": len(no_respondieron),
            "respondieron": respondieron,
            "no_respondieron": no_respondieron
        }), 200
    
@manager_bp.route("/encuesta/<int:id_encuesta>/respuestas-empleado/<int:id_empleado>/manager", methods=["GET"])
@role_required(["manager"])
def ver_respuestas_empleado_encuesta(id_encuesta, id_empleado):
    """
    Permite al manager ver las respuestas de un empleado a una encuesta, 
    mostrando datos reales solo si la encuesta no es anónima.
    """
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager:
        return jsonify({"error": "Usuario no encontrado"}), 404
    encuesta = Encuesta.query.get(id_encuesta)
    if not encuesta:
        return jsonify({"error": "Encuesta no encontrada"}), 404
    if encuesta.creador_id != manager.id:
        return jsonify({"error": "No tienes permisos para ver esta información"}), 403

    # Verificar que el empleado esté asignado a la encuesta
    asignacion = EncuestaAsignacion.query.filter_by(id_encuesta=id_encuesta, id_usuario=id_empleado).first()
    if not asignacion:
        return jsonify({"error": "El empleado no está asignado a esta encuesta"}), 404

    usuario = Usuario.query.get(id_empleado)
    if not usuario:
        return jsonify({"error": "Empleado no encontrado"}), 404

    preguntas = PreguntaEncuesta.query.filter_by(id_encuesta=id_encuesta).all()
    preguntas_dict = {p.id: p for p in preguntas}

    respuestas = (
        RespuestaEncuesta.query
        .filter_by(id_usuario=id_empleado)
        .filter(RespuestaEncuesta.id_pregunta.in_([p.id for p in preguntas]))
        .all()
    )

    respuestas_info = []
    for r in respuestas:
        pregunta = preguntas_dict.get(r.id_pregunta)
        respuestas_info.append({
            "id_pregunta": r.id_pregunta,
            "pregunta": pregunta.texto if pregunta else None,
            "respuesta": r.respuesta,
            "fecha_respuesta": r.fecha_respuesta.isoformat() if r.fecha_respuesta else None
        })

    if encuesta.es_anonima:
        empleado_info = {
            "id": usuario.id,
            "nombre": "Empleado Anónimo",
            "apellido": "",
            "correo": None,
            "puesto_trabajo": usuario.puesto_trabajo
        }
    else:
        empleado_info = {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "puesto_trabajo": usuario.puesto_trabajo
        }

    return jsonify({
        "empleado": empleado_info,
        "respuestas": respuestas_info
    }), 200

@manager_bp.route("/cerrar-encuesta/<int:id_encuesta>", methods=["PUT"])
@role_required(["manager"])
def cerrar_encuesta(id_encuesta):
    """
    Permite al manager cerrar una encuesta creada por él.
    """
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager:
        return jsonify({"error": "Usuario no encontrado"}), 404

    encuesta = Encuesta.query.get(id_encuesta)
    if not encuesta:
        return jsonify({"error": "Encuesta no encontrada"}), 404

    if encuesta.creador_id != manager.id:
        return jsonify({"error": "No tienes permisos para cerrar esta encuesta"}), 403

    if encuesta.estado == "cerrada":
        return jsonify({"error": "La encuesta ya está cerrada"}), 400

    encuesta.estado = "cerrada"
    db.session.commit()

    return jsonify({"message": "Encuesta cerrada exitosamente", "id_encuesta": encuesta.id}), 200

@manager_bp.route("/mis-tareas-manager", methods=["GET"])
@role_required(["manager"])
def obtener_tareas():
    id_manager = get_jwt_identity()
    tareas = Tarea.query.filter_by(id_usuario=id_manager).all()
    
    resultado = [
        {
            "id": tarea.id,
            "titulo": tarea.titulo,
            "descripcion": tarea.descripcion,
            "fecha_creacion": tarea.fecha_creacion.isoformat(),
            "fecha_vencimiento": tarea.fecha_vencimiento.isoformat() if tarea.fecha_vencimiento else None,
            "estado": tarea.estado,
            "tipo": tarea.tipo,
            "prioridad": tarea.prioridad,
        }
        for tarea in tareas
    ]
    
    return jsonify(resultado), 200

@manager_bp.route("/crear-tarea-manager", methods=["POST"])
@role_required(["manager"])
def crear_tarea():
    data = request.get_json()
    id_usuario = get_jwt_identity()

    # Verificar campos obligatorios
    if not data.get("titulo"):
        return jsonify({"error": "Título es obligatorio"}), 400
    
    # Validar prioridad
    if "prioridad" in data and data["prioridad"] not in ["alta", "media", "baja"]:
        return jsonify({"error": "Prioridad inválida"}), 400
    
     # Validar fecha de vencimiento si existe
    fecha_vencimiento = data.get("fecha_vencimiento")
    if fecha_vencimiento:
        try:
            datetime.fromisoformat(fecha_vencimiento)
        except Exception:
            return jsonify({"error": "Formato de fecha_vencimiento inválido"}), 400

    nueva_tarea = Tarea(
        id_usuario=id_usuario,
        titulo=data.get("titulo"),
        descripcion=data.get("descripcion"),
        fecha_vencimiento=fecha_vencimiento,
        estado="pendiente",
        tipo="personal",
        prioridad=data.get("prioridad")
    )
    
    db.session.add(nueva_tarea)
    db.session.commit()
    
    return jsonify({"id": nueva_tarea.id}), 201

@manager_bp.route("/tarea/<int:id_tarea>/manager", methods=["GET"])
@role_required(["manager"])
def obtener_tarea(id_tarea):
    id_usuario = get_jwt_identity()
    manager = Usuario.query.get_or_404(id_usuario)
    tarea = Tarea.query.get_or_404(id_tarea)

    # Verificar que la tarea pertenezca al usuario
    if tarea.id_usuario != manager.id:
        return jsonify({"error": "No tienes permiso para ver esta tarea"}), 403

    return jsonify({
        "id": tarea.id,
        "titulo": tarea.titulo,
        "descripcion": tarea.descripcion,
        "fecha_creacion": tarea.fecha_creacion.isoformat(),
        "fecha_vencimiento": tarea.fecha_vencimiento.isoformat() if tarea.fecha_vencimiento else None,
        "estado": tarea.estado,
        "tipo": tarea.tipo,
        "prioridad": tarea.prioridad
    }), 200

@manager_bp.route("/tarea/<int:id_tarea>/manager", methods=["PUT"])
@role_required(["manager"])
def actualizar_tarea(id_tarea):
    id_usuario = get_jwt_identity()
    manager = Usuario.query.get_or_404(id_usuario)
    tarea = Tarea.query.get_or_404(id_tarea)

    # Verificar que la tarea pertenezca al usuario
    if tarea.id_usuario != manager.id:
        return jsonify({"error": "No tienes permiso para modificar esta tarea"}), 403
    
    # Verificar que la tarea sea de tipo personal
    if tarea.tipo != "personal":
        return jsonify({"error": "Solo puedes modificar tareas de tipo personal"}), 403

    data = request.get_json()

    # Validar estado y prioridad si se envían
    if "estado" in data and data["estado"] not in ["pendiente", "en progreso", "completada"]:
        return jsonify({"error": "Estado inválido"}), 400
    if "prioridad" in data and data["prioridad"] not in ["alta", "media", "baja"]:
        return jsonify({"error": "Prioridad inválida"}), 400
    if "fecha_vencimiento" in data and data["fecha_vencimiento"]:
        try:
            datetime.fromisoformat(data["fecha_vencimiento"])
        except Exception:
            return jsonify({"error": "Formato de fecha_vencimiento inválido"}), 400
    
    tarea.titulo = data.get("titulo", tarea.titulo)
    tarea.descripcion = data.get("descripcion", tarea.descripcion)
    tarea.fecha_vencimiento = data.get("fecha_vencimiento", tarea.fecha_vencimiento)
    tarea.estado = data.get("estado", tarea.estado)
    # tarea.tipo = data.get("tipo", tarea.tipo)
    tarea.prioridad = data.get("prioridad", tarea.prioridad)
    
    db.session.commit()
    
    return jsonify({"message": "Tarea actualizada exitosamente"}), 200

@manager_bp.route("/tarea/<int:id_tarea>/manager", methods=["DELETE"])
@role_required(["manager"])
def eliminar_tarea(id_tarea):
    id_usuario = get_jwt_identity()
    manager = Usuario.query.get_or_404(id_usuario)
    tarea = Tarea.query.get_or_404(id_tarea)

    # Verificar que la tarea pertenezca al usuario
    if tarea.id_usuario != manager.id:
        return jsonify({"error": "No tienes permiso para eliminar esta tarea"}), 403

    # solo la puede eliminir si es de tipo personal
    if tarea.tipo != "personal":
        return jsonify({"error": "Solo puedes eliminar tareas de tipo personal"}), 403
    
    db.session.delete(tarea)
    db.session.commit()
    
    return jsonify({"message": "Tarea eliminada exitosamente"}), 200

@manager_bp.route("/mis-reclutadores", methods=["GET"])
@role_required(["manager"])
def obtener_mis_reclutadores():
    """
    Devuelve la lista de reclutadores a cargo del manager autenticado.
    """
    id_manager = get_jwt_identity()
    # Reclutadores a cargo del manager
    reclutadores = (
        db.session.query(Usuario)
        .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
        .join(Rol, UsuarioRol.id_rol == Rol.id)
        .filter(Usuario.id_superior == id_manager)
        .filter(Rol.slug == "reclutador")
        .all()
    )

    resultado = [
        {
            "id": r.id,
            "nombre": r.nombre,
            "apellido": r.apellido,
            "correo": r.correo,
            "username": r.username,
            "activo": r.activo,
        }
        for r in reclutadores
    ]

    return jsonify({"reclutadores": resultado}), 200