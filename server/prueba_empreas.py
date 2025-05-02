from main import app, db
from models.schemes import Empresa, Preferencias_empresa, Usuario, UsuarioRol, Rol
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

def cargar_empresas_y_preferencias():
    if Empresa.query.count() == 0:
        # Crear rol admin-emp si no existe (ID 3)
        rol_admin_emp = Rol.query.filter_by(id=3).first()
        if not rol_admin_emp:
            rol_admin_emp = Rol(id=3, nombre="Administrador de Empresa", permisos="crear_ofertas,ver_postulaciones", slug="admin-emp")
            db.session.add(rol_admin_emp)
            db.session.flush()

        empresas = [
            "Google", "Microsoft", "Apple", "Amazon", "Meta",
            "Netflix", "Spotify", "Globant", "Mercado Libre", "Techint"
        ]

        preferencias = [
            {"color_principal": "#4285F4", "color_secundario": "#F1F3F4", "color_texto": "#202124", "logo_url": "https://logo.clearbit.com/google.com", "slogan": "Organizando el mundo"},
            {"color_principal": "#F25022", "color_secundario": "#FFB900", "color_texto": "#000000", "logo_url": "https://logo.clearbit.com/microsoft.com", "slogan": "Empoderando cada persona"},
            {"color_principal": "#A2AAAD", "color_secundario": "#F5F5F7", "color_texto": "#1D1D1F", "logo_url": "https://logo.clearbit.com/apple.com", "slogan": "Think Different"},
            {"color_principal": "#FF9900", "color_secundario": "#232F3E", "color_texto": "#FFFFFF", "logo_url": "https://logo.clearbit.com/amazon.com", "slogan": "From A to Z"},
            {"color_principal": "#1877F2", "color_secundario": "#E7F3FF", "color_texto": "#000000", "logo_url": "https://logo.clearbit.com/meta.com", "slogan": "Conectando personas"},
            {"color_principal": "#E50914", "color_secundario": "#221F1F", "color_texto": "#FFFFFF", "logo_url": "https://logo.clearbit.com/netflix.com", "slogan": "See what's next"},
            {"color_principal": "#1DB954", "color_secundario": "#191414", "color_texto": "#FFFFFF", "logo_url": "https://logo.clearbit.com/spotify.com", "slogan": "Escuchá lo que amás"},
            {"color_principal": "#00B074", "color_secundario": "#F6F6F6", "color_texto": "#000000", "logo_url": "https://logo.clearbit.com/globant.com", "slogan": "We are reinventing industries"},
            {"color_principal": "#FFE600", "color_secundario": "#03264C", "color_texto": "#000000", "logo_url": "https://logo.clearbit.com/mercadolibre.com", "slogan": "Donde todo se encuentra"},
            {"color_principal": "#002C5F", "color_secundario": "#EAEAEA", "color_texto": "#000000", "logo_url": "https://logo.clearbit.com/techint.com", "slogan": "Construyendo el futuro"},
        ]

        for i, nombre in enumerate(empresas):
            correo = f"admin@{nombre.lower().replace(' ', '')}.com"
            username = nombre.lower().replace(' ', '') + "_admin"

            # Crear usuario sin id_empresa por ahora
            admin_emp = Usuario(
                nombre="Admin",
                apellido=nombre,
                username=username,
                correo=correo,
                contrasena="Admin123!"
            )
            db.session.add(admin_emp)
            db.session.flush()  # Para obtener admin_emp.id

            # Asignar rol
            db.session.add(UsuarioRol(id_usuario=admin_emp.id, id_rol=rol_admin_emp.id))

            # Crear empresa y asociar al admin
            nueva = Empresa(nombre=nombre, id_admin_emp=admin_emp.id)
            db.session.add(nueva)
            db.session.flush()  # Para obtener nueva.id

            # Asociar el admin con su empresa
            admin_emp.id_empresa = nueva.id

            # Crear preferencias visuales
            pref = Preferencias_empresa(
                id_empresa=nueva.id,
                color_principal=preferencias[i]["color_principal"],
                color_secundario=preferencias[i]["color_secundario"],
                color_texto=preferencias[i]["color_texto"],
                logo_url=preferencias[i]["logo_url"],
                slogan=preferencias[i]["slogan"],
                descripcion=f"Configuración inicial para {nombre}"
            )
            db.session.add(pref)

        try:
            db.session.commit()
            print("✅ Empresas, administradores y preferencias precargadas.")
        except IntegrityError as e:
            db.session.rollback()
            print(f"⚠️ Error al insertar datos: {e}")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        cargar_empresas_y_preferencias()
