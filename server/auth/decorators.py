from functools import wraps
from flask import make_response, jsonify
from flask_jwt_extended import jwt_required, verify_jwt_in_request
from .utils import get_current_user

# def auth_rol(roles_requeridos):
#     def wrapper(fn):
#         @wraps(fn)
#         @jwt_required()
#         def decorator(*args, **kwargs):
#             usuario_actual = get_current_user()

#             if not usuario_actual:
#                 return make_response({"msg": "No autenticado"}, 401)
            
#             roles = roles_requeridos if isinstance(roles_requeridos, list) else [roles_requeridos]

#             if all(not usuario_actual.tiene_rol(r) for r in roles):
#                 return make_response({"msg": "No tienes permisos para acceder a este recurso"}, 403)

#             return fn(*args, **kwargs)
#         return decorator
#     return wrapper

def role_required(required_roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()  # Valida token
            user, error, status_code = get_current_user()

            if error:
                return jsonify(error), status_code  # Ya es JSON

            user_roles = [r.slug for r in user.roles]
            if not any(role in user_roles for role in required_roles):
                return jsonify({"error": "Acceso denegado: rol no autorizado"}), 403

            return fn(*args, **kwargs)

        return decorator
    return wrapper