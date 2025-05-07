from flask import Blueprint, jsonify, request
from auth.decorators import role_required
from models.schemes import Usuario, Rol, Empresa, Preferencias_empresa
from models.extensions import db
import secrets
from flask_jwt_extended import get_jwt_identity, jwt_required
import os
from werkzeug.utils import secure_filename
import re
from flasgger import swag_from
import csv


admin_emp_bp = Blueprint("admin_emp", __name__)

@admin_emp_bp.route("/admin-emp-home", methods=["GET"])
@role_required(["admin-emp"])
def admin_emp_home():
    return jsonify({"message": "Bienvenido al Inicio de Admin-emp"}), 200

@swag_from("../docs/admin-emp/preferencias.yml")
@admin_emp_bp.route("/empresa/<int:id_empresa>/preferencias", methods=["GET", "PUT"])
@role_required(["admin-emp"])
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
        file_path = os.path.join("uploads/registro_empleados", filename)
        file.save(file_path)

        try:
            register_employees_from_csv(file_path)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid file format'}), 400

def register_employees_from_csv(file_path):
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        required_fields = {'nombre', 'apellido', 'email', 'username'}
        
        resultado = []

        for row in reader:
            # Validar que todas las columnas requeridas estén presentes
            if not required_fields.issubset(row.keys()):
                return jsonify({"error": "El archivo CSV no contiene las columnas requeridas: nombre, apellido, email, username"}), 400

            nombre = row['nombre'].strip()
            apellido = row['apellido'].strip()
            email = row['email'].strip()
            username = row['username'].strip()

            # Validar los datos
            if not validar_nombre(nombre) or not validar_nombre(apellido):
                return jsonify({"error": "Nombre o apellido no válido"}), 400
            
            email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
            if not re.match(email_regex, email):
                return jsonify({"error": "Formato de email no válido"}), 400

            # Verificar si el usuario ya existe
            existing_user = Usuario.query.filter_by(username=username).first()
            if existing_user:
                return jsonify({"error": f"El usuario '{username}' ya existe"}), 400
            
            id_admin_emp = get_jwt_identity()

            # Verificar si el admin-emp tiene una empresa asociada
            admin_emp = Usuario.query.get(id_admin_emp)
            if not admin_emp or not admin_emp.id_empresa:
                return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403

            id_empresa = admin_emp.id_empresa

            # Crear un nuevo usuario
            new_user = Usuario(
                nombre=nombre,
                apellido=apellido,
                correo=email,
                username=username,
                contrasena=secrets.token_urlsafe(8),  # Contraseña temporal
                id_empresa=id_empresa
            )

            # Asignar el rol de empleado
            empleado_role = Rol.query.filter_by(slug="empleado").first()
            if not empleado_role:
                empleado_role = Rol(nombre="Empleado", slug="empleado", permisos="permisos_empleado")
                db.session.add(empleado_role)
                db.session.commit()

            new_user.roles.append(empleado_role)

            resultado.append({
                "username": username,
                "password": new_user.contrasena
            })

            # Guardar el usuario en la base de datos
            db.session.add(new_user)

        # Confirmar los cambios en la base de datos
        db.session.commit()
        return jsonify({
            "message": "Empleados registrados exitosamente",
            "total_empleados": len(list(reader)),
            "empleados": resultado
        })

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv'}

def validar_nombre(nombre: str) -> bool:
    # Solo letras (mayúsculas/minúsculas), espacios y letras acentuadas comunes
    return re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$", nombre) is not None

