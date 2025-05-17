from flask import Blueprint, jsonify, request, send_file
from auth.decorators import role_required
from models.schemes import Usuario, Rol, Empresa, Preferencias_empresa, Licencia, RendimientoEmpleado, UsuarioRol, RendimientoEmpleado
from models.extensions import db
import secrets
from flask_jwt_extended import get_jwt_identity, jwt_required
import os
from werkzeug.utils import secure_filename
import re
from flasgger import swag_from
import csv
from .candidato import allowed_image
from ml.desempeñoYdesarrollo.predictions import predecir_rend_futuro, predecir_rend_futuro_individual
import pandas as pd
from .notificacion import crear_notificacion
from flask_mail import Message
from models.extensions import mail

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
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        required_fields = {'id_empleado', 'desempeno_previo', 'cantidad_proyectos', 'tamano_equipo',
                           'horas_extras', 'antiguedad', 'horas_capacitacion'}
        
        resultado = []
        for row in reader:
            if not required_fields.issubset(row.keys()):
                return {"error": "El archivo CSV no contiene las columnas requeridas: id_empleado, desempeno_previo, cantidad_proyectos, tamano_equipo, horas_extras, antiguedad, horas_capacitacion"}
    
            id_empleado = int(row['id_empleado'].strip())
            desempeno_previo = float(row['desempeno_previo'].strip())
            cantidad_proyectos = int(row['cantidad_proyectos'].strip())
            tamano_equipo = int(row['tamano_equipo'].strip())
            horas_extras = int(row['horas_extras'].strip())
            antiguedad = int(row['antiguedad'].strip())
            horas_capacitacion = int(row['horas_capacitacion'].strip())
            
            if not Usuario.query.get(id_empleado):
                return {"error": f"El empleado con ID {id_empleado} no existe"}
            
            id_admin_emp = get_jwt_identity()
            admin_emp = Usuario.query.get(id_admin_emp)
            if not admin_emp or not admin_emp.id_empresa:
                return {"error": "El admin-emp no tiene una empresa asociada"}
            
            rendimiento_existente = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
            
            if rendimiento_existente:
                rendimiento_existente.desempeno_previo = desempeno_previo
                rendimiento_existente.cantidad_proyectos = cantidad_proyectos
                rendimiento_existente.tamano_equipo = tamano_equipo
                rendimiento_existente.horas_extras = horas_extras
                rendimiento_existente.antiguedad = antiguedad
                rendimiento_existente.horas_capacitacion = horas_capacitacion
                
                resultado.append({
                    "id_empleado": id_empleado,
                    "accion": "actualizado",
                    "desempeno_previo": desempeno_previo,
                    "cantidad_proyectos": cantidad_proyectos,
                    "tamano_equipo": tamano_equipo,
                    "horas_extras": horas_extras,
                    "antiguedad": antiguedad,
                    "horas_capacitacion": horas_capacitacion
                })
            else:
                new_employee_performance = RendimientoEmpleado (
                    id_usuario=id_empleado,
                    desempeno_previo=desempeno_previo,
                    cantidad_proyectos=cantidad_proyectos,
                    tamano_equipo=tamano_equipo,
                    horas_extras=horas_extras,
                    antiguedad=antiguedad,
                    horas_capacitacion=horas_capacitacion
                )
                
                db.session.add(new_employee_performance)
                
                resultado.append({
                    "id_empleado": id_empleado,
                    "accion": "creado",
                    "desempeno_previo": desempeno_previo,
                    "cantidad_proyectos": cantidad_proyectos,
                    "tamano_equipo": tamano_equipo,
                    "horas_extras": horas_extras,
                    "antiguedad": antiguedad,
                    "horas_capacitacion": horas_capacitacion
                })

        db.session.commit()
        return resultado
    
    
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
        required_fields = {'nombre', 'apellido', 'email', 'username', 'contrasena'}
        
        resultado = []

        for row in reader:
            if not required_fields.issubset(row.keys()):
                # Devuelve un diccionario con el error
                return {"error": "El archivo CSV no contiene las columnas requeridas: nombre, apellido, email, username, contrasena"}

            nombre = row['nombre'].strip()
            apellido = row['apellido'].strip()
            email = row['email'].strip()
            username = row['username'].strip()
            contrasena = row['contrasena'].strip()
            

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
                id_superior=admin_emp.id
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

    # Obtener el superior del empleado
    superior = Usuario.query.get(empleado.id_superior)

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
        },
    }

    return jsonify(resultado), 200

