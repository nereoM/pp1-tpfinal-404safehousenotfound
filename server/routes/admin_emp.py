from flask import Blueprint, jsonify, request, send_file
from auth.decorators import role_required
from models.schemes import Usuario, Rol, Empresa, Preferencias_empresa, Licencia, RendimientoEmpleado, UsuarioRol, RendimientoEmpleado, Notificacion
from models.extensions import db
import secrets
from flask_jwt_extended import get_jwt_identity, jwt_required
import os
from werkzeug.utils import secure_filename
import re
from flasgger import swag_from
import csv
from .candidato import allowed_image
from ml.desempeno_desarrollo.predictions import predecir_rend_futuro, predecir_rend_futuro_individual, predecir_riesgo_rotacion_individual, predecir_riesgo_despido_individual, predecir_riesgo_renuncia_individual
import pandas as pd
from .notificacion import crear_notificacion
from flask_mail import Message
from models.extensions import mail
from datetime import datetime, timezone

admin_emp_bp = Blueprint("admin_emp", __name__)

@admin_emp_bp.route("/admin-emp-home", methods=["GET"])
@role_required(["admin-emp"])
def admin_emp_home():
    return jsonify({"message": "Bienvenido al Inicio de Admin-emp"}), 200

UPLOAD_FOLDER_IMG = os.path.join(os.getcwd(), "uploads", "fotos")
ALLOWED_IMG_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
admin_emp_bp.image_upload_folder = UPLOAD_FOLDER_IMG
os.makedirs(UPLOAD_FOLDER_IMG, exist_ok=True)

@admin_emp_bp.route("/subir-image-admin", methods=["POST"])
@role_required(["admin-emp"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_image(file.filename):
        id_admin = get_jwt_identity()
        usuario = Usuario.query.get(id_admin)

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"usuario_{id_admin}.{ext}"

        upload_folder = admin_emp_bp.image_upload_folder

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

@swag_from("../docs/admin-emp/preferencias.yml")
@swag_from("../docs/admin-emp/preferencias_put.yml")
@admin_emp_bp.route("/empresa/<int:id_empresa>/preferencias", methods=["GET", "PUT"])
@role_required(["admin-emp", "manager", "reclutador", "empleado"])
def preferencias_empresa(id_empresa):
    if request.method == "GET":
        pref = Preferencias_empresa.query.filter_by(id_empresa=id_empresa).first()
        if not pref:
            return jsonify({"mensaje": "Sin preferencias"}), 404

        return jsonify({
            "id_empresa": id_empresa,
            "slogan": pref.slogan,
            "descripcion": pref.descripcion,
            "logo_url": pref.logo_url,
            "color_principal": pref.color_principal,
            "color_secundario": pref.color_secundario,
            "color_texto": pref.color_texto
        }), 200

    elif request.method == "PUT":
        data = request.get_json()
        pref = Preferencias_empresa.query.filter_by(id_empresa=id_empresa).first()
        if not pref:
            pref = Preferencias_empresa(id_empresa=id_empresa)

        pref.slogan = data.get("slogan")
        pref.descripcion = data.get("descripcion")
        pref.logo_url = data.get("logo_url")
        pref.color_principal = data.get("color_principal")
        pref.color_secundario = data.get("color_secundario")
        pref.color_texto = data.get("color_texto")

        db.session.add(pref)
        db.session.commit()

        return jsonify({"mensaje": "Preferencias actualizadas correctamente"}), 200


@swag_from("../docs/admin-emp/ver-empleados-admin.yml")
@admin_emp_bp.route("/empleados-admin", methods=["GET"])
@role_required(["admin-emp"])
def ver_empleados_admin():
    id_admin = get_jwt_identity()

    empleados = Usuario.query.filter_by(id_superior=id_admin).all()

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

@swag_from("../docs/admin-emp/desvincular-manager.yml")
@admin_emp_bp.route("/desvincular-manager/<int:id_empleado>", methods=["PUT"])
@role_required(["admin-emp"])
def desvincular_empleado(id_empleado):
    id_admin = int(get_jwt_identity())

    empleado = Usuario.query.get(id_empleado)

    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    if empleado.id_superior != id_admin:
        return jsonify({"error": "No tenés permisos para desvincular a este usuario"}), 403
    
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

@admin_emp_bp.route("/info-admin", methods=["GET"])
@jwt_required()
@swag_from("../docs/admin-emp/info-admin.yml")
def obtener_nombre_apellido_admin():
    id_admin = get_jwt_identity()
    admin = Usuario.query.get(id_admin)
    if not admin:
        return jsonify({"error": "Admin-emp no encontrado"}), 404

    return {
        "nombre": admin.nombre,
        "apellido": admin.apellido,
        "username": admin.username,
        "correo": admin.correo,
        "empresa_id" : admin.id_empresa,
        "foto_url":  admin.foto_url
    }

@swag_from("../docs/admin-emp/registrar-manager.yml")
@admin_emp_bp.route("/registrar-manager", methods=["POST"])
@role_required(["admin-emp"])
def registrar_manager():
    data = request.get_json()
    nombre = data.get("name")
    apellido = data.get("lastname")
    username = data["username"]
    email = data["email"]

    if not nombre or not apellido or not username or not email:
        return jsonify({"error": "Todos los campos son requeridos"}), 400
    
    if not validar_nombre(nombre) or not validar_nombre(apellido):
        return jsonify({"error": "Nombre o apellido no válido"}), 400

    # Obtener el ID del admin-emp autenticado
    id_admin_emp = get_jwt_identity()

    # Verificar si el admin-emp tiene una empresa asociada
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403

    id_empresa = admin_emp.id_empresa  # Obtener la empresa del admin-emp
    
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, email):
        return jsonify({"error": "Formato de email no valido"}), 400

    # Obtener la empresa directamente a través de id_empresa
    empresa = Empresa.query.get(id_empresa)
    if not empresa:
        return jsonify({"error": "No se pudo encontrar la empresa asociada"}), 404

    # Generar una contraseña temporal
    temp_password = secrets.token_urlsafe(8)  # Genera una contraseña segura de 8 caracteres

    # Verificar si el usuario ya existe
    existing_user = Usuario.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "El usuario ya existe"}), 400
    
    if Usuario.query.filter_by(username=email).first():
        return jsonify({"error": "El email ya está registrado"}), 400

    # Crear un nuevo usuario con el rol de manager
    new_user = Usuario(
        nombre=nombre,
        apellido=apellido,
        username=username,
        correo=email,
        contrasena=temp_password,
        id_empresa=id_empresa,
        id_superior=id_admin_emp  # Asociar el manager con la empresa del admin-emp
    )
    manager_role = Rol.query.filter_by(nombre="manager").first()

    if not manager_role:
        manager_role = Rol(nombre="Manager", permisos="permisos_manager", slug="manager")
        db.session.add(manager_role)
        db.session.commit()

    new_user.roles.append(manager_role)

    # Guardar el nuevo usuario en la base de datos
    db.session.add(new_user)
    db.session.commit()

    # Devolver las credenciales generadas
    return jsonify({
        "message": f"Manager '{username}' registrado exitosamente",
        "credentials": {
            "username": username,
            "password": temp_password
        },
        "empresa": {
            "id": id_empresa,
            "nombre": empresa.nombre  # Nombre de la empresa asociada
        }
    }), 201

