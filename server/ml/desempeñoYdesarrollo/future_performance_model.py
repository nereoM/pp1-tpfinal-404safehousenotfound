import pandas as pd
import numpy as np
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

def train_future_performance_model(ruta_csv):
    try:
        # Cargar el dataset
        df = pd.read_csv(ruta_csv)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {ruta_csv}")
        return None
    
    # Verificar que existan las columnas necesarias
    columnas_requeridas = ['desempeno_previo', 'cantidad_proyectos', 'tamano_equipo', 
                          'horas_extras', 'antiguedad', 'horas_capacitacion', 'rendimiento_futuro']
    
    for col in columnas_requeridas:
        if col not in df.columns:
            print(f"Error: Falta la columna requerida '{col}' en el dataset")
            return None
    
    # Preparar datos para el modelo
    X = df[['desempeno_previo', 'cantidad_proyectos', 'tamano_equipo', 
            'horas_extras', 'antiguedad', 'horas_capacitacion']]
    y = df['rendimiento_futuro']
    
    # Entrenar modelo (usando todos los datos, sin división train/test como solicitado)
    modelo = RandomForestRegressor(
        n_estimators=200,      # Número de árboles (mayor para mejor precisión)
        max_depth=12,           # Profundidad máxima de los árboles
        min_samples_split=5,    # Mínimo de muestras para dividir un nodo
        min_samples_leaf=2,     # Mínimo de muestras en hojas
        random_state=42,        # Semilla para reproducibilidad
        n_jobs=-1              # Usar todos los cores disponibles
    )
    
    modelo.fit(X, y)
    
    # Predecir con el modelo entrenado (sobre los mismos datos de entrenamiento)
    y_pred = modelo.predict(X)
    
    # Calcular métricas de evaluación
    mae = mean_absolute_error(y, y_pred)
    mse = mean_squared_error(y, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y, y_pred)
    
    metricas = {
        'MAE': mae,
        'MSE': mse,
        'RMSE': rmse,
        'R2': r2
    }
    
    # Agregar las predicciones al DataFrame original
    df['rendimiento_futuro_predicho'] = y_pred
    
    # Guardar el DataFrame con las predicciones
    #save_path = os.path.join("server/ml/data")
    save_path = os.path.join(os.getcwd(), "data")
    os.makedirs(save_path, exist_ok=True)
    nombre_archivo_pred = "rendFut_predichos_train&test.csv"
    df.to_csv(os.path.join(save_path, nombre_archivo_pred), index=False)

    #save_path_model = os.path.join("server/ml/trained_models")
    save_path_model = os.path.join(os.getcwd(), "trained_models")
    if not os.path.exists(save_path_model):
        os.makedirs(save_path_model)

    joblib.dump(modelo, os.path.join(save_path_model, "performance_model.pkl"))
    
    print("Modelo de rendimiento futuro entrenado\n")
    print("Métricas del modelo (sobre datos de entrenamiento):")
    print(f"- MAE (Error Absoluto Medio): {mae:.4f}")
    print(f"- MSE (Error Cuadrático Medio): {mse:.4f}")
    print(f"- RMSE (Raíz del Error Cuadrático Medio): {rmse:.4f}")
    print(f"- R² (Coeficiente de Determinación): {r2:.4f}")
    print("- Precision: ", modelo.score(X, y), "\n")
    
    return modelo, metricas, df