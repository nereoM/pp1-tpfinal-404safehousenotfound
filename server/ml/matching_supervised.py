import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import pickle
import json
from models.schemes import Oferta_laboral


def cargar_modelo_de_oferta(id_oferta):
    oferta = Oferta_laboral.query.get(id_oferta)

    if not oferta:
        raise Exception(f"No se encontró la oferta laboral con id {id_oferta}")

    modelo = pickle.loads(oferta.modelo)
    vectorizador = pickle.loads(oferta.vectorizador)
    palabras_clave = json.loads(oferta.palabras_clave)

    return modelo, vectorizador, palabras_clave

def serializar_modelo_y_vectorizador(modelo, vectorizador):
    modelo_bytes = pickle.dumps(modelo)
    vectorizador_bytes = pickle.dumps(vectorizador)
    return modelo_bytes, vectorizador_bytes

def serializar_palabras_clave(palabras_clave):
    return json.dumps(palabras_clave)

def cargar_cvs_para_entrenamiento(ruta_csv=os.path.join("files", "cv_dataset_final.pdf"), solo_texto=True):
    df = pd.read_csv(ruta_csv)

    if 'cv' not in df.columns or 'label' not in df.columns:
        raise ValueError("El CSV debe tener las columnas 'cv' y 'label'.")

    cvs = df['cv'].tolist()

    if solo_texto:
        return cvs
    else:
        etiquetas = df['label'].tolist()
        return cvs, etiquetas

def entrenar_modelo_supervised(corpus_textos, etiquetas):
    vectorizador = TfidfVectorizer()
    X = vectorizador.fit_transform(corpus_textos).toarray()
    modelo = RandomForestClassifier()
    modelo.fit(X, etiquetas)
    modelo_bytes, vectorizador_bytes = serializar_modelo_y_vectorizador(modelo, vectorizador)
    etiquetas_serializadas = serializar_palabras_clave(etiquetas)
    return modelo_bytes, vectorizador_bytes, etiquetas_serializadas

def evaluar_cv_supervised(cv_texto, palabras_clave, modelo, vectorizador, umbral_similitud=0.6):
    X_nuevo = vectorizador.transform([cv_texto]).toarray()
    prediccion = modelo.predict(X_nuevo)

    palabras_clave_texto = " ".join(palabras_clave)
    vectores = vectorizador.transform([cv_texto, palabras_clave_texto]).toarray()

    similitud = cosine_similarity([vectores[0]], [vectores[1]])[0][0]

    texto_normalizado = cv_texto.lower()
    todas_presentes = all(palabra.lower() in texto_normalizado for palabra in palabras_clave)

    if prediccion[0] == 1 and (similitud >= umbral_similitud or todas_presentes):
        return "Apto"
    else:
        return "No Apto"
    
"""
corpus = [
        "Soy desarrollador python con experiencia en scrum y agile.",
        "Ingeniero en sistemas experto en Java y React.",
        "Administrativo contable con experiencia en SAP.",
        "Fullstack con conocimientos de Python, Django y Javascript."
    ]

etiquetas = [1, 1, 0, 1]

modelo, vectorizador = entrenar_modelo(corpus, etiquetas)

cv = "Desarrollador web, especializado en metodologías ágiles como Scrum. Python avanzado. conocimientos en full stack y Django."
palabras_clave = ["Python", "full", "stack"]

resultado = evaluar_cv_supervised(cv, palabras_clave, modelo, vectorizador)
print("Resultado:", resultado)
"""