import json
import secrets
import re
import csv
import pandas as pd
from ml.desempeno_desarrollo.predictions import predecir_rend_futuro
from auth.decorators import role_required
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename
from models.extensions import db
from flasgger import swag_from
from datetime import datetime, timezone, date
from .notificacion import crear_notificacion
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
    HistorialRendimientoEmpleado
)
from ml.desempeno_desarrollo.predictions import predecir_rend_futuro_individual, predecir_riesgo_despido_individual, predecir_riesgo_rotacion_individual, predecir_riesgo_renuncia_individual

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

UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
manager_bp.image_upload_folder = UPLOAD_FOLDER_IMG
os.makedirs(UPLOAD_FOLDER_IMG, exist_ok=True)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "info_laboral")
ALLOWED_EXTENSIONS = {"csv"}
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
                descripcion,
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
        umbral_individual = (int(umbral_individual) / 100) if umbral_individual else 0.55
        
        if salary_min == 0 and salary_max == 0:
            return jsonify({"error": "El salario mínimo y máximo no pueden ser 0."}), 400

        if salary_min >= salary_max:
            return jsonify({"error": "El salario mínimo no puede ser mayor que el salario máximo."}), 400
        
        if salary_min < 0 or salary_max < 0:
            return jsonify({"error": "El salario mínimo y máximo deben ser mayores o iguales a 0."}), 400
        
        if not validar_fecha(fecha_cierre):
            return jsonify({"error": "Formato de fecha de cierre no válido. Debe ser YYYY-MM-DD, DD/MM/YYYY o MM-DD-YYYY."}), 400
        
        if fecha_cierre:
            fecha_cierre = datetime.strptime(fecha_cierre, "%Y-%m-%d").date()
            if fecha_cierre < datetime.now().date():
                return jsonify({"error": "La fecha de cierre no puede ser anterior a la fecha actual."}), 400

        nueva_oferta = Oferta_laboral(
            id_empresa=empresa.id,
            id_creador=manager.id,
            nombre=nombre,
            descripcion=descripcion,
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
            fecha_cierre=fecha_cierre if fecha_cierre else None,
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

    oferta_analista = Oferta_analista(id_oferta=oferta.id, id_analista=analista.id)
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

        db.session.commit()
        return resultado
    

def registrar_info_laboral_empleados_tabla(file_path):
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
    try:
        datos = request.get_json()
        empleados = datos.get("empleados", [])
        registros = []

        for row in empleados:
            nuevo = {
                "id_empleado": row["id_empleado"],
                "horas_extras": row.get("horas_extras"),
                "horas_capacitacion": row.get("horas_capacitacion"),
                "ausencias_injustificadas": row.get("ausencias_injustificadas"),
                "llegadas_tarde": row.get("llegadas_tarde"),
                "salidas_tempranas": row.get("salidas_tempranas")
            }
            registros.append(nuevo)

        df = pd.DataFrame(registros)
        csv_dir = os.path.join(os.getcwd(), "uploads", "info_laboral")
        os.makedirs(csv_dir, exist_ok=True)
        path_csv = os.path.join(csv_dir, "rendimientos_empleados.csv")
        df.to_csv(path_csv, index=False)

        resultado = registrar_info_laboral_empleados_tabla(path_csv)
        print("Resultado función registrar info laboral:", resultado)
        if "error" in resultado:
            return jsonify(resultado), 400

        return jsonify(resultado), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al guardar rendimientos: {e}")
        return jsonify({"error": "No se pudo guardar los rendimientos"}), 500


@manager_bp.route("/empleados-datos-rendimiento-manager", methods=["GET"])
@role_required(["manager"])
def obtener_datos_rendimiento():
    try:
        id_manager = get_jwt_identity()

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
            rendimiento = RendimientoEmpleado.query.filter_by(id_usuario=usuario.id).first()

            datos_empleados.append({
                "id_usuario": usuario.id,
                "nombre": usuario.nombre,
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

@manager_bp.route("/licencias-mis-reclutadores", methods=["GET"])
@role_required(["manager"])
def visualizar_licencias():
    id_manager = get_jwt_identity()
    manager = Usuario.query.filter_by(id=id_manager).first()
    empresa = Empresa.query.filter_by(id=manager.id_empresa).first()

    licencias = Licencia.query.filter_by(id_empresa=empresa.id).all()

    resultado = []
    for licencia in licencias:
        empleado = Usuario.query.filter_by(id=licencia.id_empleado).first()
        if (
            empleado.id_superior == manager.id
            and empleado.id_empresa == manager.id_empresa
        ):
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
                        "fecha_inicio": licencia.fecha_inicio.isoformat()
                        if licencia.fecha_inicio
                        else None,
                        "fecha_fin": licencia.fecha_fin.isoformat()
                        if licencia.fecha_fin
                        else None,
                        "estado": licencia.estado,
                        "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "No Aplica",
                        "empresa": {
                            "id": licencia.id_empresa,
                            "nombre": empresa.nombre,
                        },
                        "certificado_url": licencia.certificado_url
                        if licencia.certificado_url
                        else None,
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

    # Solo puede ver si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != manager.id_empresa and empleado.id_superior != manager.id:
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
        "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
        "empresa": {
            "id": licencia.id_empresa,
            "nombre": empresa.nombre if empresa else None,
        },  
        "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
        "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None
    }), 200

@manager_bp.route("/licencia-<int:id_licencia>-reclutador/evaluacion", methods=["PUT"])
@role_required(["manager"])
def eval_licencia(id_licencia):
    data = request.get_json()
    nuevo_estado = data.get("estado")  # "aprobada" o "rechazada"
    motivo = data.get("motivo")

    if nuevo_estado not in ["aprobada", "rechazada"]:
        return jsonify({"error": "El estado debe ser 'aprobada' o 'rechazada'"}), 400

    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Solo puede evaluar licencias de vacaciones o estudio en estado pendiente
    if licencia.estado != "pendiente" or licencia.tipo not in ["vacaciones"]:
        return jsonify({"error": "Solo puedes evaluar licencias de vacaciones pendientes"}), 403

    # Solo puede evaluar si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != manager.id_empresa and empleado.id_superior != manager.id:
        return jsonify({"error": "No tienes permiso para evaluar esta licencia"}), 403

    licencia.estado = nuevo_estado
    if motivo:
        licencia.motivo_rechazo = motivo

    db.session.commit()

    empresa = Empresa.query.get(licencia.id_empresa)

    return jsonify({
        "message": f"Licencia {nuevo_estado} exitosamente",
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
            "empresa": {
                "id": licencia.id_empresa,
                "nombre": empresa.nombre if empresa else None,
            },
            "certificado_url": licencia.certificado_url if licencia.certificado_url else None,
            "dias_requeridos": licencia.dias_requeridos if licencia.dias_requeridos else None
        }
    }), 200

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
            "Desarrollador Backend", "Desarrollador Frontend", "Full Stack Developer",
            "DevOps Engineer", "Data Engineer", "Ingeniero de Machine Learning",
            "Analista de Datos", "QA Automation Engineer", "Soporte Técnico",
            "Administrador de Base de Datos", "Administrador de Redes", "Especialista en Seguridad Informática",

            # Administración y Finanzas
            "Analista Contable", "Contador Público", "Analista de Finanzas",
            "Administrativo/a", "Asistente Contable",

            # Comercial y Ventas
            "Representante de Ventas", "Ejecutivo de Cuentas", "Vendedor Comercial",
            "Supervisor de Ventas", "Asesor Comercial",

            # Marketing y Comunicación
            "Especialista en Marketing Digital", "Analista de Marketing",
            "Community Manager", "Diseñador Gráfico", "Responsable de Comunicación",

            # Industria y Producción
            "Técnico de Mantenimiento", "Operario de Producción", "Supervisor de Planta",
            "Ingeniero de Procesos", "Encargado de Logística",

            # Servicios Generales y Gastronomía
            "Mozo/a", "Cocinero/a", "Encargado de Salón", "Recepcionista", "Limpieza"
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