from models.extensions import db
from models.schemes import Usuario, Rol
from main import app

def crear_usuarios_con_roles():
    with app.app_context():
        print("Cargando usuarios y roles en la base de datos...")

        roles = {
            "admin": Rol(nombre="Administrador", slug="admin", permisos="full"),
            "rrhh": Rol(nombre="Recursos Humanos", slug="rrhh", permisos="modulo_rrhh"),
            "usuario": Rol(nombre="Usuario", slug="usuario", permisos="acceso_basico")
        }

        for r in roles.values():
            existente = Rol.query.filter_by(slug=r.slug).first()
            if not existente:
                db.session.add(r)

        db.session.commit()

        usuarios = [
            {"nombre": "admin", "apellido": "admin", "username":"admin", "correo": "admin@test.com", "password": "admin123", "rol": "admin"},
            {"nombre": "juana", "apellido": "juana", "correo": "juana@rrhh.com", "password": "rrhh123", "rol": "rrhh"},
            {"nombre": "marcos", "correo": "marcos@user.com", "password": "user123", "rol": "usuario"},
        ]

        for u in usuarios:
            existe = Usuario.query.filter_by(nombre=u["nombre"]).first()
            if not existe:
                nuevo = Usuario(nombre=u["nombre"], correo=u["correo"], contrasena=u["password"])
                rol = Rol.query.filter_by(slug=u["rol"]).first()
                nuevo.roles.append(rol)
                db.session.add(nuevo)

        db.session.commit()
        print("Usuarios y roles creados exitosamente.")


