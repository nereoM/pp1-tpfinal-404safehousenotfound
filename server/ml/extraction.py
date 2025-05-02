import pdfplumber
from docx import Document
import os
from .matching_semantico import evaluar_cv_semantico
import json

def extraer_texto_pdf(ruta):
    texto = ""
    with pdfplumber.open(ruta) as pdf:
        for pagina in pdf.pages:
            texto += pagina.extract_text() + "\n"
    return texto


def extraer_texto_word(ruta):
    doc = Document(ruta)
    return "\n".join([p.text for p in doc.paragraphs])

def obtener_palabras_clave(palabras_clave_json):
    try:
        return json.loads(palabras_clave_json)
    except Exception as e:
        print(f"Error al convertir JSON a lista: {e}")
        return []

# texto_cv = extraer_texto_pdf(os.path.join("uploads/cvs", "file.pdf"))

def predecir_cv(palabras_clave, cv):
    lista_palabras = obtener_palabras_clave(palabras_clave)
    if not lista_palabras:
        raise Exception("No se encontraron palabras clave en la oferta laboral.")
    if not cv:
        raise Exception("No se encontró el CV para el usuario actual.")
    if cv.tipo_archivo == "application/pdf":
        texto_cv = extraer_texto_pdf(cv.url_cv)
    elif cv.tipo_archivo == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        texto_cv = extraer_texto_word(cv.url_cv)
    else:
        raise Exception("Formato de archivo no soportado.")

    return evaluar_cv_semantico(texto_cv, lista_palabras)


corpus = [
        "Soy desarrollador python con experiencia en scrum y agile.",
        "Ingeniero en sistemas experto en Java y React.",
        "Administrativo contable con experiencia en SAP.",
        "Fullstack con conocimientos de Python, Django y Javascript."
    ]

# modelo, vectorizador = entrenar_modelo_supervised(corpus, [1, 1, 0, 1])

# print(evaluar_cv_supervised(texto_cv, ["python", "scrum", "programación", "licenciado"], modelo, vectorizador))

cv = """
Actualmente tengo 22 años y me encuentro en búsqueda activa de oportunidades laborales que me permitan aplicar y desarrollar mis conocimientos de forma profesional. Estoy finalizando la carrera de Técnico Universitario en Informática, y próximamente continuaré con la Licenciatura en Sistemas.

Mi formación se vincula estrechamente con distintas áreas del campo tecnológico, destacándome principalmente en el desarrollo y mantenimiento de software. He trabajado en proyectos donde desempeñé el rol de desarrollador de software, participando en la implementación de soluciones full stack, integrando bases de datos, backend en Python y frontend con React.

Además, tengo experiencia en la gestión de bases de datos, programación en lenguajes como Java, Python y C, y un fuerte interés por las metodologías ágiles como Scrum. Me interesa particularmente continuar creciendo como software developer, enfocándome en soluciones escalables y colaborativas.
"""

cv_marketing = """
Soy una profesional con más de 3 años de experiencia en la planificación y ejecución de campañas publicitarias. 
Durante mi recorrido he liderado proyectos de promoción de marca en redes sociales, optimizado contenidos y gestionado presupuestos destinados a anuncios digitales. 
Mi enfoque está en la creación de estrategias de comunicación efectivas, así como en el análisis de métricas para mejorar el alcance y la conversión.

He trabajado con herramientas como Google Ads, Meta Business Suite y plataformas de email marketing. 
Mi objetivo es seguir creciendo en el área de posicionamiento online y aportar valor a marcas que buscan escalar su presencia en el mercado digital.
"""
palabras_clave = [
    "publicidad digital",
    "estrategia de marketing",
    "social media",
    "analítica digital",
    "branding",
    "SEM",
    "marketing online"
]

# print(evaluar_cv_semantico(cv_marketing, palabras_clave))

