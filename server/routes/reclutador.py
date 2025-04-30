import json
from flask import Blueprint, jsonify
from auth.decorators import role_required
from models.extensions import db
from models.schemes import Oferta_laboral, Licencia
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from models.schemes import Oferta_laboral, Licencia, Job_Application, Usuario, CV

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
    
    
@reclutador_bp.route("/ver_candidatos/<int:id_oferta>", methods=["GET"])
@role_required(["reclutador"])
def ver_postulantes(id_oferta):
    try:
        oferta = Oferta_laboral.query.get(id_oferta)
        if not oferta:
            return jsonify({"error": "Oferta laboral no encontrada"}), 404

        postulaciones = Job_Application.query.filter_by(id_oferta=id_oferta).all()

        resultado = []
        for post in postulaciones:
            candidato = Usuario.query.get(post.id_candidato)
            cv = CV.query.get(post.id_cv) if post.id_cv else None

            resultado.append({
                "id_postulacion": post.id,
                "nombre": candidato.nombre,
                "email": candidato.correo,
                "fecha_postulacion": post.fecha_postulacion.isoformat(),
                "is_apto": post.is_apto,
                "cv_url": cv.url_cv if cv else None
            })

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reclutador_bp.route("/solicitud-licencia", methods=["POST"])
@role_required(["reclutador"])
def solicitar_licencia():
    data = request.get_json()
    tipo_licencia = data.get("lic_type")
    descripcion = data.get("description")

    id_empleado = get_jwt_identity()

    nueva_licencia = Licencia(
        id_empleado=id_empleado,
        tipo=tipo_licencia,
        descripcion=descripcion,
        estado="pendiente"
    )

    db.session.add(nueva_licencia)
    db.session.commit()

    return jsonify({"message": "Solicitud de licencia enviada exitosamente"}), 201