from main import app
from models.schemes import db, Usuario, Rol, Empresa, Oferta_laboral, Oferta_analista, Preferencias_empresa
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import json
import random
from sqlalchemy import text

def asignar_rol(usuario, slug_rol):
    rol = Rol.query.filter_by(slug=slug_rol).first()
    if not rol:
        rol = Rol(nombre=slug_rol.capitalize(), slug=slug_rol, permisos="*")
        db.session.add(rol)
        db.session.commit()
    usuario.roles.append(rol)

ofertas_generales = [
    # IT
    {
        "nombre": "Desarrollador Frontend",
        "descripcion": "React + TailwindCSS.",
        "location": "Buenos Aires",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 320000,
        "salary_max": 450000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["React", "Tailwind", "JavaScript"]
    },
    {
        "nombre": "DevOps Engineer",
        "descripcion": "Experiencia en CI/CD, Docker y Kubernetes.",
        "location": "Córdoba",
        "employment_type": "Full-Time",
        "workplace_type": "Híbrido",
        "salary_min": 350000,
        "salary_max": 500000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["Docker", "Kubernetes", "CI/CD", "AWS"]
    },
    {
        "nombre": "Soporte Técnico",
        "descripcion": "Atención de tickets y soporte de hardware y software.",
        "location": "Rosario",
        "employment_type": "Full-Time",
        "workplace_type": "Presencial",
        "salary_min": 150000,
        "salary_max": 180000,
        "currency": "ARS",
        "experience_level": "Junior",
        "palabras_clave": ["Soporte", "Hardware", "Software", "Tickets"]
    },
    {
        "nombre": "Desarrollador Backend",
        "descripcion": "Desarrollo de APIs y microservicios con Python y Django.",
        "location": "Buenos Aires",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 380000,
        "salary_max": 500000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["Python", "Django", "API", "Microservicios", "Backend"]
    },
    {
        "nombre": "Full Stack Developer",
        "descripcion": "Aplicaciones web completas con React, Node.js y SQL.",
        "location": "Córdoba",
        "employment_type": "Full-Time",
        "workplace_type": "Híbrido",
        "salary_min": 350000,
        "salary_max": 480000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["React", "Node.js", "SQL", "JavaScript", "Full Stack"]
    },
    {
        "nombre": "Data Engineer",
        "descripcion": "Construcción y optimización de pipelines de datos en AWS.",
        "location": "Mendoza",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 400000,
        "salary_max": 600000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["AWS", "Big Data", "Python", "SQL", "Data Engineering"]
    },
    {
        "nombre": "Machine Learning Engineer",
        "descripcion": "Entrenamiento de modelos predictivos con Python y TensorFlow.",
        "location": "Rosario",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 420000,
        "salary_max": 550000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["Machine Learning", "Python", "TensorFlow", "Scikit-Learn", "Modelos Predictivos"]
    },
    {
        "nombre": "DevOps Engineer",
        "descripcion": "Automatización y CI/CD con Docker, Kubernetes y AWS.",
        "location": "San Juan",
        "employment_type": "Full-Time",
        "workplace_type": "Híbrido",
        "salary_min": 450000,
        "salary_max": 600000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["DevOps", "Docker", "Kubernetes", "CI/CD", "AWS", "Cloud"]
    },
    {
        "nombre": "Cloud Architect",
        "descripcion": "Diseño y despliegue de arquitecturas en AWS y Azure.",
        "location": "La Plata",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 480000,
        "salary_max": 700000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["AWS", "Azure", "Cloud", "Microservicios", "Arquitectura"]
    },
    {
        "nombre": "Administrador de Base de Datos",
        "descripcion": "Gestión de bases de datos relacionales y no relacionales.",
        "location": "Santa Fe",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 300000,
        "salary_max": 400000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["SQL", "NoSQL", "MySQL", "PostgreSQL", "MongoDB"]
    },
    {
        "nombre": "QA Automation Engineer",
        "descripcion": "Pruebas automatizadas para aplicaciones web y microservicios.",
        "location": "Buenos Aires",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 320000,
        "salary_max": 450000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["QA", "Testing", "Automatización", "Selenium", "Microservicios"]
    },
    {
        "nombre": "Administrador de Redes",
        "descripcion": "Monitoreo y configuración de redes empresariales.",
        "location": "Córdoba",
        "employment_type": "Full-Time",
        "workplace_type": "Presencial",
        "salary_min": 250000,
        "salary_max": 300000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["Redes", "Administración", "Cisco", "Firewall", "Seguridad"]
    },
    {
        "nombre": "Especialista en Seguridad Informática",
        "descripcion": "Implementación de políticas de seguridad y prevención de ataques.",
        "location": "Buenos Aires",
        "employment_type": "Full-Time",
        "workplace_type": "Remoto",
        "salary_min": 450000,
        "salary_max": 650000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["Seguridad", "Firewall", "Ciberseguridad", "Redes", "AWS"]
    },
    
    # Comercial
    {
        "nombre": "Vendedor Comercial",
        "descripcion": "Venta de productos industriales.",
        "location": "Mendoza",
        "employment_type": "Full-Time",
        "workplace_type": "Presencial",
        "salary_min": 200000,
        "salary_max": 250000,
        "currency": "ARS",
        "experience_level": "Junior",
        "palabras_clave": ["Ventas", "Comercial", "Negociación"]
    },
    {
        "nombre": "Representante de Ventas",
        "descripcion": "Manejo de clientes y generación de nuevos negocios.",
        "location": "Santa Fe",
        "employment_type": "Full-Time",
        "workplace_type": "Híbrido",
        "salary_min": 220000,
        "salary_max": 280000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["Ventas", "Clientes", "Negociación"]
    },

    # Contable y administrativo
    {
        "nombre": "Analista Contable",
        "descripcion": "Contadora con experiencia en AFIP.",
        "location": "Rosario",
        "employment_type": "Full-Time",
        "workplace_type": "Presencial",
        "salary_min": 220000,
        "salary_max": 300000,
        "currency": "ARS",
        "experience_level": "Junior",
        "palabras_clave": ["Contabilidad", "Balance", "AFIP"]
    },
    {
        "nombre": "Asistente Administrativo",
        "descripcion": "Tareas generales de oficina.",
        "location": "Salta",
        "employment_type": "Full-Time",
        "workplace_type": "Presencial",
        "salary_min": 190000,
        "salary_max": 240000,
        "currency": "ARS",
        "experience_level": "Junior",
        "palabras_clave": ["Administración", "Planillas", "Excel"]
    },

    # Industria y producción
    {
        "nombre": "Técnico de Mantenimiento",
        "descripcion": "Mantenimiento preventivo y correctivo en planta.",
        "location": "San Juan",
        "employment_type": "Full-Time",
        "workplace_type": "Presencial",
        "salary_min": 250000,
        "salary_max": 300000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["Mantenimiento", "Electricidad", "Producción"]
    },

    # Gastronomía y servicios
    {
        "nombre": "Mozo/a de salón",
        "descripcion": "Con experiencia en restaurante.",
        "location": "Mendoza",
        "employment_type": "Part-Time",
        "workplace_type": "Presencial",
        "salary_min": 150000,
        "salary_max": 180000,
        "currency": "ARS",
        "experience_level": "Junior",
        "palabras_clave": ["Mozo", "Atención", "Turnos"]
    },
    {
        "nombre": "Cocinero/a",
        "descripcion": "Preparación de platos, control de stock y limpieza.",
        "location": "Mar del Plata",
        "employment_type": "Full-Time",
        "workplace_type": "Presencial",
        "salary_min": 180000,
        "salary_max": 230000,
        "currency": "ARS",
        "experience_level": "Semi Senior",
        "palabras_clave": ["Cocina", "Gastronomía", "Stock", "Platos"]
    },

    # Marketing y comunicación
    {
        "nombre": "Especialista en Marketing Digital",
        "descripcion": "SEO/SEM.",
        "location": "La Plata",
        "employment_type": "Full-Time",
        "workplace_type": "Híbrido",
        "salary_min": 250000,
        "salary_max": 400000,
        "currency": "ARS",
        "experience_level": "Senior",
        "palabras_clave": ["Marketing", "SEO", "SEM"]
    }
]

