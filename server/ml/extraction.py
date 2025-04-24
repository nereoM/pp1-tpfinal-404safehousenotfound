import pdfplumber
from docx import Document

def extraer_texto_pdf(ruta):
    texto = ""
    with pdfplumber.open(ruta) as pdf:
        for pagina in pdf.pages:
            texto += pagina.extract_text() + "\n"
    return texto


def extraer_texto_word(ruta):
    doc = Document(ruta)
    return "\n".join([p.text for p in doc.paragraphs])
