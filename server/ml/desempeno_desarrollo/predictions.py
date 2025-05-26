import pandas as pd
import joblib
import os
from sklearn.preprocessing import LabelEncoder
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def predecir_rend_futuro(df, ruta_modelo=os.path.join(BASE_DIR, 'trained_models/performance_model.pkl')):
    try:
        # current_directory = os.path.dirname(__file__)
        # ruta_modelo = os.path.join(current_directory, 'trained_models/performance_model.pkl')
        columnas_requeridas = ['desempeno_previo', 'ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                            'horas_extras', 'antiguedad', 'horas_capacitacion']
        
        missing_cols = [col for col in columnas_requeridas if col not in df.columns]
        if missing_cols:
            print(f"Error: Faltan columnas requeridas: {missing_cols}")
            return None
        
        modelo = joblib.load(ruta_modelo)
        
        X = df[columnas_requeridas]

        df['rendimiento_futuro_predicho'] = np.round(modelo.predict(X), 2)  # <-- Solo dos decimales

        df.to_csv(os.path.join(BASE_DIR, 'data/rendFut_predichos_use&predict.csv'), index=False)

        return df
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return None
    
def predecir_rend_futuro_individual(empleado_data, ruta_modelo=os.path.join(BASE_DIR, 'trained_models/performance_model.pkl')):

    modelo = joblib.load(ruta_modelo)

    columnas = [
        'desempeno_previo', 
        'ausencias_injustificadas', 
        'llegadas_tarde',
        'salidas_tempranas',
        'horas_extras', 
        'antiguedad', 
        'horas_capacitacion'
    ]

    df = pd.DataFrame([empleado_data], columns=columnas)
    
    df['rendimiento_futuro_predicho'] = np.round(modelo.predict(df), 2)

    # df.to_csv("data/rendFutInd_predichos_use&predict.csv", index=False)

    return df.loc[0, 'rendimiento_futuro_predicho']

def predecir_riesgo_rotacion(df, ruta_modelo=os.path.join(BASE_DIR, 'trained_models/rotation_risk_model.pkl')):
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
        df.to_csv(os.path.join(BASE_DIR, 'data/rotacion_predichos.csv'), index=False)

        return df
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return None
    
def predecir_riesgo_rotacion_individual(empleado_data, ruta_modelo=os.path.join(BASE_DIR, 'trained_models/rotation_risk_model.pkl')):
    modelo, le = joblib.load(ruta_modelo)
    
    columnas = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas', 'desempeno_previo']
    df = pd.DataFrame([empleado_data], columns=columnas)
    pred_num = modelo.predict(df)
    riesgo = le.inverse_transform(pred_num)[0]

    df['Riesgo de rotacion predicho'] = riesgo
    # df.to_csv("data/rotacionInd_predichos.csv", index=False)

    return riesgo

def predecir_riesgo_despido(df, ruta_modelo=os.path.join(BASE_DIR, 'trained_models/dismissal_risk_model.pkl')):
    try:
        # Cargar los datos de empleados
        # df = pd.read_csv(ruta_csv)
        
        # Verificar columnas requeridas
        columnas_requeridas = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                              'desempeno_previo', 'Riesgo de rotacion predicho', 'rendimiento_futuro_predicho']
        
        missing_cols = [col for col in columnas_requeridas if col not in df.columns]
        if missing_cols:
            print(f"Error: Faltan columnas requeridas: {missing_cols}")
            return None
        
        # Cargar el modelo entrenado
        modelo = joblib.load(ruta_modelo)
        
        # Preprocesamiento igual que en el entrenamiento
        # Necesitamos el mismo LabelEncoder usado durante el entrenamiento
        # deberiamos guardar y cargar este encoder al entrenar
        le_rotacion = LabelEncoder()
        le_rotacion.fit(['bajo', 'medio', 'alto'])  # Asumiendo estos son los valores posibles
        df['Riesgo de rotacion_num'] = le_rotacion.transform(df['Riesgo de rotacion predicho'])
        
        # Renombrar rendimiento_futuro_predicho
        df.rename(columns={'rendimiento_futuro_predicho': 'rendimiento_futuro'}, inplace=True)

        # Preparar datos para predicción (usar MISMAS features que en entrenamiento)
        features_modelo = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                        'desempeno_previo', 'Riesgo de rotacion_num', 'rendimiento_futuro']
        X = df[features_modelo]
        
        # Realizar predicciones
        df['Riesgo de despido predicho'] = modelo.predict(X)

        # Eliminar columna Riesgo de rotacion num
        df.drop(columns=['Riesgo de rotacion_num'], inplace=True)

        # Renombrar otra vez
        df.rename(columns={'rendimiento_futuro': 'rendimiento_futuro_predicho'}, inplace=True)
        
        # Guardar resultados
        df.to_csv(os.path.join(BASE_DIR, 'data/despido_predichos.csv'), index=False)

        return df
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return None
    
