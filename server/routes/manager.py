from flask import Blueprint, jsonify, request
from auth.decorators import role_required
from models.schemes import Usuario, Rol, Empresa
from models.extensions import db
import secrets
from flask_jwt_extended import get_jwt_identity

manager_bp = Blueprint("manager", __name__)

@manager_bp.route("/manager-home", methods=["GET"])
@role_required(["manager"])
def manager_home():
    return jsonify({"message": "Bienvenido a la Pagina de Inicio de Manager"}), 200

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
    
    # Obtener el ID del manager autenticado
    id_manager = get_jwt_identity()

    # Verificar si el manager tiene una empresa asociada
    manager = Usuario.query.get(id_manager)
    if not manager or not manager.id_empresa:
        return jsonify({"error": "El manager no tiene una empresa asociada"}), 403
    
    id_empresa = manager.id_empresa  # Obtener la empresa del manager

    temp_password = secrets.token_urlsafe(8)

    if Usuario.query.filter_by(correo=email).first():
        return jsonify({"error": "El email ya está registrado"}), 400

    reclutador_role = db.session.query(Rol).filter_by(slug="reclutador").first()
    if not reclutador_role:
        # return jsonify({"error": "Default role 'candidato' not found"}), 500
        reclutador_role = Rol(nombre="Reclutador", permisos="permisos_reclutador", slug="reclutador")
        db.session.add(reclutador_role)
        db.session.commit()

    nuevo_reclutador = Usuario(
        nombre=nombre,
        apellido=apellido,
        username=username,
        correo=email,
        contrasena=temp_password,
        id_empresa=id_empresa
    )
    nuevo_reclutador.roles.append(reclutador_role)

    db.session.add(nuevo_reclutador)
    db.session.commit()

    # Devolver las credenciales generadas
    return jsonify({
        "message": f"Reclutador '{username}' registrado exitosamente",
        "credentials": {
            "username": username,
            "password": temp_password
        },
        "empresa": {
            "id": id_empresa,
            "nombre": Empresa.query.get(id_empresa).nombre  # Obtener el nombre de la empresa
        }
    }), 201