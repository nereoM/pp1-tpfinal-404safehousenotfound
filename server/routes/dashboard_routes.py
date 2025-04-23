from flask import Blueprint, jsonify
from auth.decorators import role_required

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/candidato", methods=["GET"])
@role_required(["candidato"])
def candidato_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de candidato"}), 200

@dashboard_bp.route("/dashboard/reclutador", methods=["GET"])
@role_required(["reclutador"])
def reclutador_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de reclutador"}), 200

@dashboard_bp.route("/dashboard/admin", methods=["GET"])
@role_required(["admin"])
def admin_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de admin"}), 200