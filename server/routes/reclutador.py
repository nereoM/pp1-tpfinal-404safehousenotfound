import json
from flask import Blueprint, jsonify
from auth.decorators import role_required
from models.extensions import db
from models.schemes import Oferta_laboral
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

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
    
    
@reclutador_bp.route("/crear_oferta_laboral", methods=["POST"])
@role_required(["reclutador"])
def crear_oferta_laboral():
    try:
        data = request.get_json()

        nombre = data.get("nombre")
        descripcion = data.get("descripcion")
        location = data.get("location")
        employment_type = data.get("employment_type")
        workplace_type = data.get("workplace_type")
        salary_min = data.get("salary_min")
        salary_max = data.get("salary_max")
        currency = data.get("currency")
        experience_level = data.get("experience_level")
        fecha_cierre = data.get("fecha_cierre")

        if not all([nombre, descripcion, location, employment_type, workplace_type, salary_min, salary_max, currency, experience_level]):
            return jsonify({"error": "Faltan datos obligatorios para crear la oferta laboral."}), 400

        id_empresa = get_jwt_identity()

        nueva_oferta = Oferta_laboral(
            id_empresa=id_empresa,
            nombre=nombre,
            descripcion=descripcion,
            location=location,
            employment_type=employment_type,
            workplace_type=workplace_type,
            salary_min=salary_min,
            salary_max=salary_max,
            currency=currency,
            experience_level=experience_level,
            modelo=b"",  # vacío por ahora
            vectorizador=b"",  # vacío por ahora
            palabras_clave=json.dumps([]),  # inicializamos vacío
            fecha_publicacion=db.func.now(),
            fecha_cierre=fecha_cierre if fecha_cierre else None,
            is_active=True
        )

        db.session.add(nueva_oferta)
        db.session.commit()

        return jsonify({"message": "Oferta laboral creada exitosamente.", "id_oferta": nueva_oferta.id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