def predecir_riesgo_despido_individual(empleado_data, ruta_modelo=os.path.join(BASE_DIR, 'trained_models/dismissal_risk_model.pkl')):
    modelo = joblib.load(ruta_modelo)
    le_rotacion = LabelEncoder()
    le_rotacion.fit(['bajo', 'medio', 'alto'])  # Ajusta si tienes otros valores posibles

    # Convertir a DataFrame
    df = pd.DataFrame([empleado_data])

    # Transformar la columna de riesgo de rotación a numérica
    df['Riesgo de rotacion_num'] = le_rotacion.transform(df['Riesgo de rotacion predicho'])

    # Renombrar columna de rendimiento
    df.rename(columns={'rendimiento_futuro_predicho': 'rendimiento_futuro'}, inplace=True)

    features_modelo = [
        'ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
        'desempeno_previo', 'Riesgo de rotacion_num', 'rendimiento_futuro'
    ]
    X = df[features_modelo]

    # Predecir
    riesgo_despido = modelo.predict(X)[0]

    # df.to_csv("data/despidoInd_predichos.csv", index=False)

    return riesgo_despido

def predict_resignation_risk(df, ruta_modelo=os.path.join(BASE_DIR, 'trained_models/resignation_risk_model.pkl')):
    try:
        # Cargar los datos de empleados
        # df = pd.read_csv(ruta_csv)
        
        # Verificar columnas requeridas
        columnas_requeridas = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
                        'Riesgo de rotacion predicho', 'Riesgo de despido predicho', 
                        'rendimiento_futuro_predicho']
        
        missing_cols = [col for col in columnas_requeridas if col not in df.columns]
        if missing_cols:
            print(f"Error: Faltan columnas requeridas: {missing_cols}")
            return None
        
        # Cargar el modelo entrenado
        modelo = joblib.load(ruta_modelo)
        
        # Preprocesamiento igual que en el entrenamiento
        # Necesitamos el mismo LabelEncoder usado durante el entrenamiento
        # deberiamos guardar y cargar este encoder al entrenar
        le_rotacion = LabelEncoder()
        le_rotacion.fit(['bajo', 'medio', 'alto'])  # Asumiendo estos son los valores posibles
        df['Riesgo de rotacion_num'] = le_rotacion.transform(df['Riesgo de rotacion predicho'])
        le_despido = LabelEncoder()
        le_despido.fit(['bajo', 'medio', 'alto'])  # Asumiendo estos son los valores posibles
        df['Riesgo de despido_num'] = le_despido.transform(df['Riesgo de despido predicho'])
        
        # Renombrar rendimiento_futuro_predicho
        df.rename(columns={'rendimiento_futuro_predicho': 'rendimiento_futuro'}, inplace=True)

        # Preparar datos para predicción (usar MISMAS features que en entrenamiento)
        features_modelo = ['ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas', 'Riesgo de rotacion_num', 'Riesgo de despido_num', 'rendimiento_futuro']
        X = df[features_modelo]
        
        # Realizar predicciones
        df['Riesgo de renuncia predicho'] = modelo.predict(X)

        # Eliminar columna Riesgo de rotacion num
        df.drop(columns=['Riesgo de rotacion_num'], inplace=True)
        df.drop(columns=['Riesgo de despido_num'], inplace=True)

        df.rename(columns={'rendimiento_futuro': 'rendimiento_futuro_predicho'}, inplace=True)

        # Guardar resultados
        df.to_csv(os.path.join(BASE_DIR, 'data/renuncia_predichos.csv'), index=False)

        return df
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        return None