@admin_emp_bp.route("/empleado-<int:id_empleado>/rendimiento-futuro", methods=["GET"])
@role_required(["admin-emp"])
def predecir_rendimiento_futuro_empleado(id_empleado):
    # Obtener el empleado por su ID
    empleado = Usuario.query.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Verificar si el empleado tiene detalles laborales cargados
    detalles_laborales = RendimientoEmpleado.query.filter_by(id_usuario=id_empleado).first()
    if not detalles_laborales:
        return jsonify({"error": "Este empleado no tiene detalles laborales cargados/asociados"}), 404

    # Preparar los datos para la predicción
    datos_empleado = {
        "desempeno_previo": detalles_laborales.desempeno_previo,
        "cantidad_proyectos": detalles_laborales.cantidad_proyectos,
        "tamano_equipo": detalles_laborales.tamano_equipo,
        "horas_extras": detalles_laborales.horas_extras,
        "antiguedad": detalles_laborales.antiguedad,
        "horas_capacitacion": detalles_laborales.horas_capacitacion,
    }

    # Realizar la predicción utilizando la función predecir_rend_futuro_individual
    try:
        rendimiento_futuro = predecir_rend_futuro_individual(datos_empleado)
    except Exception as e:
        return jsonify({"error": f"Error al predecir el rendimiento futuro: {str(e)}"}), 500

    # Formatear la respuesta
    resultado = {
        "rendimiento_futuro": rendimiento_futuro,
    }

    return jsonify(resultado), 200

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv'}

def validar_nombre(nombre: str) -> bool:
    # Solo letras (mayúsculas/minúsculas), espacios y letras acentuadas comunes
    return re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$", nombre) is not None

