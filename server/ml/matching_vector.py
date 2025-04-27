from sklearn.feature_extraction.text import TfidfVectorizer

def verificar_cv_apto(texto_cv, palabras_clave, umbral=0.6):
    
    vectorizer = TfidfVectorizer(vocabulary=[p.lower() for p in palabras_clave])
    vector = vectorizer.fit_transform([texto_cv.lower()])

    presentes = [palabra for palabra in palabras_clave if palabra.lower() in vectorizer.get_feature_names_out() and vector[0, vectorizer.vocabulary_[palabra.lower()]] > 0]

    return len(presentes) == len(palabras_clave)




