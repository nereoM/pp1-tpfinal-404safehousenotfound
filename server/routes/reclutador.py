import json
from flask import Blueprint, jsonify
from auth.decorators import role_required
from models.extensions import db
from models.schemes import Oferta_laboral
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from models.schemes import Usuario, Rol, Empresa

reclutador_bp = Blueprint("reclutador", __name__)

@reclutador_bp.route("/reclutador-home", methods=["GET"])
@role_required(["reclutador"])
def reclutador_dashboard():
    return jsonify({"message": "Bienvenido al dashboard de reclutador"}), 200

@reclutador_bp.route("/definir_palabras_clave/<int:id_oferta>", methods=["POST"])
@role_required(["reclutador"])
def definir_palabras_clave(id_oferta):
    try:
        data = request.get_json()
        nuevas_palabras = data.get('palabras_clave')

        if not nuevas_palabras or not isinstance(nuevas_palabras, list):
            return jsonify({"error": "Se debe enviar una lista de palabras clave"}), 400

        oferta = Oferta_laboral.query.get(id_oferta)

        if not oferta:
            return jsonify({"error": f"No se encontró la oferta laboral con ID {id_oferta}"}), 404

        oferta.palabras_clave = json.dumps(nuevas_palabras)

        db.session.commit()

        return jsonify({"message": "Palabras clave actualizadas exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
