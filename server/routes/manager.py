import json
import secrets

from auth.decorators import role_required
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.extensions import db
from models.schemes import (
    Empresa,
    Licencia,
    Oferta_analista,
    Oferta_laboral,
    Rol,
    Usuario,
)

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
        reclutador_role = Rol(
            nombre="Reclutador", permisos="permisos_reclutador", slug="reclutador"
        )
        db.session.add(reclutador_role)
        db.session.commit()

    nuevo_reclutador = Usuario(
        nombre=nombre,
        apellido=apellido,
        username=username,
        correo=email,
        contrasena=temp_password,
        id_empresa=id_empresa,
        id_superior=id_manager,
    )
    nuevo_reclutador.roles.append(reclutador_role)

    db.session.add(nuevo_reclutador)
    db.session.commit()

    # Devolver las credenciales generadas
    return jsonify(
        {
            "message": f"Reclutador '{username}' registrado exitosamente",
            "credentials": {"username": username, "password": temp_password},
            "reclutador": {
                "id": nuevo_reclutador.id,
                "nombre": nuevo_reclutador.nombre,
                "apellido": nuevo_reclutador.apellido,
                "username": nuevo_reclutador.username,
                "email": nuevo_reclutador.correo,
                "empresa": {
                    "id": nuevo_reclutador.id_empresa,
                    "nombre": Empresa.query.get(id_empresa).nombre,
                },
                "id_superior": nuevo_reclutador.id_superior,
            },
        }
    ), 201


@manager_bp.route("/crear_oferta_laboral", methods=["POST"])
@role_required(["manager"])
def crear_oferta_laboral():
    try:
        data = request.get_json()

        nombre = data.get("nombre")
        descripcion = data.get("descripcion")
        location = data.get("location")
        employment_type = data.get("employment_type")
        etiquetas = data.get("etiquetas", "")
        workplace_type = data.get("workplace_type")
        salary_min = data.get("salary_min")
        salary_max = data.get("salary_max")
        currency = data.get("currency")
        experience_level = data.get("experience_level")
        fecha_cierre = data.get("fecha_cierre")

        if not all(
            [
                nombre,
                descripcion,
                location,
                employment_type,
                workplace_type,
                salary_min,
                salary_max,
                currency,
                experience_level,
            ]
        ):
            return jsonify(
                {"error": "Faltan datos obligatorios para crear la oferta laboral."}
            ), 400

        lista_palabras_clave = list(
            set(
                [p.strip().lower() for p in etiquetas.split(",") if len(p.strip()) >= 3]
            )
        )
        palabras_clave_json = json.dumps(lista_palabras_clave)

        id_manager = get_jwt_identity()
        manager = Usuario.query.filter_by(id=id_manager).first()
        if not manager:
            return jsonify({"error": "Manager no encontrado."}), 404

        id_empresa = manager.id_empresa
        empresa = Empresa.query.filter_by(id=id_empresa).first()
        if not empresa:
            return jsonify({"error": "Empresa no encontrada."}), 404

        nueva_oferta = Oferta_laboral(
            id_empresa=empresa.id,
            id_creador=manager.id,
            nombre=nombre,
            descripcion=descripcion,
            location=location,
            employment_type=employment_type,
            workplace_type=workplace_type,
            salary_min=salary_min,
            salary_max=salary_max,
            currency=currency,
            experience_level=experience_level,
            is_active=True,
            palabras_clave=palabras_clave_json,
            fecha_publicacion=db.func.now(),
            fecha_cierre=fecha_cierre if fecha_cierre else None,
        )

        db.session.add(nueva_oferta)
        db.session.commit()

        return jsonify(
            {
                "message": "Oferta laboral creada exitosamente.",
                "id_oferta": nueva_oferta.id,
                "nombre": nueva_oferta.nombre,
                "empresa": empresa.nombre,
            }
        ), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@manager_bp.route("/empleados-manager", methods=["GET"])
