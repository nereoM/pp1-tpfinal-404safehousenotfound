from flask import Blueprint, jsonify
from auth.decorators import role_required
from flask import request
from models.users import Usuario, Rol
from models.extensions import db

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/candidato", methods=["GET"])
@role_required(["candidato"])
def candidato_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de candidato"}), 200

@dashboard_bp.route("/dashboard/reclutador", methods=["GET"])
@role_required(["reclutador"])
def reclutador_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de reclutador"}), 200

@dashboard_bp.route("/dashboard/admin/register-reclutador", methods=["POST"])
@role_required(["admin"])
def register_reclutador():
    # Obtener datos del reclutador desde el cuerpo de la solicitud
    data = request.get_json()
    nombre = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # Validar los datos
    if not nombre or not email or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    # Verificar si el email ya está registrado
    if Usuario.query.filter_by(correo=email).first():
        return jsonify({"error": "El email ya está registrado"}), 400

    reclutador_role = db.session.query(Rol).filter_by(slug="reclutador").first()
    if not reclutador_role:
        # return jsonify({"error": "Default role 'candidato' not found"}), 500
        reclutador_role = Rol(nombre="Reclutador", permisos="permisos_reclutador", slug="reclutador")
        db.session.add(reclutador_role)
        db.session.commit()

    # Crear un nuevo usuario reclutador
    nuevo_reclutador = Usuario(
        nombre=nombre,
        correo=email,
        contrasena=password)
    nuevo_reclutador.roles.append(reclutador_role)

    # Guardar en la base de datos
    db.session.add(nuevo_reclutador)
    db.session.commit()

    return jsonify({"message": "Reclutador registrado exitosamente"}), 201

@dashboard_bp.route("/dashboard/admin", methods=["GET"])
@role_required(["admin"])
def admin_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de admin"}), 200