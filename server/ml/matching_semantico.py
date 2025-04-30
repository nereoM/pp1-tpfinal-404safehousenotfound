from sklearn.metrics.pairwise import cosine_similarity
from main import modelo_sbert
import re



def dividir_cv_en_partes(cv_texto):
    bloques = re.split(r"[./;•|\n\-]+", cv_texto)

    partes = []
    for bloque in bloques:
        bloque = bloque.strip()
        if bloque:
            partes.append(bloque)
            palabras = bloque.split()
            partes.extend([p.strip() for p in palabras if p.strip()])

    return list(set(partes))

def evaluar_cv_semantico(cv_texto, palabras_clave, umbral_individual=0.55):
    partes_cv = dividir_cv_en_partes(cv_texto)
    vectores_cv = modelo_sbert.encode(partes_cv)

    for palabra in palabras_clave:
        vector_palabra = modelo_sbert.encode(palabra)
        similitudes = cosine_similarity([vector_palabra], vectores_cv)[0]

        max_sim = max(similitudes)
        print(f"'{palabra}': similitud máxima = {max_sim:.2f}")

        if max_sim < umbral_individual:
            return False

    return True