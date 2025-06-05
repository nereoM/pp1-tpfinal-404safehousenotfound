from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.gpt import generar_respuesta_gpt

chatbot_bp = Blueprint("chatbot", __name__)

from models.schemes import Usuario
from sqlalchemy.orm import joinedload


ORDEN_ROLES = ["admin-emp", "manager", "reclutador", "candidato"]

def obtener_rol_usuario(user_id):
    usuario = Usuario.query.options(joinedload(Usuario.roles)).filter_by(id=user_id).first()

    if usuario and usuario.roles:
        slugs_usuario = [rol.slug for rol in usuario.roles]

        for slug_prioritario in ORDEN_ROLES:
            if slug_prioritario in slugs_usuario:
                return slug_prioritario

    return "desconocido"


@chatbot_bp.route("/chatbot", methods=["POST"])
@jwt_required()
def chatbot():
    data = request.get_json()
    mensaje = data.get("mensaje", "").strip()

    user_id = get_jwt_identity()
    rol = obtener_rol_usuario(user_id)

    if not mensaje:
        return jsonify({"error": "Mensaje vacío"}), 400

    respuesta = generar_respuesta_gpt(mensaje, rol)
    return jsonify({"respuesta": respuesta})