@swag_from("../docs/admin-emp/configurar-preferencias.yml")
@admin_emp_bp.route("/configurar-preferencias", methods=["PUT"])
@role_required(["admin-emp"])
def configurar_preferencias():
    data = request.get_json()
    slogan = data.get("slogan")
    descripcion = data.get("descripcion")
    color_princ = data.get("color_princ")
    color_sec = data.get("color_sec")
    color_texto = data.get("color_texto")

    # Obtener el ID del admin-emp autenticado
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403

    id_empresa = admin_emp.id_empresa

    # Obtener las preferencias de la empresa
    preferencias = Preferencias_empresa.query.filter_by(id_empresa=id_empresa).first()

    # Si no existen preferencias, crearlas
    if not preferencias:
        preferencias = Preferencias_empresa(
            id_empresa=id_empresa,
            slogan=slogan,
            descripcion=descripcion,
            color_princ=color_princ,
            color_sec=color_sec,
            color_texto=color_texto
        )
        db.session.add(preferencias)
        return jsonify({
            "message": "Preferencias creadas exitosamente",
            "preferencias": {
                "id_empresa": id_empresa,
                "slogan": preferencias.slogan,
                "descripcion": preferencias.descripcion,
                "color_princ": preferencias.color_princ,
                "color_sec": preferencias.color_sec,
                "color_texto": preferencias.color_texto
            }
        }), 201

    # Actualizar las preferencias con los datos enviados
    preferencias.slogan = slogan
    preferencias.descripcion = descripcion
    preferencias.color_princ = color_princ
    preferencias.color_sec = color_sec
    preferencias.color_texto = color_texto
    db.session.commit()

    return jsonify({
        "message": "Preferencias actualizadas exitosamente",
        "preferencias": {
                "id_empresa": id_empresa,
                "slogan": preferencias.slogan,
                "descripcion": preferencias.descripcion,
                "color_princ": preferencias.color_princ,
                "color_sec": preferencias.color_sec,
                "color_texto": preferencias.color_texto
            }
    }), 200

UPLOAD_FOLDER = "uploads/logos"  # Carpeta donde se guardarán los logos
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Asegúrate de que la carpeta de uploads exista
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

UPLOAD_FOLDER_EMPLEADOS = os.path.join(os.getcwd(), "uploads", "registro_empleados")

if not os.path.exists(UPLOAD_FOLDER_EMPLEADOS):
    os.makedirs(UPLOAD_FOLDER_EMPLEADOS)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@swag_from("../docs/admin-emp/subir-logo.yml")
@admin_emp_bp.route("/subir-logo", methods=["POST"])
@role_required(["admin-emp"])
def subir_logo():
    # Obtener el ID del admin-emp autenticado
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403

    id_empresa = admin_emp.id_empresa
    empresa = Empresa.query.get(id_empresa)
    if not empresa:
        return jsonify({"error": "Empresa no encontrada"}), 404

    # Verificar si se envió un archivo
    if "file" not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files["file"]

    # Verificar si el archivo tiene un nombre válido y es una imagen permitida
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Formato de archivo no permitido. Solo se aceptan PNG, JPG y JPEG"}), 400

    # Guardar el archivo en el servidor
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, f"empresa_{id_empresa}_{filename}")
    file.save(filepath)

    # Actualizar el logo de la empresa en la base de datos
    empresa.logo_url = f"/{filepath}"
    db.session.commit()

    return jsonify({
        "message": "Logo subido exitosamente",
        "logo_url": empresa.logo_url
    }), 200

