from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
from services.gpt import generar_respuesta_gpt

chatbot_bp = Blueprint("chatbot", __name__)

from models.schemes import Usuario
from sqlalchemy.orm import joinedload


ORDEN_ROLES = ["admin-emp", "manager", "reclutador", "candidato", "empleado"]

def obtener_rol_usuario(user_id):
    usuario = Usuario.query.options(joinedload(Usuario.roles)).filter_by(id=user_id).first()

    if usuario and usuario.roles:
        slugs_usuario = [rol.slug.strip().lower() for rol in usuario.roles]
        print(f"DEBUG - Roles del usuario {user_id}: {slugs_usuario}")

        for slug_prioritario in ORDEN_ROLES:
            if slug_prioritario in slugs_usuario:
                print(f"DEBUG - Rol prioritario encontrado: {slug_prioritario}")
                return slug_prioritario

    return "desconocido"


@chatbot_bp.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
    except NoAuthorizationError:
        user_id = None

    data = request.get_json()
    mensaje = data.get("mensaje", "").strip()

    if not mensaje:
        return jsonify({"error": "Mensaje vacío"}), 400

    rol = obtener_rol_usuario(user_id) if user_id else "desconocido"
    respuesta = generar_respuesta_gpt(mensaje, rol)
    return jsonify({"respuesta": respuesta})