@swag_from("../docs/admin-emp/licencias-solicitadas.yml")
@admin_emp_bp.route("/licencias-solicitadas", methods=["GET"])
@role_required(["admin-emp"])
def visualizar_licencias():
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.filter_by(id=id_admin_emp).first()
    empresa = Empresa.query.filter_by(id=admin_emp.id_empresa).first()

    licencias = Licencia.query.filter_by(id_empresa=empresa.id).all()

    resultado = []
    for licencia in licencias:
        empleado = Usuario.query.filter_by(id=licencia.id_empleado).first()
        if (
            empleado.id_superior == admin_emp.id
            and empleado.id_empresa == admin_emp.id_empresa
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
                        "descripcion": licencia.descripcion,
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

@swag_from("../docs/admin-emp/licencia-detalle.yml")
@admin_emp_bp.route("/licencia-<int:id_licencia>/informacion", methods=["GET"])
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

    # Solo puede ver si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != admin_emp.id_empresa and empleado.id_superior != admin_emp.id:
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

@swag_from("../docs/admin-emp/evaluar-licencia.yml")
@admin_emp_bp.route("/licencia-<int:id_licencia>/evaluacion", methods=["PUT"])
@role_required(["admin-emp"])
def eval_licencia(id_licencia):
    data = request.get_json()
    nuevo_estado = data.get("estado")  # "aprobada" o "rechazada"
    motivo = data.get("motivo")

    if nuevo_estado not in ["aprobada", "rechazada"]:
        return jsonify({"error": "El estado debe ser 'aprobada' o 'rechazada'"}), 400

    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Solo puede evaluar licencias de vacaciones o estudio en estado pendiente
    if licencia.estado != "pendiente" or licencia.tipo not in ["vacaciones", "estudio"]:
        return jsonify({"error": "Solo puedes evaluar licencias de vacaciones o estudio en estado pendiente"}), 403

    # Solo puede evaluar si la licencia es de su empresa o de un empleado a su cargo
    if licencia.id_empresa != admin_emp.id_empresa and empleado.id_superior != admin_emp.id:
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

@swag_from("../docs/admin-emp/evaluar-licencia.yml")
@admin_emp_bp.route("/evaluar-licencia-empleado/<int:id_licencia>", methods=["PUT"])
@role_required(["admin-emp"])
def evaluar_licencia(id_licencia):
    # Obtener los datos enviados en la solicitud
    data = request.get_json()
    nuevo_estado = data.get("estado")  # "aprobado" o "rechazado"
    motivo = data.get("motivo")

    if nuevo_estado not in ["aprobada", "rechazada", "activa"]:
        return jsonify(
            {"error": "El estado debe ser 'aprobada', 'rechazada' o 'activa'"}
        ), 400

    # Obtener el ID del manager autenticado
    id_admin_emp = get_jwt_identity()
    admin_emp = Usuario.query.get(id_admin_emp)

    # Verificar que la licencia pertenece a la empresa del manager
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)

    if licencia.id_empresa != admin_emp.id_empresa and empleado.id_superior != admin_emp.id:
        return jsonify({"error": "No tienes permiso para evaluar esta licencia"}), 403

    empresa = Empresa.query.get(licencia.id_empresa)

    if licencia.estado == "pendiente":
        if nuevo_estado in ["aprobada", "rechazada"]:
            licencia.estado = nuevo_estado

            if motivo:
                licencia.motivo_rechazo = motivo

            db.session.commit()
            return jsonify(
                {
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
                        "fecha_inicio": licencia.fecha_inicio.isoformat()
                        if licencia.fecha_inicio
                        else None,
                        "estado": licencia.estado,
                        "empresa": {
                            "id": licencia.id_empresa,
                            "nombre": empresa.nombre,
                        },
                        "certificado_url": licencia.certificado_url
                        if licencia.certificado_url
                        else None,
                    },
                }
            ), 200
    elif (
        licencia.estado == "aprobada"
        and nuevo_estado == "activa"
        and licencia.certificado_url
    ):
        licencia.estado = nuevo_estado
        empleado.activo = False
        db.session.commit()
        return jsonify(
            {
                "message": f"Licencia en estado {nuevo_estado} exitosa",
                "licencia": {
                    "id_licencia": licencia.id,
                    "empleado": {
                        "id": licencia.id_empleado,
                        "nombre": empleado.nombre,
                        "apellido": empleado.apellido,
                        "username": empleado.username,
                        "email": empleado.correo,
                        "estado": "Inactivo" if empleado.activo == False else "Activo"
                    },
                    "tipo": licencia.tipo,
                    "descripcion": licencia.descripcion,
                    "fecha_inicio": licencia.fecha_inicio.isoformat()
                    if licencia.fecha_inicio
                    else None,
                    "estado": licencia.estado,
                    "empresa": {"id": licencia.id_empresa, "nombre": empresa.nombre},
                },
            }
        ), 200
        

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
                "horas_capacitacion": rendimiento.horas_capacitacion
            })

        df = pd.DataFrame(datos_empleados)

        if df.empty:
            print("El DataFrame está vacío. No se encontraron datos para predecir.")
            return jsonify({"error": "No se encontraron empleados con datos suficientes para predecir"}), 404

        df_predicho = predecir_rend_futuro(df)

        if df_predicho is None:
            print("El DataFrame predicho es None. Algo falló en la predicción.")
            return jsonify({"error": "Error al realizar la predicción"}), 500
        
        def clasificar_rendimiento(valor):
            if valor >= 7.5:
                return "Alto Rendimiento"
            elif valor >= 5:
                return "Medio Rendimiento"
            else:
                return "Bajo Rendimiento"

        df_predicho['clasificacion'] = df_predicho['rendimiento_futuro_predicho'].apply(clasificar_rendimiento)

        resumen_rendimiento = {
            "alto_rendimiento": len(df_predicho[df_predicho['clasificacion'] == "Alto Rendimiento"]),
            "medio_rendimiento": len(df_predicho[df_predicho['clasificacion'] == "Medio Rendimiento"]),
            "bajo_rendimiento": len(df_predicho[df_predicho['clasificacion'] == "Bajo Rendimiento"])
        }

        return jsonify({
            "message": "Datos cargados correctamente",
            "empleados": df_predicho.to_dict(orient='records'),
            "resumen_riesgo": resumen_rendimiento
        }), 200

    except Exception as e:
        print(f"Error en /empleados-rendimiento: {e}")
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