@swag_from("../docs/admin-emp/ver-certificado.yml")
@admin_emp_bp.route("/ver-certificado/<path:certificado_url>", methods=["GET"])
@role_required(["admin-emp"])
def ver_certificado(certificado_url):
    if not certificado_url:
        return jsonify({"error": "Certificado no encontrado"}), 404

    file_path = os.path.join(os.getcwd(), certificado_url)

    try:
        return send_file(file_path, as_attachment=False)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@admin_emp_bp.route("/subir-info-laboral-empleados", methods=["POST"])
@role_required(["admin-emp"])
def subir_info_laboral_empleados():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)

        file_path = os.path.join(UPLOAD_FOLDER_EMPLEADOS, filename)

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
        'id_empleado', 'desempeno_previo', 'cantidad_proyectos', 'tamano_equipo',
        'horas_extras', 'antiguedad', 'horas_capacitacion',
        'ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas'
    }

    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        if not required_fields.issubset(reader.fieldnames):
            return {"error": f"El archivo CSV debe tener las columnas: {', '.join(required_fields)}"}

        id_admin_emp = get_jwt_identity()
        admin_emp = Usuario.query.get(id_admin_emp)
        if not admin_emp or not admin_emp.id_empresa:
            return {"error": "El admin-emp no tiene una empresa asociada"}

        empleados_empresa = Usuario.query.filter_by(id_empresa=admin_emp.id_empresa).all()
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
                desempeno_previo = float(row['desempeno_previo'].strip())
                cantidad_proyectos = int(row['cantidad_proyectos'].strip())
                tamano_equipo = int(row['tamano_equipo'].strip())
                horas_extras = int(row['horas_extras'].strip())
                antiguedad = int(row['antiguedad'].strip())
                horas_capacitacion = int(row['horas_capacitacion'].strip())
                ausencias_injustificadas = int(row['ausencias_injustificadas'].strip())
                llegadas_tarde = int(row['llegadas_tarde'].strip())
                salidas_tempranas = int(row['salidas_tempranas'].strip())
            except Exception:
                return {"error": f"Datos numéricos inválidos para el empleado {id_empleado}"}

            rendimiento = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
            if rendimiento:
                rendimiento.desempeno_previo = desempeno_previo
                rendimiento.cantidad_proyectos = cantidad_proyectos
                rendimiento.tamano_equipo = tamano_equipo
                rendimiento.horas_extras = horas_extras
                rendimiento.antiguedad = antiguedad
                rendimiento.horas_capacitacion = horas_capacitacion
                rendimiento.ausencias_injustificadas = ausencias_injustificadas
                rendimiento.llegadas_tarde = llegadas_tarde
                rendimiento.salidas_tempranas = salidas_tempranas
                accion = "actualizado"
            else:
                rendimiento = RendimientoEmpleado(
                    id_usuario=id_empleado,
                    desempeno_previo=desempeno_previo,
                    cantidad_proyectos=cantidad_proyectos,
                    tamano_equipo=tamano_equipo,
                    horas_extras=horas_extras,
                    antiguedad=antiguedad,
                    horas_capacitacion=horas_capacitacion,
                    ausencias_injustificadas=ausencias_injustificadas,
                    llegadas_tarde=llegadas_tarde,
                    salidas_tempranas=salidas_tempranas
                )
                db.session.add(rendimiento)
                accion = "creado"

            try:
                datos_rend_futuro = {
                    "desempeno_previo": desempeno_previo,
                    "cantidad_proyectos": cantidad_proyectos,
                    "tamano_equipo": tamano_equipo,
                    "horas_extras": horas_extras,
                    "antiguedad": antiguedad,
                    "horas_capacitacion": horas_capacitacion
                }
                rendimiento.rendimiento_futuro_predicho = predecir_rend_futuro_individual(datos_rend_futuro)

                datos_rotacion = {
                    "ausencias_injustificadas": ausencias_injustificadas,
                    "llegadas_tarde": llegadas_tarde,
                    "salidas_tempranas": salidas_tempranas,
                    "desempeno_previo" : desempeno_previo
                }
                rendimiento.riesgo_rotacion_predicho = predecir_riesgo_rotacion_individual(datos_rotacion)

                datos_despido = {
                    "ausencias_injustificadas": ausencias_injustificadas,
                    "llegadas_tarde": llegadas_tarde,
                    "salidas_tempranas": salidas_tempranas,
                    "desempeno_previo": desempeno_previo,
                    'Riesgo de rotacion predicho': rendimiento.riesgo_rotacion_predicho,
                    'rendimiento_futuro_predicho': rendimiento.rendimiento_futuro_predicho
                }
                rendimiento.riesgo_despido_predicho = predecir_riesgo_despido_individual(datos_despido)

                datos_renuncia = {
                    "ausencias_injustificadas": ausencias_injustificadas,
                    "llegadas_tarde": llegadas_tarde,
                    "salidas_tempranas": salidas_tempranas,
                    "desempeno_previo": desempeno_previo,
                    'Riesgo de rotacion predicho': rendimiento.riesgo_rotacion_predicho,
                    'Riesgo de despido predicho': rendimiento.riesgo_despido_predicho,
                    'rendimiento_futuro_predicho': rendimiento.rendimiento_futuro_predicho
                }
                rendimiento.riesgo_renuncia_predicho = predecir_riesgo_renuncia_individual(datos_renuncia)

                nombre_empleado = Usuario.query.get(id_empleado).nombre
                nombre_empresa = Empresa.query.get(admin_emp.id_empresa).nombre
                nombre_admin = admin_emp.nombre
                mail_empleado = Usuario.query.get(id_empleado).correo

                if rendimiento.riesgo_rotacion_predicho == 'alto':
                    mensaje = f""""Estimado/a {nombre_empleado}, hemos identificado ciertos indicadores relacionados a tu desempeño. Nos gustaría conversar contigo para explorar oportunidades de mejora y alineación en tu desarrollo profesional. Quedamos a disposición para coordinar una reunión.
                                Atentamente,
                                {nombre_admin},
                                {nombre_empresa}"""
                    
                    crear_notificacion_uso_especifico(id_empleado, mensaje)
                    enviar_notificacion_empleado_riesgos(mail_empleado, mensaje)

                if rendimiento.rendimiento_futuro_predicho >= 7.5:
                    mensaje = f"""Estimado/a {nombre_empleado},

                                ¡Felicidades! Tu desempeño proyectado indica un alto rendimiento. 
                                Seguimos apostando a tu crecimiento y éxito en la empresa.
                                ¡Continúa así!

                                Atentamente,
                                {nombre_admin},
                                {nombre_empresa}"""
                    crear_notificacion_uso_especifico(id_empleado, mensaje)
                    enviar_notificacion_empleado_riesgos(mail_empleado, mensaje)

                db.session.flush()

            except Exception as e:
                print(f"Error al predecir para empleado {id_empleado}: {e}")

            resultado.append({
                "id_empleado": id_empleado,
                "accion": accion,
                "desempeno_previo": desempeno_previo,
                "cantidad_proyectos": cantidad_proyectos,
                "tamano_equipo": tamano_equipo,
                "horas_extras": horas_extras,
                "antiguedad": antiguedad,
                "horas_capacitacion": horas_capacitacion,
                "ausencias_injustificadas": ausencias_injustificadas,
                "llegadas_tarde": llegadas_tarde,
                "salidas_tempranas": salidas_tempranas,
                "rendimiento_futuro_predicho": rendimiento.rendimiento_futuro_predicho,
                "riesgo_rotacion_predicho": rendimiento.riesgo_rotacion_predicho,
                "riesgo_despido_predicho": rendimiento.riesgo_despido_predicho,
                "riesgo_renuncia_predicho": rendimiento.riesgo_renuncia_predicho
            })

        db.session.commit()
        return resultado
    
