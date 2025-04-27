import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

"""
cvs = [
    "Soy ingeniero en sistemas, manejo Python, Django y Scrum",
    "Desarrollador frontend especializado en React y Javascript",
    "Administrador de empresas con experiencia en recursos humanos",
    "Programador Java con certificación en metodologías ágiles",
    "Fullstack developer experto en React, NodeJS y Python",
    "Candidato junior buscando oportunidad en IT",
    "Ingeniero con experiencia en C++, algoritmos y bases de datos"
]
"""

def entrenar_modelo_supervised(corpus_textos, etiquetas):
    vectorizador = TfidfVectorizer()
    X = vectorizador.fit_transform(corpus_textos).toarray()
    modelo = RandomForestClassifier()
    modelo.fit(X, etiquetas)
    return modelo, vectorizador

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