def crear_estructura_empresas_y_ofertas():
    empresas_info = [
        {"nombre": "Globant", "admin": {"nombre": "Valentina", "apellido": "Martínez", "username": "valemtz", "correo": "valentina@globant.com"}},
        {"nombre": "Techint", "admin": {"nombre": "Carlos", "apellido": "López", "username": "carloslpz", "correo": "carlos@techint.com"}},
        {"nombre": "Mercado Libre", "admin": {"nombre": "Julieta", "apellido": "Ramos", "username": "julir", "correo": "julieta@mercadolibre.com"}}, 
        {"nombre": "Nintendo", "admin": {"nombre": "Ricardo", "apellido": "Fernández", "username": "rfernandez", "correo": "ricardo@nintendo.com"}},
        {"nombre": "Metrovias", "admin": {"nombre": "Federico", "apellido": "Guzmán", "username": "fguzman", "correo": "federico@metrovias.com"}},
        {"nombre": "Starbucks", "admin": {"nombre": "Martina", "apellido": "Herrera", "username": "mherrera", "correo": "martina@starbucks.com"}},
        {"nombre": "Twitch", "admin": {"nombre": "Mariana", "apellido": "Pereyra", "username": "mpereyra", "correo": "mariana@twitch.com"}},
        {"nombre": "Spotify", "admin": {"nombre": "Luciano", "apellido": "Franco", "username": "lfranco", "correo": "luciano@spotify.com"}},
        {"nombre": "Netflix", "admin": {"nombre": "Roman", "apellido": "Quiroga", "username": "rquiroga", "correo": "roman@netflix.com"}},
        {"nombre": "Pepsi", "admin": {"nombre": "Pedro", "apellido": "Mendieta", "username": "pmendieta", "correo": "pedro@pepsi.com"}}
    ]

    for empresa_info in empresas_info:
        nombre_empresa = empresa_info["nombre"]
        admin_info = empresa_info["admin"]

        admin_emp = Usuario(
            nombre=admin_info["nombre"],
            apellido=admin_info["apellido"],
            username=admin_info["username"],
            correo=admin_info["correo"],
            contrasena="Admin123!",
            confirmado=True
        )
        db.session.add(admin_emp)
        db.session.commit()

        empresa = Empresa(nombre=nombre_empresa, id_admin_emp=admin_emp.id)
        db.session.add(empresa)
        db.session.commit()

        # Crear preferencias personalizadas según la empresa
        if nombre_empresa.lower() == "globant":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#00B86B",  # Verde
                color_secundario="#FFFFFF",  # Blanco
                color_texto="#000000",      # Negro
                slogan="Bienvenido a Globant",
                icon_url="https://openqube.io/wp-content/uploads/2015/06/Short-Original-501x330.png",
                image_url="https://statics.globant.com/production/public/2022-02/branded-photos-07.png"
            )
        elif nombre_empresa.lower() == "techint":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#000000",  # Rojo
                color_secundario="#FFFFFF",  # Blanco
                color_texto="#000000",      # Negro
                slogan="Bienvenido a Techint",
                icon_url="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Techint_Logo.svg/800px-Techint_Logo.svg.png",
                image_url="https://limpronacional.com/wp-content/uploads/2013/08/TECHINT.png"
            )
        elif nombre_empresa.lower() == "mercado libre":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#FFE600",  # Amarillo
                color_secundario="#FFFFFF",  # Blanco
                color_texto="#000000",      # Negro
                slogan="Bienvenido a MercadoLibre",
                icon_url="https://cdn2.downdetector.com/static/uploads/logo/MercadoLibre_BmN6sLa.png",
                image_url="https://caracol.com.co/resizer/v2/SXVGMHUEI5A2DBHZIAPZST577E.jpg?auth=96bd13f5fdc196d1dcd923a34e217edaf06b3d52d420eb51f9ad38efd34d4759&width=650&height=488&quality=70&smart=true"
            )
        elif nombre_empresa.lower() == "nintendo":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#FF0000",
                color_secundario="#FFFFFF",
                color_texto="#000000",
                slogan="Bienvenido a Nintendo",
                icon_url="https://i.pinimg.com/736x/29/bd/dc/29bddc6ace851b19363d032ad117f393.jpg",
                image_url="https://i.pinimg.com/736x/05/60/04/0560048531cd851ec26f788bc6337ff1.jpg"
            )
        elif nombre_empresa.lower() == "pepsi":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#0D00FF",
                color_secundario="#FFFFFF",
                color_texto="#000000",
                slogan="Bienvenido a Pepsi",
                icon_url="https://cdn-icons-png.flaticon.com/512/732/732236.png",
                image_url="https://static.comunicae.com/photos/notas/1252967/Camarero_sirviendo_Pepsi_en_uno_de_los_eventos_de_la_marca_en_Espaa.jpg"
            )
        elif nombre_empresa.lower() == "netflix":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#FF0000",
                color_secundario="#FFFFFF",
                color_texto="#000000",
                slogan="Bienvenido a Netflix",
                icon_url="https://cdn-icons-png.flaticon.com/512/732/732228.png",
                image_url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5QsVoHQhKFmyhrLmHH_LszTbrMFAMJ0eY2Q&s"
            )
        elif nombre_empresa.lower() == "starbucks":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#107900",
                color_secundario="#FFFFFF",
                color_texto="#000000",
                slogan="Bienvenido a Starbucks",
                icon_url="https://cdn-icons-png.flaticon.com/512/5977/5977591.png",
                image_url="https://okdiario.com/img/2021/11/01/por-que-el-logo-de-starbucks-es-una-sirena-conoce-su-sorprendente-historia.jpg"
            )
        elif nombre_empresa.lower() == "metrovias":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#3D413D",
                color_secundario="#F6FF00",
                color_texto="#000000",
                slogan="Bienvenido a Metrovias",
                icon_url="https://www.integri-sys.com/wp-content/uploads/metrovias.png",
                image_url="https://hurlinghampost.com/wp-content/uploads/2023/04/tren.webp"
            )
        elif nombre_empresa.lower() == "spotify":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#18B100",
                color_secundario="#FFFFFF",
                color_texto="#000000",
                slogan="Bienvenido a Spotify",
                icon_url="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/480px-Spotify_logo_without_text.svg.png",
                image_url="https://industriamusical.com/wp-content/uploads/2024/11/Spotify.png"
            )
        elif nombre_empresa.lower() == "twitch":
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#C300FF",
                color_secundario="#FFFFFF",
                color_texto="#000000",
                slogan="Bienvenido a Twitch",
                icon_url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcQNjBcpB-xCcBv1n7MYgepsgIy4e0kCnpng&s",
                image_url="https://wallpapers.com/images/hd/twitch-background-foflejk41c5i0ic5.jpg"
            )
        else:
            preferencias = Preferencias_empresa(
                id_empresa=empresa.id,
                color_principal="#3B82F6",
                color_secundario="#E0E7FF",
                color_texto="#111827",
                slogan=f"Bienvenido a {nombre_empresa}",
                icon_url="",
                image_url=""
            )
        db.session.add(preferencias)
        db.session.commit()

        admin_emp.id_empresa = empresa.id
        db.session.commit()
        asignar_rol(admin_emp, "admin-emp")

        # Crear managers
        manager = Usuario(
            nombre=f"Manager_{nombre_empresa}",
            apellido="Gómez",
            username=f"manager_{nombre_empresa.lower()}",
            correo=f"manager@{nombre_empresa.lower().replace(' ', '')}.com",
            contrasena="Manager123!",
            confirmado=True,
            id_empresa=empresa.id,
            id_superior=admin_emp.id,
            puesto_trabajo="manager"
        )
        db.session.add(manager)
        db.session.commit()
        asignar_rol(manager, "manager")

        # Crear reclutadores (analistas) y asignar rol
        reclutador_objs = []
        for i in range(1, 4):  # Tres reclutadores por empresa
            reclutador = Usuario(
                nombre=f"Reclutador{i}_{nombre_empresa}",
                apellido="Pérez",
                username=f"reclutador{i}_{nombre_empresa.lower()}",
                correo=f"reclutador{i}@{nombre_empresa.lower().replace(' ', '')}.com",
                contrasena="Recluta123!",
                confirmado=True,
                id_empresa=empresa.id,
                id_superior=manager.id,
                puesto_trabajo="reclutador",
            )
            db.session.add(reclutador)
            db.session.commit()
            asignar_rol(reclutador, "reclutador")
            reclutador_objs.append(reclutador)

        # Crear todas las ofertas y asignarlas
        for o in ofertas_generales:
            nueva_oferta = Oferta_laboral(
                id_empresa=empresa.id,
                nombre=o["nombre"],
                descripcion=o["descripcion"],
                location=o["location"],
                employment_type=o["employment_type"],
                workplace_type=o["workplace_type"],
                salary_min=o["salary_min"],
                salary_max=o["salary_max"],
                currency=o["currency"],
                experience_level=o["experience_level"],
                is_active=True,
                id_creador=manager.id,
                palabras_clave=json.dumps(o["palabras_clave"]),
                fecha_publicacion=datetime.utcnow(),
                fecha_cierre=datetime.utcnow() + timedelta(days=30),
                umbral_individual=random.uniform(0.3, 0.8),
            )
            db.session.add(nueva_oferta)
            db.session.commit()

            # 🔥 Asignación aleatoria a reclutadores
            reclutador_asignado = random.choice(reclutador_objs)
            asignacion = Oferta_analista(
                id_oferta=nueva_oferta.id,
                id_analista=reclutador_asignado.id
            )
            db.session.add(asignacion)
        
        db.session.commit()
    print("✅ Empresas, usuarios, ofertas y asignaciones creadas correctamente.")

if __name__ == "__main__":
    with app.app_context():
        crear_estructura_empresas_y_ofertas()
