import pandas as pd
import joblib

def predecir_rend_futuro(ruta_csv, ruta_modelo='server/ml/trained_models/performance_model.pkl'):
    try:
        # Cargar los datos de empleados
        df = pd.read_csv(ruta_csv)
        
        # Verificar columnas requeridas
        columnas_requeridas = ['desempeno_previo', 'cantidad_proyectos', 'tamano_equipo',
                            'horas_extras', 'antiguedad', 'horas_capacitacion']
        
        missing_cols = [col for col in columnas_requeridas if col not in df.columns]
        if missing_cols:
            print(f"Error: Faltan columnas requeridas: {missing_cols}")
            return None
        
        # Cargar el modelo entrenado
        modelo = joblib.load(ruta_modelo)
        
        # Preparar datos para predicción
        X = df[columnas_requeridas]
        
        # Realizar predicciones
        df['rendimiento_futuro_predicho'] = modelo.predict(X)
        
        # Guardar resultados
        df.to_csv("server/ml/data/rendFut_predichos_use&predict.csv", index=False)

        return df
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return None
    
if __name__ == "__main__":
    predecir_rend_futuro("server/ml/data/info_empleados.csv")