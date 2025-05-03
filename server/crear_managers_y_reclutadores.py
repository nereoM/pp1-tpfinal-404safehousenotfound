from main import app  # Asegurate que este sea tu Flask app
from models.schemes import db, Usuario, Rol, Empresa
from werkzeug.security import generate_password_hash

def asignar_rol(usuario, slug_rol):
    rol = Rol.query.filter_by(slug=slug_rol).first()
    if not rol:
        rol = Rol(nombre=slug_rol.capitalize(), slug=slug_rol, permisos="*")
        db.session.add(rol)
        db.session.commit()
    usuario.roles.append(rol)

def crear_usuarios_con_roles():
    # 1. Crear admin_emp (todavía sin empresa asignada)
    admin_emp = Usuario(
        nombre="Valentina",
        apellido="Martínez",
        username="valemtz",
        correo="valentina@globant.com",
        contrasena="Admin123!",
        confirmado=True
    )
    db.session.add(admin_emp)
    db.session.commit()

    # 2. Crear empresa y asignarla al admin
    empresa = Empresa(nombre="Globant", id_admin_emp=admin_emp.id)
    db.session.add(empresa)
    db.session.commit()

    # 3. Actualizar el admin con el id de empresa
    admin_emp.id_empresa = empresa.id
    db.session.commit()

    asignar_rol(admin_emp, "admin-emp")

    # 4. Crear managers
    managers = [
        {"nombre": "Tomás", "apellido": "Ríos", "username": "tomasr", "correo": "tomas@globant.com"},
        {"nombre": "Ana", "apellido": "Fernández", "username": "anafern", "correo": "ana@globant.com"},
    ]
    for m in managers:
        manager = Usuario(
            nombre=m["nombre"],
            apellido=m["apellido"],
            username=m["username"],
            correo=m["correo"],
            contrasena="Manager123!",
            confirmado=True,
            id_empresa=empresa.id,
            id_superior=admin_emp.id,
        )
        db.session.add(manager)
        db.session.commit()
        asignar_rol(manager, "manager")

    # 5. Crear reclutadores
    reclutadores = [
        {"nombre": "Leo", "apellido": "Vega", "username": "leovega", "correo": "leo@globant.com"},
        {"nombre": "Sofía", "apellido": "Díaz", "username": "sofiad", "correo": "sofia@globant.com"},
    ]
    for r in reclutadores:
        reclutador = Usuario(
            nombre=r["nombre"],
            apellido=r["apellido"],
            username=r["username"],
            correo=r["correo"],
            contrasena="Recluta123!",
            confirmado=True,
            id_empresa=empresa.id,
            id_superior=admin_emp.id,
        )
        db.session.add(reclutador)
        db.session.commit()
        asignar_rol(reclutador, "reclutador")

    print("✅ Admin-emp, managers y reclutadores creados exitosamente.")

# Ejecutar con el contexto Flask
if __name__ == "__main__":
    with app.app_context():
        crear_usuarios_con_roles()
