from models.extensions import db
from models.users import Usuario, Rol

def create_admins():
    # Check if the admin role exists
    admin_role = Rol.query.filter_by(slug="admin").first()
    if not admin_role:
        admin_role = Rol(nombre="Administrador", permisos="all", slug="admin")
        db.session.add(admin_role)
        db.session.commit()

    # Create 6 admin users
    admin_users = [
        {"nombre": f"admin{i}", "correo": f"admin{i}@gmail.com", "contrasena": "pass123"}
        for i in range(1, 7)
    ]

    for user_data in admin_users:
        # Check if the user already exists
        existing_user = Usuario.query.filter_by(correo=user_data["correo"]).first()
        if not existing_user:
            new_user = Usuario(
                nombre=user_data["nombre"],
                correo=user_data["correo"],
                contrasena=user_data["contrasena"]
            )
            new_user.roles.append(admin_role)
            print(f"Creating user: {user_data["nombre"]}")
            db.session.add(new_user)

    db.session.commit()