def crear_notificacion_uso_especifico(id_usuario, mensaje):
    notificacion = Notificacion(
        id_usuario=id_usuario,
        mensaje=mensaje,
    )
    db.session.add(notificacion)

def enviar_notificacion_empleado_riesgos(email_destino, cuerpo):
    try:
        asunto = "Proyección de Rendimiento"
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")


@swag_from("../docs/admin-emp/registrar-empleados.yml")
@admin_emp_bp.route("/registrar-empleados", methods=["POST"])
@role_required(["admin-emp"])
def registrar_empleados():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)

        file_path = os.path.join(UPLOAD_FOLDER_EMPLEADOS, filename)

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
    
@admin_emp_bp.route("/mis-empleados", methods=["GET"])
@role_required(["admin-emp"])
def obtener_empleados_a_cargo():
    id_admin_emp = get_jwt_identity()

    # Obtener el admin-emp autenticado
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp:
        return jsonify({"error": "Admin-emp no encontrado"}), 404

    # Obtener los empleados a cargo del admin-emp
    empleados = Usuario.query.filter_by(id_empresa=admin_emp.id_empresa).all()

    # Excepto él mismo
    empleados = [empleado for empleado in empleados if empleado.id != id_admin_emp]

    # Formatear los datos de los empleados
    resultado = [
        {
            "id": empleado.id,
            "nombre": empleado.nombre,
            "apellido": empleado.apellido,
        }
        for empleado in empleados
    ]

    return jsonify(resultado), 200

@admin_emp_bp.route("/empleado-<int:id_empleado>/informacion", methods=["GET"])
@role_required(["admin-emp"])
def obtener_informacion_empleado(id_empleado):
    # Obtener el empleado por su ID
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Que pertenezca a la misma empresa
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403
    if empleado.id_empresa != admin_emp.id_empresa:
        return jsonify({"error": "El empleado no pertenece a la misma empresa que el admin-emp"}), 403
    
    # Obtener el superior del empleado
    superior = Usuario.query.get(empleado.id_superior)
    if not superior:
        return jsonify({"error": "Superior no encontrado"}), 404

    # Formatear la respuesta
    resultado = {
        "username": empleado.username,
        "correo": empleado.correo,
        "activo": "Activo" if empleado.activo else "Inactivo",
        "superior": {
            "id": superior.id if superior else None,
            "nombre": superior.nombre if superior else None,
            "apellido": superior.apellido if superior else None,
        },
        "roles": [rol.slug for rol in empleado.roles]
    }

    return jsonify(resultado), 200

