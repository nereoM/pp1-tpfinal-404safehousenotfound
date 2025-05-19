import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os

def train_resignation_risk_model(ruta_csv, nombre_modelo="resignation_risk_model.pkl"):
    try:
        # Cargar el dataset
        df = pd.read_csv(ruta_csv)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {ruta_csv}")
        return None
    
    # Verificar columnas necesarias
    columnas_requeridas = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                          'Riesgo de rotacion', 'Riesgo de despido', 'rendimiento_futuro',
                          'Riesgo de renuncia']
    
    for col in columnas_requeridas:
        if col not in df.columns:
            print(f"Error: Falta la columna requerida '{col}' en el dataset")
            return None
    
    # Preprocesamiento de datos
    # Convertir riesgos categóricos a numéricos
    # riesgo_mapping = {'bajo': 0, 'medio': 1, 'alto': 2}
    # df['Riesgo de rotacion'] = df['Riesgo de rotacion'].map(riesgo_mapping)
    # df['Riesgo de despido'] = df['Riesgo de despido'].map(riesgo_mapping)
    le_rotacion = LabelEncoder()
    df['Riesgo de rotacion_num'] = le_rotacion.fit_transform(df['Riesgo de rotacion'])
    le_despido = LabelEncoder()
    df['Riesgo de despido_num'] = le_rotacion.fit_transform(df['Riesgo de despido'])

    # Definir características (X) y variable objetivo (y)
    # features = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
    #             'Riesgo de rotacion', 'Riesgo de despido', 'rendimiento_futuro']

    features = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                'Riesgo de rotacion_num', 'Riesgo de despido_num', 'rendimiento_futuro']
    
    X = df[features]
    y = df['Riesgo de renuncia']
    
    # Codificar la variable objetivo
    # le = LabelEncoder()
    # y_encoded = le.fit_transform(y)
    
    # Entrenar el modelo con todos los datos
    modelo = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',  # Para manejar posibles desbalances en las clases
        random_state=42
    )
    
    # modelo.fit(X, y_encoded)
    modelo.fit(X, y)
    print("Modelo de Riesgo de renuncia entrenado correctamente")
    
    # Predecir con los mismos datos de entrenamiento (para evaluación)
    y_pred = modelo.predict(X)
    
    # Métricas de evaluación
    # reporte_clasificacion = classification_report(y_encoded, y_pred, target_names=le.classes_)
    # matriz_confusion = confusion_matrix(y_encoded, y_pred)
    # exactitud = accuracy_score(y_encoded, y_pred)

    reporte_clasificacion = classification_report(y, y_pred, output_dict=True)
    matriz_confusion = confusion_matrix(y, y_pred)
    exactitud = accuracy_score(y, y_pred)
    
    # Importancia de características
    importancia_caracteristicas = dict(zip(features, modelo.feature_importances_))
    
    # Resultados
    resultados = {
        'exactitud': exactitud,
        'reporte_clasificacion': reporte_clasificacion,
        'matriz_confusion': matriz_confusion,
        'importancia_caracteristicas': importancia_caracteristicas,
        # 'classes': le.classes_.tolist()
    }
    
    # Mostrar métricas
    print("\n=== Métricas del modelo de renuncia ===")
    print(f"Exactitud (Accuracy): {exactitud:.2f}")
    print("\nReporte de Clasificación:")
    print(reporte_clasificacion)
    print("\nMatriz de Confusión:")
    print(matriz_confusion)
    print("\nImportancia de Características:")
    for feature, importance in importancia_caracteristicas.items():
        print(f"{feature}: {importance:.3f}")

    # Guardar el modelo 
    save_path = os.path.join("server/ml/desempeno_desarrollo/trained_models")
    os.makedirs(save_path, exist_ok=True)
    joblib.dump(modelo, os.path.join(save_path, nombre_modelo))
    print(f"Modelo guardado en {os.path.join(save_path, nombre_modelo)}")
    
    return modelo, resultados