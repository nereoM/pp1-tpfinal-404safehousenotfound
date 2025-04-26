from flask import Blueprint, jsonify
from auth.decorators import role_required

reclutador_bp = Blueprint("reclutador", __name__)

@reclutador_bp.route("/reclutador-home", methods=["GET"])
@role_required(["reclutador"])
def reclutador_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de reclutador"}), 200