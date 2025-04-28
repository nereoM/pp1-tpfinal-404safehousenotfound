from models.extensions import db
from models.schemes import Usuario, Rol

def create_admins():
    # Check if the admin role exists
    admin_role = Rol.query.filter_by(slug="admin-404").first()
    if not admin_role:
        admin_role = Rol(nombre="Administrador", permisos="all", slug="admin-404")
        db.session.add(admin_role)
        db.session.commit()

    # Create 6 admin users
    admin_users = [
        {"nombre": f"admin{i}", "apellido": f"labo{i}", "username": f"admin{i}-404", "correo": f"admin{i}_404@gmail.com", "contrasena": "pass123"}
        for i in range(1, 7)
    ]

    for user_data in admin_users:
        # Check if the user already exists
        existing_user = Usuario.query.filter_by(correo=user_data["correo"]).first()
        if not existing_user:
            new_user = Usuario(
                nombre=user_data["nombre"],
                apellido=user_data["apellido"],
                username=user_data["username"],
                correo=user_data["correo"],
                contrasena=user_data["contrasena"]
            )
            new_user.roles.append(admin_role)
            print(f"Creating user: {user_data["username"]}")
            db.session.add(new_user)

    db.session.commit()