def predecir_riesgo_renuncia_individual(
    empleado_data,
    ruta_modelo=os.path.join(BASE_DIR, 'trained_models/resignation_risk_model.pkl')
):
    modelo = joblib.load(ruta_modelo)
    le_rotacion = LabelEncoder()
    le_rotacion.fit(['bajo', 'medio', 'alto'])  # Ajusta si tienes otros valores posibles
    le_despido = LabelEncoder()
    le_despido.fit(['bajo', 'medio', 'alto'])   # Ajusta si tienes otros valores posibles

    df = pd.DataFrame([empleado_data])

    # Transformar las columnas de riesgo a numéricas
    df['Riesgo de rotacion_num'] = le_rotacion.transform(df['Riesgo de rotacion predicho'])
    df['Riesgo de despido_num'] = le_despido.transform(df['Riesgo de despido predicho'])

    # Renombrar columna de rendimiento
    df.rename(columns={'rendimiento_futuro_predicho': 'rendimiento_futuro'}, inplace=True)

    features_modelo = [
        'ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas',
        'Riesgo de rotacion_num', 'Riesgo de despido_num', 'rendimiento_futuro'
    ]
    X = df[features_modelo]

    # Predecir
    riesgo_renuncia = modelo.predict(X)[0]
    return riesgo_renuncia

if __name__ == "__main__":
    info_empleados = pd.read_csv(os.path.join(BASE_DIR, 'data/info_empleados.csv'))
    rendFut_predichos_useANDpredict = predecir_rend_futuro(info_empleados)

    # Tomar solamente el primer empleado del archivo emps_riesgos.csv
    df_emps_riesgos = pd.read_csv(os.path.join(BASE_DIR, 'data/emps_riesgos.csv'))
    primer_empleado = df_emps_riesgos.iloc[0:1]

    datos_empleado = {
    "desempeno_previo": primer_empleado['desempeno_previo'].values[0],
    "ausencias_injustificadas": primer_empleado['ausencias_injustificadas'].values[0],
    "llegadas_tarde": primer_empleado['llegadas_tarde'].values[0],
    "salidas_tempranas": primer_empleado['salidas_tempranas'].values[0],
    "horas_extras": primer_empleado['horas_extras'].values[0],
    "antiguedad": primer_empleado['antiguedad'].values[0],
    "horas_capacitacion": primer_empleado['horas_capacitacion'].values[0]
    }

    resultado = predecir_rend_futuro_individual(datos_empleado)
    print(f"Rendimiento futuro individual predicho: {resultado}")
    
    rotacion_predichos = predecir_riesgo_rotacion(rendFut_predichos_useANDpredict)

    empleado = {
    "ausencias_injustificadas": primer_empleado['ausencias_injustificadas'].values[0],
    "llegadas_tarde": primer_empleado['llegadas_tarde'].values[0],
    "salidas_tempranas": primer_empleado['salidas_tempranas'].values[0],
    "desempeno_previo": primer_empleado['desempeno_previo'].values[0]
    }
    riesgo = predecir_riesgo_rotacion_individual(empleado)
    print(f"Riesgo de rotacion individual predicho: {riesgo}")

    despido_predichos = predecir_riesgo_despido(rotacion_predichos)

    empleado_data = {
    "ausencias_injustificadas": primer_empleado['ausencias_injustificadas'].values[0],
    "llegadas_tarde": primer_empleado['llegadas_tarde'].values[0],
    "salidas_tempranas": primer_empleado['salidas_tempranas'].values[0],
    "desempeno_previo": primer_empleado['desempeno_previo'].values[0],
    'Riesgo de rotacion predicho': primer_empleado['Riesgo de rotacion'].values[0],
    'rendimiento_futuro_predicho': primer_empleado['rendimiento_futuro'].values[0]
    }

    riesgo = predecir_riesgo_despido_individual(empleado_data)
    print(f"Riesgo de despido individual predicho: {riesgo}")

    renuncia_predichos = predict_resignation_risk(despido_predichos)

    empleado_data = {
    "ausencias_injustificadas": primer_empleado['ausencias_injustificadas'].values[0],
    "llegadas_tarde": primer_empleado['llegadas_tarde'].values[0],
    "salidas_tempranas": primer_empleado['salidas_tempranas'].values[0],
    "desempeno_previo": primer_empleado['desempeno_previo'].values[0],
    'Riesgo de rotacion predicho': primer_empleado['Riesgo de rotacion'].values[0],
    'Riesgo de despido predicho': primer_empleado['Riesgo de despido'].values[0],
    'rendimiento_futuro_predicho': primer_empleado['rendimiento_futuro'].values[0]
    }

    riesgo = predecir_riesgo_renuncia_individual(empleado_data)
    print(f"Riesgo de renuncia individual predicho: {riesgo}")