@role_required(["manager"])
def ver_empleados():
    id_manager = get_jwt_identity()

    empleados = Usuario.query.filter_by(id_superior=id_manager).all()

    resultado = [
        {
            "id": e.id,
            "nombre": e.nombre,
            "apellido": e.apellido,
            "correo": e.correo,
            "username": e.username,
            "roles": [rol.slug for rol in e.roles],
        }
        for e in empleados
    ]

    return jsonify(resultado), 200


@manager_bp.route("/info-manager", methods=["GET"])
@jwt_required()
def obtener_nombre_apellido_manager():
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    if not manager:
        return jsonify({"error": "Manager no encontrado"}), 404

    return {
        "nombre": manager.nombre,
        "apellido": manager.apellido,
        "username": manager.username,
        "correo": manager.correo,
    }


@manager_bp.route("/desvincular-reclutador/<int:id_empleado>", methods=["PUT"])
@role_required(["manager"])
def desvincular_empleado(id_empleado):
    id_manager = int(get_jwt_identity())

    empleado = Usuario.query.get(id_empleado)

    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    if empleado.id_superior != id_manager:
        return jsonify(
            {"error": "No tenés permisos para desvincular a este usuario"}
        ), 403

    empleado.id_empresa = None
    empleado.id_superior = None

    empleado.roles.clear()
    db.session.commit()

    rol_candidato = Rol.query.filter_by(slug="candidato").first()
    if not rol_candidato:
        rol_candidato = Rol(nombre="Candidato", slug="candidato", permisos="")
        db.session.add(rol_candidato)
        db.session.commit()

    empleado.roles.append(rol_candidato)
    db.session.commit()

    return jsonify({"message": "Empleado desvinculado correctamente"}), 200


@manager_bp.route("/visualizar-licencias-solicitadas", methods=["GET"])
@role_required(["manager"])
def visualizar_licencias():
    id_manager = get_jwt_identity()
    manager = Usuario.query.filter_by(id=id_manager).first()
    empresa = Empresa.query.filter_by(id=manager.id_empresa).first()

    licencias = Licencia.query.filter_by(id_empresa=empresa.id).all()

    resultado = []
    for licencia in licencias:
        empleado = Usuario.query.filter_by(id=licencia.id_empleado).first()
        if (
            empleado.id_superior == manager.id
            and empleado.id_empresa == manager.id_empresa
        ):
            resultado.append(
                {
                    "licencia": {
                        "id_licencia": licencia.id,
                        "empleado": {
                            "id": licencia.id_empleado,
                            "nombre": empleado.nombre,
                            "apellido": empleado.apellido,
                            "username": empleado.username,
                            "email": empleado.correo,
                        },
                        "tipo": licencia.tipo,
                        "descripcion": licencia.descripcion,
                        "fecha_inicio": licencia.fecha_inicio.isoformat()
                        if licencia.fecha_inicio
                        else None,
                        "estado": licencia.estado,
                        "empresa": {
                            "id": licencia.id_empresa,
                            "nombre": empresa.nombre,
                        },
                        "certificado_url": licencia.certificado_url
                        if licencia.certificado_url
                        else None,
                    }
                }
            )

    return jsonify(resultado), 200


