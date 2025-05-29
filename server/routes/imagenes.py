from flask import Blueprint, request, jsonify
import os
from werkzeug.utils import secure_filename

imagenes_bp = Blueprint('imagenes_bp', __name__)

@imagenes_bp.route('/guardar-imagen-reporte', methods=['POST'])
def guardar_imagen_reporte():
    if 'imagen' not in request.files:
        return jsonify({"error": "No se envió la imagen"}), 400

    imagen = request.files['imagen']
    carpeta_destino = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'imagenes_reportes'))

    if not os.path.exists(carpeta_destino):
        os.makedirs(carpeta_destino)

    path_archivo = os.path.join(carpeta_destino, secure_filename(imagen.filename))

    try:
        imagen.save(path_archivo)
        print(f"Imagen guardada en: {path_archivo}")
        return jsonify({"message": f"Imagen guardada en {path_archivo}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
