from flask import Blueprint, jsonify, request
from auth.decorators import role_required
import os
from werkzeug.utils import secure_filename

candidato_bp = Blueprint("candidato", __name__)

@candidato_bp.route("/candidato-home", methods=["GET"])
@role_required(["candidato"])
def candidato_home():
    return jsonify({"message": "Bienvenido al dashboard de candidato"}), 200

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads/cvs')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
candidato_bp.config = {"UPLOAD_FOLDER": UPLOAD_FOLDER}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@candidato_bp.route("/upload-cv", methods=["POST"])
@role_required(["candidato"])
def upload_cv():
    print(request.files)
    print(request.form)
    if 'file' not in request.files:
        return jsonify({"error": "No se encontró ningún archivo"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No se seleccionó ningún archivo"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(candidato_bp.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        return jsonify({"message": "CV subido exitosamente", "file_path": filepath}), 201

    return jsonify({"error": "Formato de archivo no permitido"}), 400