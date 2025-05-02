import re
import string
from datetime import timedelta

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies,
)
from flask_mail import Message
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from itsdangerous import SignatureExpired, URLSafeTimedSerializer
from models.extensions import db, mail
from models.schemes import Rol, Usuario
from services.config import Config

auth_bp = Blueprint("auth", __name__)


def validar_contrasena(password):
    # Validación de longitud mínima
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres."
    # Validación de al menos una mayúscula
    if not re.search(r"[A-Z]", password):
        return False, "La contraseña debe incluir al menos una letra mayúscula."
    # Validación de al menos un número
    if not re.search(r"\d", password):
        return False, "La contraseña debe incluir al menos un número."
    # Validación de al menos un carácter especial
    if not re.search(r"[^A-Za-z0-9]", password):
        return False, "La contraseña debe incluir al menos un carácter especial."
    # Si pasa todas las validaciones
    return True, "Contraseña válida."


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    nombre = data.get("name")
    apellido = data.get("surname")
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not nombre or not apellido or not username or not email or not password:
        return jsonify(
            {"error": "Nombre, apellido, username, email y password son requeridos"}
        ), 400

    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, email):
        return jsonify({"error": "Formato de email no valido"}), 400

    contraseña_valida, mensaje = validar_contrasena(password)

    if not contraseña_valida:
        return jsonify({"error": mensaje}), 400

    existing_user = Usuario.query.filter(
        (Usuario.username == username) | (Usuario.correo == email)
    ).first()
    if existing_user:
        return jsonify({"error": "Username o email ya existente"}), 400

    # Buscar el rol de "candidato" en la base de datos
    candidato_role = db.session.query(Rol).filter_by(slug="candidato").first()
    if not candidato_role:
        # return jsonify({"error": "Default role 'candidato' not found"}), 500
        candidato_role = Rol(
            nombre="Candidato", permisos="candidato_permisos", slug="candidato"
        )
        db.session.add(candidato_role)
        db.session.commit()

    enviar_confirmacion_email(email, username)

    new_user = Usuario(
        nombre=nombre,
        apellido=apellido,
        username=username,
        correo=email,
        contrasena=password,
    )
    new_user.roles.append(candidato_role)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def enviar_confirmacion_email(correo_destino, nombre_usuario):
    s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    token = s.dumps(correo_destino, salt="email-confirm")

    link = f"http://localhost:5000/auth/confirmar/{token}"
    msg = Message(
        "Confirmá tu email",
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[correo_destino],
    )
    msg.body = f"Hola {nombre_usuario}, hacé clic para confirmar tu cuenta: {link}"
    mail.send(msg)


@auth_bp.route("/confirmar/<token>")
def confirmar_email(token):
    s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    try:
        correo = s.loads(token, salt="email-confirm", max_age=3600)
    except SignatureExpired:
        try:
            correo = s.loads(token, salt="email-confirm")
            usuario = Usuario.query.filter_by(correo=correo).first()
            if usuario and not usuario.confirmado:
                db.session.delete(usuario)
                db.session.commit()
        except Exception:
            pass
        return "El enlace ha expirado. Registrate de nuevo.", 400
    except Exception:
        return "El enlace es inválido.", 400

    usuario = Usuario.query.filter_by(correo=correo).first()
    if not usuario:
        return "Usuario no encontrado", 404

    usuario.confirmar_usuario()

    return "¡Tu cuenta fue confirmada con éxito!"


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    identifier = data.get("username")
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"error": "Username, email and password son requeridos"}), 400

    # Buscar al usuario por nombre de usuario o correo electrónico
    user = Usuario.query.filter(
        (Usuario.username == identifier) | (Usuario.correo == identifier)
    ).first()

    if user and user.verificar_contrasena(password):
        # Verificar si el correo está confirmado
        if not user.confirmado:
            return jsonify(
                {
                    "error": "Correo no verificado. Por favor, verifica tu cuenta antes de iniciar sesión."
                }
            ), 401

        # Si la contraseña es correcta y el correo está confirmado, generar el token
        roles = [r.slug for r in user.roles]
        access_token = create_access_token(
            identity=str(user.id), additional_claims={"roles": roles}
        )
        resp = jsonify({"message": "Login successful"})
        set_access_cookies(resp, access_token)
        print(access_token)
        return resp, 200

    return jsonify({"error": "Credenciales Invalidas"}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"msg": "Logout exitoso"})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route("/google", methods=["POST"])
def google_login():
    token = request.json.get("credential")
    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), Config.GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        nombre = idinfo.get("name", email)
        sub_id = idinfo["sub"]

        user = Usuario.query.filter_by(correo=email).first()
        if not user:
            user = Usuario(
                nombre=nombre,
                apellido="",  # Poner un string vacío si no lo tenemos
                username=email.split("@")[0],  # Sacamos el username del correo
                correo=email,
                contrasena=sub_id,
            )

            db.session.add(user)
            db.session.commit()

            candidato_role = db.session.query(Rol).filter_by(slug="candidato").first()
            if not candidato_role:
                # Si no existe el rol, lo creamos
                candidato_role = Rol(
                    nombre="Candidato", permisos="candidato_permisos", slug="candidato"
                )
                db.session.add(candidato_role)
                db.session.commit()

            user.roles.append(candidato_role)
            db.session.commit()

        if not user.confirmado:
            user.confirmar_usuario()

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"roles": [r.slug for r in user.roles]},
        )

        response = jsonify(
            {"message": "Login Google exitoso", "roles": [r.slug for r in user.roles]}
        )

        set_access_cookies(response, access_token)

        return response, 200

    except ValueError:
        return jsonify({"error": "Token inválido"}), 401


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_user_info():
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify(
        {
            "id": user.id,
            "nombre": user.username,
            "correo": user.correo,
            "roles": [r.slug for r in user.roles],
        }
    )
