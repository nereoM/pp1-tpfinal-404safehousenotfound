from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models.users import Usuario
from models.extensions import db
from datetime import timedelta

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

    new_user = Usuario(nombre=username, correo=email, contrasena=password)

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

    user = Usuario.query.filter_by(nombre=username).first()
    if user and user.verificar_contrasena(password):
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=2)
        )

    user = Usuario.query.filter_by(nombre=username).first()
    if user and user.verificar_contrasena(password):
        return jsonify({"message": "Login successful", "access_token": access_token}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401