@admin_emp_bp.route("/empleado-<int:id_empleado>/detalles-laborales", methods=["GET"])
@role_required(["admin-emp"])
def obtener_detalles_laborales_empleado(id_empleado):
    # Obtener el empleado por su ID
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Que pertenezca a la misma empresa
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403
    if empleado.id_empresa != admin_emp.id_empresa:
        return jsonify({"error": "El empleado no pertenece a la misma empresa que el admin-emp"}), 403

    # Verificar si el empleado tiene detalles laborales cargados
    detalles_laborales = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
    if not detalles_laborales:
        return jsonify({"error": "Este empleado no tiene detalles laborales cargados/asociados"}), 404

    # Formatear la respuesta con los detalles laborales
    resultado = {
        "detalles_laborales": {
            "desempeno_previo": detalles_laborales.desempeno_previo,
            "cantidad_proyectos": detalles_laborales.cantidad_proyectos,
            "tamano_equipo": detalles_laborales.tamano_equipo,
            "horas_extras": detalles_laborales.horas_extras,
            "antiguedad": detalles_laborales.antiguedad,
            "horas_capacitacion": detalles_laborales.horas_capacitacion,
            "ausencias_injustificadas": detalles_laborales.ausencias_injustificadas,
            "llegadas_tarde": detalles_laborales.llegadas_tarde,
            "salidas_tempranas": detalles_laborales.salidas_tempranas,
        },
    }

    return jsonify(resultado), 200

@admin_emp_bp.route("/empleado-<int:id_empleado>/rendimiento-futuro", methods=["GET"])
@role_required(["admin-emp"])
def obtener_rendimiento_futuro_empleado(id_empleado):
    # Obtener el empleado por su ID
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Que pertenezca a la misma empresa
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403
    if empleado.id_empresa != admin_emp.id_empresa:
        return jsonify({"error": "El empleado no pertenece a la misma empresa que el admin-emp"}), 403

    # Verificar si el empleado tiene detalles laborales cargados
    detalles_laborales = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
    if not detalles_laborales:
        return jsonify({"error": "Este empleado no tiene detalles laborales cargados/asociados"}), 404

    # Leer el valor ya calculado y guardado
    resultado = {
        "rendimiento_futuro": detalles_laborales.rendimiento_futuro_predicho,
        "clasificacion_rendimiento": getattr(detalles_laborales, "clasificacion_rendimiento", None)
    }

    return jsonify(resultado), 200

@admin_emp_bp.route("/empleado-<int:id_empleado>/riesgo_rotacion", methods=["GET"])
@role_required(["admin-emp"])
def obtener_riesgo_rotacion_empleado(id_empleado):
    # Obtener el empleado por su ID
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Que pertenezca a la misma empresa
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403
    if empleado.id_empresa != admin_emp.id_empresa:
        return jsonify({"error": "El empleado no pertenece a la misma empresa que el admin-emp"}), 403

    # Verificar si el empleado tiene detalles laborales cargados
    detalles_laborales = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
    if not detalles_laborales:
        return jsonify({"error": "Este empleado no tiene detalles laborales cargados/asociados"}), 404

    resultado = {
        "riesgo_rotacion_predicho": detalles_laborales.riesgo_rotacion_predicho
    }

    return jsonify(resultado), 200

@admin_emp_bp.route("/empleado-<int:id_empleado>/riesgo_despido", methods=["GET"])
@role_required(["admin-emp"])
def obtener_riesgo_despido_empleado(id_empleado):
    # Obtener el empleado por su ID
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Que pertenezca a la misma empresa
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403
    if empleado.id_empresa != admin_emp.id_empresa:
        return jsonify({"error": "El empleado no pertenece a la misma empresa que el admin-emp"}), 403

    # Verificar si el empleado tiene detalles laborales cargados
    detalles_laborales = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
    if not detalles_laborales:
        return jsonify({"error": "Este empleado no tiene detalles laborales cargados/asociados"}), 404

    resultado = {
        "riesgo_despido_predicho": detalles_laborales.riesgo_despido_predicho
    }

    return jsonify(resultado), 200

@admin_emp_bp.route("/empleado-<int:id_empleado>/riesgo_renuncia", methods=["GET"])
@role_required(["admin-emp"])
def obtener_riesgo_renuncia_empleado(id_empleado):
    # Obtener el empleado por su ID
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Que pertenezca a la misma empresa
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403
    if empleado.id_empresa != admin_emp.id_empresa:
        return jsonify({"error": "El empleado no pertenece a la misma empresa que el admin-emp"}), 403

    # Verificar si el empleado tiene detalles laborales cargados
    detalles_laborales = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
    if not detalles_laborales:
        return jsonify({"error": "Este empleado no tiene detalles laborales cargados/asociados"}), 404

    resultado = {
        "riesgo_renuncia_predicho": detalles_laborales.riesgo_renuncia_predicho
    }

    return jsonify(resultado), 200

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv'}

def validar_nombre(nombre: str) -> bool:
    # Solo letras (mayúsculas/minúsculas), espacios y letras acentuadas comunes
    return re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$", nombre) is not None

# @swag_from("../docs/admin-emp/licencias-solicitadas.yml")
# @admin_emp_bp.route("/licencias-solicitadas-admin-emp", methods=["GET"])
# @role_required(["admin-emp"])
# def visualizar_licencias():
#     id_admin_emp = get_jwt_identity()
#     admin_emp = Usuario.query.filter_by(id=id_admin_emp).first()
#     empresa = Empresa.query.filter_by(id=admin_emp.id_empresa).first()

#     licencias = Licencia.query.filter_by(id_empresa=empresa.id).all()

#     resultado = []
#     for licencia in licencias:
#         empleado = Usuario.query.filter_by(id=licencia.id_empleado).first()
#         if (
#             empleado.id_superior == admin_emp.id
#             and empleado.id_empresa == admin_emp.id_empresa
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

