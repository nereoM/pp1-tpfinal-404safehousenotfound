from flask import Blueprint, jsonify, request
from auth.decorators import role_required
from models.schemes import Usuario, Rol
from models.extensions import db
import secrets

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

    # Generar una contraseña temporal
    temp_password = secrets.token_urlsafe(8)  # Genera una contraseña segura de 8 caracteres

    # Verificar si el usuario ya existe
    existing_user = Usuario.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "El usuario ya existe"}), 400

    # Crear un nuevo usuario con el rol de manager
    new_user = Usuario(nombre=nombre, apellido=apellido, username=username, correo=email, contrasena=temp_password)
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
        }
    }), 201