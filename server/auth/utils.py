from flask_jwt_extended import get_jwt_identity
from models import Usuario

def get_current_user():
    identidad = get_jwt_identity()
    if not identidad:
        return None
    return Usuario.query.get(identidad)