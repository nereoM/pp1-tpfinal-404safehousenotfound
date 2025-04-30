import pdfplumber
from docx import Document
import os
from matching_semantico import evaluar_cv_semantico
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
        texto_cv = extraer_texto_pdf(cv)
    elif cv.tipo_archivo == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        texto_cv = extraer_texto_word(cv)
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

# print(evaluar_cv_semantico(cv, ["python", "scrum", "programación", "licenciado", "flask"]))

