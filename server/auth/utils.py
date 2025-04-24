from flask_jwt_extended import get_jwt_identity
from models.users import Usuario

# def get_current_user():
#     identidad = get_jwt_identity()
#     if not identidad:
#         return None
#     return Usuario.query.get(identidad)

def get_current_user():
    identidad = get_jwt_identity()
    if not identidad:
        return None, {"error": "No se encontró la identidad en el token"}, 401

    user = Usuario.query.get(identidad)
    if not user:
        return None, {"error": "Usuario no encontrado"}, 404

    return user, None, 200