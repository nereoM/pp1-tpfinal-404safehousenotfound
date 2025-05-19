import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os

def train_rotation_risk_model(ruta_csv, nombre_modelo='rotation_risk_model.pkl'):
    try:
        # Cargar el dataset
        df = pd.read_csv(ruta_csv)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {ruta_csv}")
        return None
    
    # Verificar columnas necesarias
    columnas_requeridas = ['ausencias_injustificadas', 'llegadas_tarde', 
                          'salidas_tempranas', 'desempeno_previo', 'Riesgo de rotacion']
    
    for col in columnas_requeridas:
        if col not in df.columns:
            print(f"Error: Falta la columna requerida '{col}' en el dataset")
            return None
    
    # Preparar los datos
    X = df[['ausencias_injustificadas', 'llegadas_tarde', 
            'salidas_tempranas', 'desempeno_previo']]
    
    # Codificar la variable objetivo (bajo, medio, alto)
    le = LabelEncoder()
    y = le.fit_transform(df['Riesgo de rotacion'])
    
    # Entrenar el modelo (usando todos los datos)
    # Usamos RandomForest por su buen desempeño en problemas de clasificación
    modelo = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'  # Para manejar posibles desbalances en las clases
    )
    
    modelo.fit(X, y)
    print("Modelo de Riesgo de rotacion entrenado correctamente")
    
    # Predecir con los mismos datos de entrenamiento (para evaluación)
    y_pred = modelo.predict(X)
    
    # Calcular métricas
    accuracy = accuracy_score(y, y_pred)
    reporte = classification_report(y, y_pred, target_names=le.classes_)
    matriz_confusion = confusion_matrix(y, y_pred)
    importancia_caracteristicas = dict(zip(X.columns, modelo.feature_importances_))
    
    # Mostrar métricas
    print("\n" + "="*50)
    print("Métricas del modelo de riesgo de rotación")
    print("="*50)
    print(f"\nExactitud (Accuracy): {accuracy:.2f}")
    print("\nReporte de clasificación:")
    print(reporte)
    print("\nMatriz de confusión:")
    print(matriz_confusion)
    print("\nImportancia de características:")
    for feature, importance in sorted(importancia_caracteristicas.items(), key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.3f}")

    # save_path_model = os.path.join(os.getcwd(), "trained_models")
    save_path_model = os.path.join("server/ml/desempeno_desarrollo/trained_models")
    if not os.path.exists(save_path_model):
        os.makedirs(save_path_model)

    joblib.dump((modelo, le), os.path.join(save_path_model, nombre_modelo))
    
    print(f"\nModelo guardado en: {os.path.join(save_path_model, nombre_modelo)}")
    
    return modelo, (accuracy, reporte, matriz_confusion, importancia_caracteristicas), le