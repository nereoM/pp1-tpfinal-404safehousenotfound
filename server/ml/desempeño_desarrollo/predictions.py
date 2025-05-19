import pandas as pd
import joblib
import os

"""
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
"""

def predecir_rend_futuro(df, ruta_modelo='server/ml/desempeño_desarrollo/trained_models/performance_model.pkl'):
    try:
        # current_directory = os.path.dirname(__file__)
        # ruta_modelo = os.path.join(current_directory, 'trained_models/performance_model.pkl')
        columnas_requeridas = ['desempeno_previo', 'cantidad_proyectos', 'tamano_equipo',
                            'horas_extras', 'antiguedad', 'horas_capacitacion']
        
        missing_cols = [col for col in columnas_requeridas if col not in df.columns]
        if missing_cols:
            print(f"Error: Faltan columnas requeridas: {missing_cols}")
            return None
        
        modelo = joblib.load(ruta_modelo)
        
        X = df[columnas_requeridas]

        df['rendimiento_futuro_predicho'] = modelo.predict(X)

        df.to_csv("server/ml/desempeño_desarrollo/data/rendFut_predichos_use&predict.csv", index=False)

        return df
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return None
    
def predecir_rend_futuro_individual(empleado_data, ruta_modelo='server/ml/desempeño_desarrollo/trained_models/performance_model.pkl'):

    modelo = joblib.load(ruta_modelo)

    columnas = [
        'desempeno_previo', 
        'cantidad_proyectos', 
        'tamano_equipo', 
        'horas_extras', 
        'antiguedad', 
        'horas_capacitacion'
    ]

    df = pd.DataFrame([empleado_data], columns=columnas)
    
    df['rendimiento_futuro_predicho'] = modelo.predict(df)

    # df.to_csv("data/rendFutInd_predichos_use&predict.csv", index=False)

    return df.loc[0, 'rendimiento_futuro_predicho']

def predecir_riesgo_rotacion(df, ruta_modelo='server/ml/desempeño_desarrollo/trained_models/rotation_risk_model.pkl'):
    try:
        # # Cargar los datos de empleados
        # df = pd.read_csv(ruta_csv)
        
        # Verificar columnas requeridas
        columnas_requeridas = ['ausencias_injustificadas', 'llegadas_tarde', 
                          'salidas_tempranas', 'desempeno_previo']
        
        missing_cols = [col for col in columnas_requeridas if col not in df.columns]
        if missing_cols:
            print(f"Error: Faltan columnas requeridas: {missing_cols}")
            return None
        
        # Cargar el modelo entrenado
        modelo, le = joblib.load(ruta_modelo)
        
        # Preparar datos para predicción
        X = df[columnas_requeridas]
        
        # Realizar predicciones
        predicciones_numericas = modelo.predict(X)
        df['Riesgo de rotacion predicho'] = le.inverse_transform(predicciones_numericas)
        
        # Guardar resultados
        df.to_csv("server/ml/desempeño_desarrollo/data/rotacion_predichos.csv", index=False)

        return df
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return None
    
def predecir_riesgo_rotacion_individual(empleado_data, ruta_modelo='server/ml/desempeño_desarrollo/trained_models/rotation_risk_model.pkl'):
    modelo, le = joblib.load(ruta_modelo)
    
    columnas = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas', 'desempeno_previo']
    df = pd.DataFrame([empleado_data], columns=columnas)
    pred_num = modelo.predict(df)
    riesgo = le.inverse_transform(pred_num)[0]

    df['Riesgo de rotacion predicho'] = riesgo
    # df.to_csv("data/rotacionInd_predichos.csv", index=False)

    return riesgo
    
if __name__ == "__main__":
    info_empleados = pd.read_csv("server/ml/desempeño_desarrollo/data/info_empleados.csv")
    rendFut_predichos_useANDpredict = predecir_rend_futuro(info_empleados)

    datos_empleado = {
    "desempeno_previo": 6,
    "cantidad_proyectos": 4,
    "tamano_equipo": 7,
    "horas_extras": 2,
    "antiguedad": 4,
    "horas_capacitacion": 10
    }

    resultado = predecir_rend_futuro_individual(datos_empleado)
    print(f"Rendimiento futuro predicho: {resultado}")
    rotacion_predichos = predecir_riesgo_rotacion(rendFut_predichos_useANDpredict)

    empleado = {
    "ausencias_injustificadas": 4,
    "llegadas_tarde": 25,
    "salidas_tempranas": 5,
    "desempeno_previo": 5
    }
    riesgo = predecir_riesgo_rotacion_individual(empleado)
    print(riesgo)