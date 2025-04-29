import pdfplumber
from docx import Document
import os
from ml.matching_supervised import evaluar_cv_supervised, entrenar_modelo_supervised
from models.schemes import CV, Oferta_laboral
from flask_jwt_extended import get_jwt_identity

def extraer_texto_pdf(ruta):
    texto = ""
    with pdfplumber.open(ruta) as pdf:
        for pagina in pdf.pages:
            texto += pagina.extract_text() + "\n"
    return texto


def extraer_texto_word(ruta):
    doc = Document(ruta)
    return "\n".join([p.text for p in doc.paragraphs])


# texto_cv = extraer_texto_pdf(os.path.join("files", "cv.pdf"))

def predecir_cv(id_oferta, cv):
    id_candidato = get_jwt_identity()
    cv = CV.query.filter_by(id_candidato=id_candidato).first()
    if not cv:
        raise Exception("No se encontró el CV para el usuario actual.")
    if cv.tipo_archivo == "application/pdf":
        texto_cv = extraer_texto_pdf(cv.url_cv)
    elif cv.tipo_archivo == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        texto_cv = extraer_texto_word(cv.url_cv)
    else:
        raise Exception("Formato de archivo no soportado.")
    oferta = Oferta_laboral.query.get(id_oferta)
    palabras_clave = oferta.palabras_clave.split(",")
    modelo = oferta.modelo
    vectorizador = oferta.vectorizador

    return evaluar_cv_supervised(texto_cv, palabras_clave, modelo, vectorizador)

"""
def recuperar_cv(ruta_cv):
    id_candidato = get_jwt_identity()
    cv = CV.query.filter_by(id_candidato=id_candidato).first()
    if not cv:
        raise Exception("No se encontró el CV para el usuario actual.")
    if cv.tipo_archivo == "application/pdf":
        return extraer_texto_pdf(ruta_cv)
    elif cv.tipo_archivo == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return extraer_texto_word(ruta_cv)
    else:
        raise Exception("Formato de archivo no soportado.")

"""


corpus = [
        "Soy desarrollador python con experiencia en scrum y agile.",
        "Ingeniero en sistemas experto en Java y React.",
        "Administrativo contable con experiencia en SAP.",
        "Fullstack con conocimientos de Python, Django y Javascript."
    ]

# modelo, vectorizador = entrenar_modelo_supervised(corpus, [1, 1, 0, 1])

# print(evaluar_cv_supervised(texto_cv, ["python", "scrum", "programación", "licenciado"], modelo, vectorizador))

