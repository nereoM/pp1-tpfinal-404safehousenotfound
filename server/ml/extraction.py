import pdfplumber
from docx import Document
import os
from matching_vector import verificar_cv_apto
from matching_supervised import evaluar_cv_supervised, entrenar_modelo_supervised

def extraer_texto_pdf(ruta):
    texto = ""
    with pdfplumber.open(ruta) as pdf:
        for pagina in pdf.pages:
            texto += pagina.extract_text() + "\n"
    return texto


def extraer_texto_word(ruta):
    doc = Document(ruta)
    return "\n".join([p.text for p in doc.paragraphs])


texto_cv = extraer_texto_pdf(os.path.join("files", "cv.pdf"))

# print("Apto" if verificar_cv_apto(texto_cv, ["python", "scrum", "programación", "sql", "full", "stack", "scikit"]) else "No apto")

corpus = [
        "Soy desarrollador python con experiencia en scrum y agile.",
        "Ingeniero en sistemas experto en Java y React.",
        "Administrativo contable con experiencia en SAP.",
        "Fullstack con conocimientos de Python, Django y Javascript."
    ]

modelo, vectorizador = entrenar_modelo_supervised(corpus, [1, 1, 0, 1])

print(evaluar_cv_supervised(texto_cv, ["python", "scrum", "programación", "licenciado"], modelo, vectorizador))