# @swag_from("../docs/admin-emp/licencias-solicitadas.yml")
# @admin_emp_bp.route("/licencias-mis-managers", methods=["GET"])
# @role_required(["admin-emp"])
# def visualizar_licencias():
#     id_admin_emp = get_jwt_identity()
#     admin_emp = Usuario.query.filter_by(id=id_admin_emp).first()
#     empresa = Empresa.query.filter_by(id=admin_emp.id_empresa).first()

#     # Obtener solo los managers de la empresa
#     managers = (
#         db.session.query(Usuario)
#         .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
#         .join(Rol, UsuarioRol.id_rol == Rol.id)
#         .filter(Usuario.id_empresa == empresa.id)
#         .filter(Rol.slug == "manager")
#         .all()
#     )
#     ids_managers = {m.id for m in managers}

#     # Filtrar licencias solo de managers
#     licencias = Licencia.query.filter(
#         Licencia.id_empresa == empresa.id,
#         Licencia.id_empleado.in_(ids_managers)
#     ).all()

#     resultado = []
#     for licencia in licencias:
#         empleado = Usuario.query.filter_by(id=licencia.id_empleado).first()
#         if empleado:
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

# @swag_from("../docs/admin-emp/licencia-detalle.yml")
# @admin_emp_bp.route("/licencia-<int:id_licencia>-manager/informacion", methods=["GET"])
# @role_required(["admin-emp"])
# def obtener_detalle_licencia(id_licencia):
#     id_admin_emp = get_jwt_identity()
#     admin_emp = Usuario.query.get(id_admin_emp)
#     licencia = Licencia.query.get(id_licencia)
#     if not licencia:
#         return jsonify({"error": "Licencia no encontrada"}), 404

#     empleado = Usuario.query.get(licencia.id_empleado)
#     if not empleado:
#         return jsonify({"error": "Empleado no encontrado"}), 404

#     # Solo puede ver si la licencia es de su empresa o de un empleado a su cargo
#     if licencia.id_empresa != admin_emp.id_empresa and empleado.id_superior != admin_emp.id:
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

# @swag_from("../docs/admin-emp/evaluar-licencia.yml")
# @admin_emp_bp.route("/licencia-<int:id_licencia>-manager/evaluacion", methods=["PUT"])
# @role_required(["admin-emp"])
# def eval_licencia(id_licencia):
#     data = request.get_json()
#     nuevo_estado = data.get("estado")  # "aprobada" o "rechazada"
#     motivo = data.get("motivo")

#     if nuevo_estado not in ["aprobada", "rechazada"]:
#         return jsonify({"error": "El estado debe ser 'aprobada' o 'rechazada'"}), 400

#     id_admin_emp = get_jwt_identity()
#     admin_emp = Usuario.query.get(id_admin_emp)
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
#     if licencia.id_empresa != admin_emp.id_empresa and empleado.id_superior != admin_emp.id:
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

# @swag_from("../docs/admin-emp/evaluar-licencia.yml")
# @admin_emp_bp.route("/evaluar-licencia-empleado/<int:id_licencia>", methods=["PUT"])
# @role_required(["admin-emp"])
# def evaluar_licencia(id_licencia):
#     # Obtener los datos enviados en la solicitud
#     data = request.get_json()
#     nuevo_estado = data.get("estado")  # "aprobado" o "rechazado"
#     motivo = data.get("motivo")

#     if nuevo_estado not in ["aprobada", "rechazada", "activa"]:
#         return jsonify(
#             {"error": "El estado debe ser 'aprobada', 'rechazada' o 'activa'"}
#         ), 400

#     # Obtener el ID del manager autenticado
#     id_admin_emp = get_jwt_identity()
#     admin_emp = Usuario.query.get(id_admin_emp)

#     # Verificar que la licencia pertenece a la empresa del manager
#     licencia = Licencia.query.get(id_licencia)
#     if not licencia:
#         return jsonify({"error": "Licencia no encontrada"}), 404

#     empleado = Usuario.query.get(licencia.id_empleado)

#     if licencia.id_empresa != admin_emp.id_empresa and empleado.id_superior != admin_emp.id:
#         return jsonify({"error": "No tienes permiso para evaluar esta licencia"}), 403

#     empresa = Empresa.query.get(licencia.id_empresa)

#     if licencia.estado == "pendiente":
#         if nuevo_estado in ["aprobada", "rechazada"]:
#             licencia.estado = nuevo_estado

#             if motivo:
#                 licencia.motivo_rechazo = motivo

#             db.session.commit()
#             return jsonify(
#                 {
#                     "message": f"Licencia {nuevo_estado} exitosamente",
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
#                         "motivo_rechazo": licencia.motivo_rechazo if licencia.motivo_rechazo else "-",
#                         "descripcion": licencia.descripcion,
#                         "fecha_inicio": licencia.fecha_inicio.isoformat()
#                         if licencia.fecha_inicio
#                         else None,
#                         "estado": licencia.estado,
#                         "empresa": {
#                             "id": licencia.id_empresa,
#                             "nombre": empresa.nombre,
#                         },
#                         "certificado_url": licencia.certificado_url
#                         if licencia.certificado_url
#                         else None,
#                     },
#                 }
#             ), 200
#     elif (
#         licencia.estado == "aprobada"
#         and nuevo_estado == "activa"
#         and licencia.certificado_url
#     ):
#         licencia.estado = nuevo_estado
#         empleado.activo = False
#         db.session.commit()
#         return jsonify(
#             {
#                 "message": f"Licencia en estado {nuevo_estado} exitosa",
#                 "licencia": {
#                     "id_licencia": licencia.id,
#                     "empleado": {
#                         "id": licencia.id_empleado,
#                         "nombre": empleado.nombre,
#                         "apellido": empleado.apellido,
#                         "username": empleado.username,
#                         "email": empleado.correo,
#                         "estado": "Inactivo" if empleado.activo == False else "Activo"
#                     },
#                     "tipo": licencia.tipo,
#                     "descripcion": licencia.descripcion,
#                     "fecha_inicio": licencia.fecha_inicio.isoformat()
#                     if licencia.fecha_inicio
#                     else None,
#                     "estado": licencia.estado,
#                     "empresa": {"id": licencia.id_empresa, "nombre": empresa.nombre},
#                 },
#             }
#         ), 200
        

