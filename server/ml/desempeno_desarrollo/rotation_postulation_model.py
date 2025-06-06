import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
import os

def train_rot_post_model(df, nombre_archivo_modelo="rotation_postulation_model.pkl"):
    """
    Entrena un modelo de clasificación para predecir el riesgo de rotación
    basado en cantidad_postulaciones y desempeno_previo.
    
    Args:
        df: DataFrame con las columnas ['cantidad_postulaciones', 'desempeno_previo', 'Riesgo de rotacion']
        nombre_archivo_modelo: Nombre para guardar el modelo entrenado
        
    Returns:
        El modelo entrenado y las métricas de evaluación
    """
    # Preprocesamiento
    X = df[['cantidad_postulaciones', 'desempeno_previo']]
    y = df['Riesgo de rotacion']
    
    # Codificar la variable objetivo
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Entrenar modelo con todos los datos (sin split para maximizar datos de entrenamiento)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y_encoded)
    
    # Predecir con los mismos datos de entrenamiento (para evaluación)
    y_pred = model.predict(X)
    
    # Métricas de evaluación
    print("\n=== Métricas de Evaluación ===")
    print(f"Exactitud (Accuracy): {accuracy_score(y_encoded, y_pred):.2f}")
    print("\nReporte de Clasificación:")
    print(classification_report(y_encoded, y_pred, target_names=le.classes_))
    
    # print("\nMatriz de Confusión:")
    # cm = confusion_matrix(y_encoded, y_pred)
    # sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=le.classes_, yticklabels=le.classes_)
    # plt.xlabel('Predicho')
    # plt.ylabel('Real')
    # plt.title('Matriz de Confusión')
    # plt.show()
    
    # Importancia de características
    feature_importance = pd.Series(model.feature_importances_, index=X.columns)
    print("\nImportancia de características:")
    print(feature_importance)
    
    # Visualizar importancia de características
    # plt.figure(figsize=(8, 4))
    # feature_importance.sort_values().plot(kind='barh')
    # plt.title('Importancia de Características')
    # plt.show()
    
    # Guardar modelo
    save_path = os.path.join("server/ml/desempeno_desarrollo/trained_models")
    os.makedirs(save_path, exist_ok=True)
    import joblib
    joblib.dump((model, le), os.path.join(save_path, nombre_archivo_modelo))
    
    print(f"\nModelo guardado en {os.path.join(save_path, nombre_archivo_modelo)}")
    
    return model, le

# Ejemplo de uso:
# df = pd.read_csv("server/ml/desempeno_desarrollo/data/emps_postulaciones_riesgos.csv")
# model, le = entrenar_modelo_riesgo_rotacion(df)