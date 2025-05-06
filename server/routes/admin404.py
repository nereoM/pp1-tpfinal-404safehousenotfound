from flask import Blueprint, jsonify, request
from auth.decorators import role_required
from models.schemes import Usuario, Rol, Empresa
from models.extensions import db
from flasgger import swag_from
import secrets

admin_404_bp = Blueprint("admin_404", __name__)

@admin_404_bp.route("/admin-404-home", methods=["GET"])
@role_required(["admin-404"])
def admin_404_home():
    return jsonify({"message": "Bienvenido al dashboard de admin-404"}), 200

@swag_from("../docs/admin-404/registrar-admin-emp.yml")
@admin_404_bp.route("/registrar-admin-emp", methods=["POST"])
@role_required(["admin-404"])
def registrar_admin_emp():
    data = request.get_json()
    nombre = data.get("name")
    apellido = data.get("lastname")
    username = data.get("username")
    email = data.get("email")
    nombre_empresa = data.get("company_name")  # Nombre de la empresa proporcionado en la petición

    if not nombre or not apellido or not username or not email or not nombre_empresa:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    # Verificar si el usuario ya existe
    usuario_existente = Usuario.query.filter_by(correo=email).first()
    admin_emp_role = db.session.query(Rol).filter_by(slug="admin-emp").first()

    # Si el rol admin-emp no existe, crearlo
    if not admin_emp_role:
        admin_emp_role = Rol(nombre="Admin-EMP", permisos="permisos_admin_emp", slug="admin-emp")
        db.session.add(admin_emp_role)
        db.session.commit()

    if usuario_existente:
        # Si el usuario ya existe, asignarle el rol admin-emp
        usuario_existente.roles.clear()
        usuario_existente.roles.append(admin_emp_role)
        db.session.commit()

        # Crear una empresa asociada al usuario existente
        nueva_empresa = Empresa(
            nombre=nombre_empresa,
            id_admin_emp=usuario_existente.id,
        )
        db.session.add(nueva_empresa)
        db.session.commit()

        nueva_empresa.admin_emp = usuario_existente
        usuario_existente.id_empresa = nueva_empresa.id
        db.session.commit()

        return jsonify({"message": "El usuario ya existía, se le asignó el rol admin-emp y se creó su empresa"}), 200

    temp_password = secrets.token_urlsafe(8)
    
    # Si el usuario no existe, crearlo y asignarle el rol admin-emp
    nuevo_admin_emp = Usuario(
        nombre=nombre,
        apellido=apellido,
        username=username,
        correo=email,
        contrasena=temp_password,
    )
    nuevo_admin_emp.roles.append(admin_emp_role)

    db.session.add(nuevo_admin_emp)
    db.session.commit()

    # Crear una empresa asociada al nuevo usuario
    nueva_empresa = Empresa(
        nombre=nombre_empresa,
        id_admin_emp=nuevo_admin_emp.id,
    )
    db.session.add(nueva_empresa)
    db.session.commit()

    # Actualizar la relación entre el nuevo usuario y la empresa
    nueva_empresa.admin_emp = nuevo_admin_emp
    nuevo_admin_emp.id_empresa = nueva_empresa.id
    db.session.commit()

    return jsonify({
        "message": f"Admin-EMP '{username}' registrado exitosamente",
        "credentials": {
            "username": username,
            "password": temp_password
        }
    })
    # return jsonify({"message": "Admin-EMP y empresa registrados exitosamente"}), 201