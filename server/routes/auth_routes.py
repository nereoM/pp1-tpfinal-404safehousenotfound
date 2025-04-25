from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, set_access_cookies
from models.schemes import Usuario, Rol
from models.extensions import db
from datetime import timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from services.config import Config
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
from models.extensions import mail
from flask import current_app
import re

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password are required"}), 400
    
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, email):
        return jsonify({"error": "Invalid email format"}), 400

    existing_user = Usuario.query.filter((Usuario.nombre == username) | (Usuario.correo == email)).first()
    if existing_user:
        return jsonify({"error": "Username or email already exists"}), 400
    

    # Buscar el rol de "candidato" en la base de datos
    candidato_role = db.session.query(Rol).filter_by(slug="candidato").first()
    if not candidato_role:
        # return jsonify({"error": "Default role 'candidato' not found"}), 500
        candidato_role = Rol(nombre="Candidato", permisos="candidato_permisos", slug="candidato")
        db.session.add(candidato_role)
        db.session.commit()

    enviar_confirmacion_email(email, username)

    new_user = Usuario(nombre=username, correo=email, contrasena=password)
    new_user.roles.append(candidato_role)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def enviar_confirmacion_email(correo_destino, nombre_usuario):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    token = s.dumps(correo_destino, salt='email-confirm')

    link = f"http://localhost:5000/auth/confirmar/{token}"
    msg = Message("Confirmá tu email", sender=current_app.config['MAIL_USERNAME'], recipients=[correo_destino])
    msg.body = f"Hola {nombre_usuario}, hacé clic para confirmar tu cuenta: {link}"
    mail.send(msg)

@auth_bp.route("/confirmar/<token>")
def confirmar_email(token):
    try:
        s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        correo = s.loads(token, salt='email-confirm', max_age=3600)
    except:
        return "El enlace ha expirado o es inválido.", 400

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
        return jsonify({"error": "Identifier (username or email) and password are required"}), 400

    # Buscar al usuario por nombre de usuario o correo electrónico
    user = Usuario.query.filter(
        (Usuario.nombre == identifier) | (Usuario.correo == identifier)
    ).first()

    if user and user.verificar_contrasena(password):
        # Verificar si el correo está confirmado
        if not user.confirmado:
            return jsonify({"error": "Please confirm your email before logging in."}), 400

        # Si la contraseña es correcta y el correo está confirmado, generar el token
        roles = [r.slug for r in user.roles]
        access_token = create_access_token(identity=str(user.id), additional_claims={"roles": roles})
        resp = jsonify({"message": "Login successful"})
        set_access_cookies(resp, access_token)
        return resp, 200

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route("/google", methods=["POST"])
def google_login():
    token = request.json.get("credential")
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), Config.GOOGLE_CLIENT_ID)

        email = idinfo["email"]
        nombre = idinfo.get("name", email)
        sub_id = idinfo["sub"]

        user = Usuario.query.filter_by(correo=email).first()
        if not user:
            user = Usuario(nombre=nombre, correo=email, contrasena=sub_id)
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id), additional_claims={"roles": [r.slug for r in user.roles]})

        response = jsonify({"message": "Login Google exitoso"})
        set_access_cookies(response, access_token)
        user.confirmar_usuario()
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

    return jsonify({
        "id": user.id,
        "nombre": user.nombre,
        "correo": user.correo,
        "roles": [r.slug for r in user.roles]
    })