@manager_bp.route("/evaluar-licencia/<int:id_licencia>", methods=["PUT"])
@role_required(["manager"])
def evaluar_licencia(id_licencia):
    # Obtener los datos enviados en la solicitud
    data = request.get_json()
    nuevo_estado = data.get("estado")  # "aprobado" o "rechazado"

    if nuevo_estado not in ["aprobada", "rechazada", "activa"]:
        return jsonify(
            {"error": "El estado debe ser 'aprobada', 'rechazada' o 'activa'"}
        ), 400

    # Obtener el ID del manager autenticado
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)

    # Verificar que la licencia pertenece a la empresa del manager
    licencia = Licencia.query.get(id_licencia)
    if not licencia:
        return jsonify({"error": "Licencia no encontrada"}), 404

    empleado = Usuario.query.get(licencia.id_empleado)

    if licencia.id_empresa != manager.id_empresa and empleado.id_superior != manager.id:
        return jsonify({"error": "No tienes permiso para evaluar esta licencia"}), 403

    empresa = Empresa.query.get(licencia.id_empresa)

    if licencia.estado == "pendiente":
        if nuevo_estado in ["aprobada", "rechazada"]:
            licencia.estado = nuevo_estado
            db.session.commit()
            return jsonify(
                {
                    "message": f"Licencia {nuevo_estado} exitosamente",
                    "licencia": {
                        "id_licencia": licencia.id,
                        "empleado": {
                            "id": licencia.id_empleado,
                            "nombre": empleado.nombre,
                            "apellido": empleado.apellido,
                            "username": empleado.username,
                            "email": empleado.correo,
                        },
                        "tipo": licencia.tipo,
                        "descripcion": licencia.descripcion,
                        "fecha_inicio": licencia.fecha_inicio.isoformat()
                        if licencia.fecha_inicio
                        else None,
                        "estado": licencia.estado,
                        "empresa": {
                            "id": licencia.id_empresa,
                            "nombre": empresa.nombre,
                        },
                        "certificado_url": licencia.certificado_url
                        if licencia.certificado_url
                        else None,
                    },
                }
            ), 200
    elif (
        licencia.estado == "aprobada"
        and nuevo_estado == "activa"
        and licencia.certificado_url
    ):
        licencia.estado = nuevo_estado
        db.session.commit()
        return jsonify(
            {
                "message": f"Licencia en estado {nuevo_estado} exitosa",
                "licencia": {
                    "id_licencia": licencia.id,
                    "empleado": {
                        "id": licencia.id_empleado,
                        "nombre": empleado.nombre,
                        "apellido": empleado.apellido,
                        "username": empleado.username,
                        "email": empleado.correo,
                    },
                    "tipo": licencia.tipo,
                    "descripcion": licencia.descripcion,
                    "fecha_inicio": licencia.fecha_inicio.isoformat()
                    if licencia.fecha_inicio
                    else None,
                    "estado": licencia.estado,
                    "empresa": {"id": licencia.id_empresa, "nombre": empresa.nombre},
                },
            }
        ), 200


@manager_bp.route("/asignar-analista-oferta", methods=["POST"])
@role_required(["manager"])
def asignar_analista_a_oferta():
    data = request.get_json()
    id_oferta = data.get("id_oferta")
    id_analista = data.get("id_analista")

    oferta = Oferta_laboral.query.get(id_oferta)
    analista = Usuario.query.get(id_analista)
    id_empresa = analista.id_empresa

    if not oferta or not analista:
        return jsonify({"error": "Oferta o analista no encontrado."}), 404
    if id_empresa != oferta.id_empresa:
        return jsonify(
            {"error": "El analista no pertenece a la misma empresa que la oferta."}
        ), 403

    oferta_analista = Oferta_analista(id_oferta=oferta.id, id_analista=analista.id)
    db.session.add(oferta_analista)

    return jsonify(
        {
            "message": "Analista asignado a la oferta laboral exitosamente.",
            "oferta": oferta.nombre,
            "analista": analista.username,
        }
    ), 201


@manager_bp.route("/mis-ofertas-laborales", methods=["GET"])
@role_required(["manager"])
def obtener_ofertas():
    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    empresa = Empresa.query.get(manager.id_empresa)

    ofertas = Oferta_laboral.query.filter_by(
        id_creador=manager.id, id_empresa=empresa.id
    ).all()

    resultado = [
        {
            "id_oferta": oferta.id,
            "nombre": oferta.nombre,
            "descripcion": oferta.descripcion,
            "location": oferta.location,
            "employment_type": oferta.employment_type,
            "workplace_type": oferta.workplace_type,
            "salary_min": oferta.salary_min,
            "salary_max": oferta.salary_max,
            "currency": oferta.currency,
            "experience_level": oferta.experience_level,
            "is_active": oferta.is_active,
            "palabras_clave": json.loads(oferta.palabras_clave),
            "fecha_publicacion": oferta.fecha_publicacion.isoformat()
            if oferta.fecha_publicacion
            else None,
            "fecha_cierre": oferta.fecha_cierre.isoformat()
            if oferta.fecha_cierre
            else None,
        }
        for oferta in ofertas
    ]

    return jsonify(
        {"ofertas": resultado, "empresa": {"id": empresa.id, "nombre": empresa.nombre}}
    ), 200
