from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, set_access_cookies
from models.users import Usuario, Rol
from models.extensions import db
from datetime import timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.users import Usuario
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from services.config import Config

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password are required"}), 400
    
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

    new_user = Usuario(nombre=username, correo=email, contrasena=password)
    new_user.roles.append(candidato_role)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # user = Usuario.query.filter_by(nombre=username).first()
    # if user and user.verificar_contrasena(password):
    #     access_token = create_access_token(identity=str(user.id))
    #     resp = jsonify({"message": "Login successful"})
    #     set_access_cookies(resp, access_token)
    #     return resp, 200

    user = Usuario.query.filter_by(nombre=username).first()
    if user and user.verificar_contrasena(password):
        # Include roles in the token
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