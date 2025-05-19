import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os

def train_dismissal_risk_model(ruta_csv, guardar_modelo=True, nombre_modelo='dismissal_risk_model.pkl'):
    try:
        # Cargar el dataset
        df = pd.read_csv(ruta_csv)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {ruta_csv}")
        return None
    
    # Verificar columnas requeridas
    columnas_requeridas = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                          'desempeno_previo', 'Riesgo de rotacion', 'rendimiento_futuro',
                          'Riesgo de despido']
    
    for col in columnas_requeridas:
        if col not in df.columns:
            print(f"Error: Falta la columna requerida '{col}' en el dataset")
            return None
    
    # Preprocesamiento de datos
    # Convertir 'Riesgo de rotacion' a valores numéricos
    le_rotacion = LabelEncoder()
    df['Riesgo de rotacion_num'] = le_rotacion.fit_transform(df['Riesgo de rotacion'])
    
    # Definir características (X) y objetivo (y)
    features = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                'desempeno_previo', 'Riesgo de rotacion_num', 'rendimiento_futuro']
    X = df[features]
    y = df['Riesgo de despido']
    
    # Entrenar modelo con TODOS los datos (sin división train/test como solicitado)
    modelo = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',  # Para manejar desbalance de clases si existe
        random_state=42
    )
    
    modelo.fit(X, y)
    print("Modelo de Riesgo de despido entrenado correctamente")
    
    # Predecir con los mismos datos de entrenamiento (para evaluación)
    y_pred = modelo.predict(X)
    
    # Calcular métricas de evaluación
    reporte = classification_report(y, y_pred, output_dict=True)
    matriz_confusion = confusion_matrix(y, y_pred)
    accuracy = accuracy_score(y, y_pred)
    
    # Importancia de características
    importancia = dict(zip(features, modelo.feature_importances_))
    
    # Resultados
    resultados = {
        'accuracy': accuracy,
        'classification_report': reporte,
        'confusion_matrix': matriz_confusion.tolist(),
        'feature_importance': importancia
    }
    
    print("\nMétricas del modelo de riesgo de despido:")
    print(f"Exactitud (Accuracy): {accuracy:.2f}")
    print("\nReporte de Clasificación:")
    print(classification_report(y, y_pred))
    print("\nMatriz de Confusión:")
    print(matriz_confusion)
    print("\nImportancia de Características:")
    for feature, imp in sorted(importancia.items(), key=lambda x: x[1], reverse=True):
        print(f"{feature}: {imp:.3f}")

    save_path = os.path.join("server/ml/desempeno_desarrollo/trained_models")
    os.makedirs(save_path, exist_ok=True)
    joblib.dump(modelo, os.path.join(save_path, nombre_modelo))
    print(f"Modelo guardado en {os.path.join(save_path, nombre_modelo)}")
    
    return modelo, resultados