@admin_emp_bp.route("/empleados-rendimiento", methods=["GET"])
@role_required(["admin-emp"])
def obtener_empleados_rendimiento_futuro():
    try:
        id_admin_emp = get_jwt_identity()

        admin_emp = Usuario.query.get(id_admin_emp)

        if not admin_emp or not admin_emp.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        empleados = (
            db.session.query(Usuario, RendimientoEmpleado)
            .join(RendimientoEmpleado, Usuario.id == RendimientoEmpleado.id_usuario)
            .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
            .join(Rol, UsuarioRol.id_rol == Rol.id)
            .filter(Usuario.id_empresa == admin_emp.id_empresa)
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
                "cantidad_proyectos": rendimiento.cantidad_proyectos,
                "tamano_equipo": rendimiento.tamano_equipo,
                "horas_extras": rendimiento.horas_extras,
                "antiguedad": rendimiento.antiguedad,
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
    

@admin_emp_bp.route("/empleados-riesgo", methods=["GET"])
@role_required(["admin-emp"])
def obtener_empleados_riesgo_futuro():
    try:
        id_admin = get_jwt_identity()

        admin = Usuario.query.get(id_admin)

        if not admin or not admin.id_empresa:
            return jsonify({"error": "No tienes una empresa asociada"}), 404

        empleados = (
            db.session.query(Usuario, RendimientoEmpleado)
            .join(RendimientoEmpleado, Usuario.id == RendimientoEmpleado.id_usuario)
            .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
            .join(Rol, UsuarioRol.id_rol == Rol.id)
            .filter(Usuario.id_empresa == admin.id_empresa)
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
                "antiguedad": rendimiento.antiguedad,
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
        print(f"Error en /empleados-riesgo: {e}")
        return jsonify({"error": str(e)}), 500
    
    
@admin_emp_bp.route("/obtener-mail-empresa")
@role_required(["admin-emp"])
def obtener_mail_empresa():
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "No tienes una empresa asociada"}), 404

    empresa = Empresa.query.get(admin_emp.id_empresa)
    if not empresa:
        return jsonify({"error": "Empresa no encontrada"}), 404

    return jsonify({
        "email": empresa.email
    }), 200
    
@admin_emp_bp.route("/cambiar-mail-empresa", methods=["PUT"])
@role_required(["admin-emp"])
def cambiar_mail_empresa():
    data = request.get_json()
    nuevo_email = data.get("nuevo_email")

    if not nuevo_email:
        return jsonify({"error": "El nuevo email es requerido"}), 400

    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, nuevo_email):
        return jsonify({"error": "Formato de email no valido"}), 400

    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "No tienes una empresa asociada"}), 404

    empresa = Empresa.query.get(admin_emp.id_empresa)
    if not empresa:
        return jsonify({"error": "Empresa no encontrada"}), 404

    empresa.email = nuevo_email
    db.session.commit()

    return jsonify({
        "message": "Email de la empresa actualizado exitosamente",
        "nuevo_email": nuevo_email
    }), 200

@admin_emp_bp.route("/notificar-bajo-rendimiento/<int:id_empleado>", methods=["POST"])
@role_required(["admin-emp"])
def notificar_bajo_rendimiento(id_empleado):
    data = request.get_json()

    if not id_empleado:
        return jsonify({"error": "El ID del empleado es requerido"}), 400

    # Obtener el admin-emp autenticado
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "No tienes una empresa asociada"}), 404

    # Obtener el empleado
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Verificar que el empleado pertenece a la misma empresa
    if empleado.id_empresa != admin_emp.id_empresa:
        return jsonify({"error": "No tienes permiso para notificar a este empleado"}), 403

    mensaje = "Tu proyección de rendimiento ha sido clasificada como 'Bajo Rendimiento'. Te invitamos a que tomes las medidas necesarias para mejorar tu desempeño. Si tienes alguna duda, no dudes en contactar a tu superior."

    crear_notificacion(id_empleado, mensaje)

    enviar_notificacion_empleado(empleado.correo, admin_emp.id_empresa, mensaje)

    # Enviar la notificación (aquí puedes implementar la lógica para enviar el correo)
    # send_email(empleado.correo, "Notificación de Bajo Rendimiento", mensaje)

    return jsonify({
        "message": f"Notificación enviada al empleado {empleado.nombre} {empleado.apellido}"
    }), 200

def enviar_notificacion_empleado(email_destino, nombre_empresa, cuerpo):
    try:
        asunto = "Proyección de Rendimiento"
        cuerpo = f"Nos comunicamos desde {nombre_empresa}. " + cuerpo
        msg = Message(asunto, recipients=[email_destino])
        msg.body = cuerpo
        mail.send(msg)
        print(f"Correo enviado correctamente a {email_destino}")
    except Exception as e:
        print(f"Error al enviar correo a {email_destino}: {e}")
        
        
