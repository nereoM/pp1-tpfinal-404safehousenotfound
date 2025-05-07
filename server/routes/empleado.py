from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from models.extensions import db
from models.schemes import Empresa, Licencia, Usuario
from auth.decorators import role_required

empleado_bp = Blueprint("empleado", __name__)

@empleado_bp.route("/empleado", methods=["GET"])
@role_required(["empleado"])
def empleado_home():
    return jsonify({"message": "Bienvenido al Inicio de Empleado"}), 200

@empleado_bp.route("/solicitar-licencia", methods=["POST"])
@role_required(["empleado"])
def solicitar_licencia():
    data = request.get_json()
    tipo_licencia = data.get("lic_type")
    descripcion = data.get("description")

    id_empleado = get_jwt_identity()
    empleado = Usuario.query.filter_by(id=id_empleado).first()

    nueva_licencia = Licencia(
        id_empleado=id_empleado,
        tipo=tipo_licencia,
        descripcion=descripcion,
        estado="pendiente",
        id_empresa=empleado.id_empresa,
    )

    db.session.add(nueva_licencia)
    db.session.commit()

    return jsonify(
        {
            "message": "Solicitud de licencia enviada exitosamente",
            "licencia": {
                "id": nueva_licencia.id,
                "tipo": nueva_licencia.tipo,
                "descripcion": nueva_licencia.descripcion,
                "estado": nueva_licencia.estado,
                "fecha_inicio": nueva_licencia.fecha_inicio.isoformat()
                if nueva_licencia.fecha_inicio
                else None,
                "empresa": {
                    "id": nueva_licencia.id_empresa,
                    "nombre": Empresa.query.get(nueva_licencia.id_empresa).nombre,
                },
            },
        }
    ), 201