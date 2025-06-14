import os
import re
from datetime import datetime as dt

from flasgger import swag_from
from flask import Blueprint, current_app, jsonify, request, url_for
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
from models.schemes import Empresa, Licencia, Preferencias_empresa, Rol, Usuario
from services.config import Config
from sqlalchemy import func, or_
from werkzeug.utils import secure_filename

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


@swag_from("../docs/auth/register.yml")
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

    nombre_valido = validar_nombre(nombre)
    apellido_valido = validar_nombre(apellido)

    if not nombre_valido:
        return jsonify(
            {"error": "El nombre no puede contener caracteres especiales"}
        ), 400

    if not apellido_valido:
        return jsonify(
            {"error": "El apellido no puede contener caracteres especiales"}
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


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "svg"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@swag_from("../docs/auth/confirmar.yml")
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


@swag_from("../docs/auth/login.yml")
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

    if user:
        if not user.verificar_contrasena(password):
            return jsonify({"error": "Credenciales inválidas"}), 401
        # Verificar si el correo está confirmado
        # if not user.confirmado:
        # return jsonify(
        # {
        # "error": "Correo no verificado. Por favor, verifica tu cuenta antes de iniciar sesión."
        # }
        # ), 401

        # Verificar si el usuario esta activo
        if not user.activo:
            return jsonify({"error": "Usuario inactivo"}), 401

        licencias = Licencia.query.filter(
            Licencia.id_empleado == user.id,
            or_(Licencia.estado == "aprobada", Licencia.estado == "activa"),
        ).all()

        hoy = dt.now().date()
        for licencia in licencias:
            if licencia.fecha_inicio.date() <= hoy <= licencia.fecha_fin.date():
                return jsonify(
                    {
                        "error": f"El usuario tiene una licencia vigente, cuenta bloqueada hasta: {licencia.fecha_fin.date()}"
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


@swag_from("../docs/auth/logout.yml")
@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"msg": "Logout exitoso"})
    unset_jwt_cookies(response)
    return response, 200


@swag_from("../docs/auth/google.yml")
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


@auth_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
@swag_from("../docs/auth/update-profile.yml")
def update_profile():
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json()
    new_username = data.get("username")
    new_email = data.get("email")
    new_password = data.get("password")

    # Validar los datos proporcionados
    if new_username:
        existing_user = Usuario.query.filter(Usuario.username == new_username).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({"error": "El username ya está en uso"}), 400
        user.username = new_username

    if new_email:
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, new_email):
            return jsonify({"error": "Formato de email no válido"}), 400
        existing_email = Usuario.query.filter(Usuario.correo == new_email).first()
        if existing_email and existing_email.id != user.id:
            return jsonify({"error": "El email ya está en uso"}), 400
        user.correo = new_email

    if new_password:
        contraseña_valida, mensaje = validar_contrasena(new_password)
        if not contraseña_valida:
            return jsonify({"error": mensaje}), 400
        user.contrasena = new_password

    try:
        db.session.commit()
        return jsonify({"message": "Perfil actualizado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/login/<string:nombre_empresa>", methods=["POST"])
@swag_from("../docs/auth/login-empresa.yml")
def login_empresa(nombre_empresa):
    data = request.get_json()
    identifier = data.get("username")
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"error": "Username, email y password son requeridos"}), 400

    empresa = db.session.query(Empresa).filter_by(nombre=nombre_empresa).first()
    if not empresa:
        return jsonify({"error": f"La empresa '{nombre_empresa}' no existe"}), 404

    user = Usuario.query.filter(
        ((Usuario.username == identifier) | (Usuario.correo == identifier))
        & (Usuario.id_empresa == empresa.id)
    ).first()

    if user:
        if not user.verificar_contrasena(password):
            return jsonify({"error": "Credenciales inválidas"}), 401

        if not user.activo:
            return jsonify({"error": "Usuario inactivo"}), 401

        roles = [r.slug for r in user.roles]
        access_token = create_access_token(
            identity=str(user.id), additional_claims={"roles": roles}
        )
        resp = jsonify({"message": "Login exitoso", "empresa": nombre_empresa})
        set_access_cookies(resp, access_token)
        return resp, 200

    return jsonify(
        {"error": "Credenciales inválidas o usuario no pertenece a esta empresa"}
    ), 401


