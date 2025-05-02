from flask import Blueprint, jsonify, request
from auth.decorators import role_required
from models.schemes import Usuario, Rol, Empresa, Preferencias_empresa
from models.extensions import db
import secrets
from flask_jwt_extended import get_jwt_identity
import os
from werkzeug.utils import secure_filename

admin_emp_bp = Blueprint("admin_emp", __name__)

@admin_emp_bp.route("/admin-emp-home", methods=["GET"])
@role_required(["admin-emp"])
def admin_emp_home():
    return jsonify({"message": "Bienvenido al Inicio de Admin-emp"}), 200

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

    # Obtener el ID del admin-emp autenticado
    id_admin_emp = get_jwt_identity()

    # Verificar si el admin-emp tiene una empresa asociada
    admin_emp = Usuario.query.get(id_admin_emp)
    if not admin_emp or not admin_emp.id_empresa:
        return jsonify({"error": "El admin-emp no tiene una empresa asociada"}), 403

    id_empresa = admin_emp.id_empresa  # Obtener la empresa del admin-emp

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
        id_empresa=id_empresa  # Asociar el manager con la empresa del admin-emp
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