@admin_emp_bp.route("/notificaciones-admin-emp-no-leidas", methods=["GET"])
@role_required(["admin-emp"])
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



@admin_emp_bp.route("/leer-notificacion-admin-emp/<int:id_notificacion>", methods=["PUT"])
@role_required(["admin-emp"])
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
    

@admin_emp_bp.route("/notificaciones-admin-emp-no-leidas-contador", methods=["GET"])
@role_required(["admin-emp"])
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
    
@admin_emp_bp.route("/modificar-dias-licencias", methods=["PUT"])
@role_required(["admin-emp"])
def modificar_dias_licencias():
    """
    Permite al admin-emp modificar los días por defecto de licencias de su empresa.
    Solo puede aumentar los días respecto al mínimo legal.
    """
    data = request.get_json()
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "No tienes una empresa asociada"}), 403

    empresa = Empresa.query.get(admin_emp.id_empresa)
    if not empresa:
        return jsonify({"error": "Empresa no encontrada"}), 404

    # Definir los mínimos legales
    minimos = {
        "dias_maternidad": 90,
        "dias_nac_hijo": 10,
        "dias_duelo": 5,
        "dias_matrimonio": 10,
        "dias_mudanza": 2,
        "dias_estudios": 10
    }

    # Validar y actualizar cada campo si corresponde
    cambios = {}
    for campo, minimo in minimos.items():
        nuevo_valor = data.get(campo)
        if nuevo_valor is not None:
            try:
                nuevo_valor = int(nuevo_valor)
            except Exception:
                return jsonify({"error": f"El valor de {campo} debe ser un número entero"}), 400
            if nuevo_valor < minimo:
                return jsonify({"error": f"{campo} no puede ser menor a {minimo} días (mínimo legal)"}), 400
            setattr(empresa, campo, nuevo_valor)
            cambios[campo] = nuevo_valor

    if not cambios:
        return jsonify({"error": "No se enviaron campos válidos para modificar"}), 400

    db.session.commit()

    return jsonify({
        "message": "Días de licencias modificados correctamente",
        "cambios": cambios
    }), 200

@admin_emp_bp.route("/licencias-mis-managers", methods=["GET"])
@role_required(["admin-emp"])
def visualizar_licencias_managers():
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.filter_by(id=id_admin_emp).first()
    empresa = Empresa.query.filter_by(id=admin_emp.id_empresa).first()

    # Managers de la empresa
    empleados = (
        db.session.query(Usuario)
        .join(UsuarioRol, Usuario.id == UsuarioRol.id_usuario)
        .join(Rol, UsuarioRol.id_rol == Rol.id)
        .filter(
            Usuario.id_empresa == empresa.id,
            Rol.slug == "manager"
        )
        .all()
    )
    ids_empleados = {e.id for e in empleados}

    # Filtrar licencias solo de estos managers
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

@admin_emp_bp.route("/licencia-<int:id_licencia>-manager/informacion", methods=["GET"])
@role_required(["admin-emp"])
def obtener_detalle_licencia(id_licencia):
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    # Verificar que el usuario tiene rol "manager"
    tiene_rol_manager = (
        db.session.query(Rol)
        .join(UsuarioRol, UsuarioRol.id_rol == Rol.id)
        .filter(UsuarioRol.id_usuario == empleado.id, Rol.slug == "manager")
        .first()
    )

    # Solo puede ver si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != admin_emp.id_empresa and not tiene_rol_manager:
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

@admin_emp_bp.route("/licencia-<int:id_licencia>-manager/evaluacion", methods=["PUT"])
@role_required(["admin-emp"])
def eval_licencia(id_licencia):
    data = request.get_json()
    nuevo_estado = data.get("estado")  # "aprobada" o "rechazada"
    motivo = data.get("motivo")
    fecha_inicio_sugerida = data.get("fecha_inicio_sugerida")
    fecha_fin_sugerida = data.get("fecha_fin_sugerida")

    if nuevo_estado not in ["aprobada", "rechazada", "sugerencia"]:
        return jsonify({"error": "El estado debe ser 'aprobada', 'rechazada' o 'sugerencia'"}), 400

    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    
    rol_manager = (
        db.session.query(Rol)
        .join(UsuarioRol, UsuarioRol.id_rol == Rol.id)
        .filter(UsuarioRol.id_usuario == empleado.id, Rol.slug == "manager")
        .first()
    )

    # Permitir aprobar si la licencia está pendiente o si la sugerencia fue aceptada
    puede_aprobar = (
        (licencia.estado == "pendiente" and licencia.tipo in ["vacaciones"])
        or (licencia.estado == "pendiente" and licencia.estado_sugerencia == "sugerencia aceptada")
        or (licencia.estado == "sugerencia" and licencia.estado_sugerencia == "sugerencia aceptada")
    )

    # Solo puede evaluar licencias de vacaciones o estudio en estado pendiente
    # if licencia.estado != "pendiente" or licencia.tipo not in ["vacaciones"]:
    #     return jsonify({"error": "Solo puedes evaluar licencias de vacaciones pendientes"}), 403

    # Solo puede evaluar si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != admin_emp.id_empresa and not rol_manager:
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
    else:
        licencia.estado = nuevo_estado
        if motivo:
            licencia.motivo_rechazo = motivo

    db.session.commit()

    empresa = Empresa.query.get(licencia.id_empresa)

    return jsonify({
        "message": message,
        # "message": f"Licencia {nuevo_estado} exitosamente",
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