@auth_bp.route("/empresa/<string:nombre_empresa>", methods=["GET"])
def obtener_datos_empresa(nombre_empresa):
    empresa = (
        db.session.query(Empresa)
        .filter(func.lower(Empresa.nombre) == nombre_empresa.lower())
        .first()
    )
    if not empresa:
        return jsonify({"error": f"La empresa '{nombre_empresa}' no existe"}), 404

    prefs = (
        db.session.query(Preferencias_empresa).filter_by(id_empresa=empresa.id).first()
    )
    return jsonify(
        {
            "nombre": empresa.nombre,
            "icon_url": prefs.icon_url if prefs else "",
            "image_url": prefs.image_url if prefs else "",
        }
    ), 200


@auth_bp.route("/empresa/<string:nombre_empresa>/preferencias/upload", methods=["POST"])
@jwt_required()
def upload_preferencias_files(nombre_empresa):
    icon_file = request.files.get("icono")
    cover_file = request.files.get("portada")
    if not icon_file or not cover_file:
        return jsonify({"error": "Se requieren archivos 'icono' y 'portada'."}), 400

    if not allowed_file(icon_file.filename) or not allowed_file(cover_file.filename):
        return jsonify({"error": "Formato de archivo no permitido."}), 400

    empresa = (
        db.session.query(Empresa).filter(Empresa.nombre.ilike(nombre_empresa)).first()
    )
    if not empresa:
        return jsonify({"error": f"La empresa '{nombre_empresa}' no existe."}), 404

    prefs = (
        db.session.query(Preferencias_empresa).filter_by(id_empresa=empresa.id).first()
    )
    if not prefs:
        prefs = Preferencias_empresa(
            id_empresa=empresa.id,
            slogan="",
            descripcion="",
            logo_url="",
            color_principal="#4f46e5",
            color_secundario="#a5b4fc",
            color_texto="#111827",
            icon_url="",
            image_url="",
        )
        db.session.add(prefs)
        db.session.commit()

    icon_dir = os.path.join(current_app.static_folder, "uploads", "iconos")
    cover_dir = os.path.join(current_app.static_folder, "uploads", "imagenes_emp")
    os.makedirs(icon_dir, exist_ok=True)
    os.makedirs(cover_dir, exist_ok=True)

    icon_filename = secure_filename(f"{empresa.id}_icono_{icon_file.filename}")
    icon_path = os.path.join(icon_dir, icon_filename)
    icon_file.save(icon_path)
    prefs.icon_url = url_for(
        "static", filename=f"uploads/iconos/{icon_filename}", _external=True
    )

    cover_filename = secure_filename(f"{empresa.id}_portada_{cover_file.filename}")
    cover_path = os.path.join(cover_dir, cover_filename)
    cover_file.save(cover_path)
    prefs.image_url = url_for(
        "static", filename=f"uploads/imagenes_emp/{cover_filename}", _external=True
    )

    db.session.commit()

    return jsonify({"icon_url": prefs.icon_url, "image_url": prefs.image_url}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
@swag_from("../docs/auth/me.yml")
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
            "id_empresa": user.id_empresa,
            "foto_url": user.foto_url,
            "apellido": user.apellido,
            "username": user.username,
            "puesto_trabajo": user.puesto_trabajo,
        }
    )


def validar_nombre(nombre: str) -> bool:
    # Solo letras (mayúsculas/minúsculas), espacios y letras acentuadas comunes
    return re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$", nombre) is not None
