import pandas as pd
import numpy as np
import os

def generate_employee_dataset(cantidad_empleados, nombre_archivo="info_empleados.csv"):
    data = {
        'id': [],
        'desempeno_previo': [],
        'cantidad_proyectos': [],
        'tamano_equipo': [],
        'horas_extras': [],
        'antiguedad': [],
        'horas_capacitacion': [],
        'ausencias_injustificadas': [],
        'llegadas_tarde': [],
        'salidas_tempranas': []
    }
    
    for i in range(1, cantidad_empleados + 1):
        data['id'].append(i)
        
        # Desempeño previo (1-10, siendo 10 el mejor)
        # Distribución: más empleados en el rango 5-8
        data['desempeno_previo'].append(min(max(1, int(np.random.normal(6.5, 2))), 10))
        
        # Cantidad de proyectos (1-10, mayoría entre 2-6)
        data['cantidad_proyectos'].append(min(max(1, int(np.random.normal(4, 2))), 10))
        
        # Tamaño de equipo (1-15)
        data['tamano_equipo'].append(min(max(1, int(np.random.normal(8, 3))), 15))
        
        # Horas extras (0-30, mayoría entre 0-15)
        data['horas_extras'].append(min(max(0, int(np.random.normal(8, 5))), 30))
        
        # Antigüedad en años (0-30, mayoría entre 1-10)
        data['antiguedad'].append(min(max(0, int(np.random.normal(5, 4))), 30))
        
        # Horas de capacitación (0-40, mayoría entre 0-20)
        data['horas_capacitacion'].append(min(max(0, int(np.random.normal(10, 8))), 40))
    
        # Ausencias injustificadas (0-15, completamente aleatorio)
        data['ausencias_injustificadas'].append(np.random.randint(0, 16))
        
        # Llegadas tarde (0-30, completamente aleatorio)
        data['llegadas_tarde'].append(np.random.randint(0, 31))
        
        # Salidas tempranas (0-20, completamente aleatorio)
        data['salidas_tempranas'].append(np.random.randint(0, 21))

    # Crear DataFrame
    df = pd.DataFrame(data)

    save_path = os.path.join("server/ml/data")
    os.makedirs(save_path, exist_ok=True)

    df.to_csv(os.path.join(save_path, nombre_archivo), index=False)

    print(f"Archivo {nombre_archivo} generado con {cantidad_empleados} muestras\n")

    # Retornar la ruta del archivo csv generado y el df
    return df, os.path.join(save_path, nombre_archivo)

def add_future_performance(ruta_csv):
    # Cargar el dataset
    try:
        df = pd.read_csv(ruta_csv)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {ruta_csv}")
        return None
    
    # Verificar que existan las columnas necesarias
    columnas_requeridas = ['desempeno_previo', 'cantidad_proyectos', 'tamano_equipo', 
                          'horas_extras', 'antiguedad', 'horas_capacitacion']
    
    for col in columnas_requeridas:
        if col not in df.columns:
            print(f"Error: Falta la columna requerida '{col}' en el dataset")
            return None
    
    # Pesos ajustados para obtener valores más altos
    pesos = {
        'desempeno_previo': 0.35,  # Mayor peso al desempeño previo
        'cantidad_proyectos': 0.25,  # Más importancia a proyectos
        'tamano_equipo': 0.05,  # Muy poco impacto negativo
        'horas_extras': 0.15,  
        'antiguedad': 0.10,
        'horas_capacitacion': 0.20  # Más peso a capacitación
    }
    
    # Normalización mejorada con mínimos y máximos
    def normalizar(columna, min_val=None, max_val=None):
        if min_val is None:
            min_val = columna.min()
        if max_val is None:
            max_val = columna.max()
        return (columna - min_val) / (max_val - min_val)
    
    # Normalizar los datos (escalar a 0-1) con rangos esperados
    df_normalizado = df.copy()
    df_normalizado['desempeno_previo'] = normalizar(df['desempeno_previo'], 1, 10)
    df_normalizado['cantidad_proyectos'] = normalizar(df['cantidad_proyectos'], 0, 10)
    df_normalizado['tamano_equipo'] = 1 - normalizar(df['tamano_equipo'], 1, 15)  # Invertir para que equipo más pequeño sea mejor
    df_normalizado['horas_extras'] = normalizar(df['horas_extras'].clip(0, 20), 0, 20)  # Limitar impacto de horas extras muy altas
    df_normalizado['antiguedad'] = normalizar(df['antiguedad'], 0, 30)
    df_normalizado['horas_capacitacion'] = normalizar(df['horas_capacitacion'], 0, 40)
    
    # Fórmula mejorada para rendimiento más alto
    df['rendimiento_futuro'] = (
        pesos['desempeno_previo'] * df_normalizado['desempeno_previo'] * 1.2 +  # Boost desempeño
        pesos['cantidad_proyectos'] * df_normalizado['cantidad_proyectos'] * 1.1 +
        pesos['tamano_equipo'] * df_normalizado['tamano_equipo'] +  # Ya no es negativo
        pesos['horas_extras'] * np.sqrt(df_normalizado['horas_extras']) * 1.3 +  # Usar raíz cuadrada para reducir impacto negativo
        pesos['antiguedad'] * df_normalizado['antiguedad'] * 1.1 +
        pesos['horas_capacitacion'] * df_normalizado['horas_capacitacion'] * 1.2
    )
    
    # Ajustar la escala para que la mayoría esté entre 6-9 con algunos extremos
    # Primero escalamos a 0-1 manteniendo la distribución
    min_rf = df['rendimiento_futuro'].min()
    max_rf = df['rendimiento_futuro'].max()
    df['rendimiento_futuro'] = (df['rendimiento_futuro'] - min_rf) / (max_rf - min_rf)
    
    # Luego aplicamos una curva sigmoide para concentrar valores en el rango medio-alto
    df['rendimiento_futuro'] = 1 / (1 + np.exp(-(df['rendimiento_futuro']*10 - 5)))
    
    # Finalmente escalamos a 4-10 (eliminando los peores valores)
    df['rendimiento_futuro'] = np.round(df['rendimiento_futuro'] * 6 + 4, 1)
    
    # Asegurarse de que esté dentro del rango 4-10
    df['rendimiento_futuro'] = df['rendimiento_futuro'].clip(4, 10)
    
    save_path = os.path.join("server/ml/data")

    # Crear otro archivo .csv con las mismas columnas mas las nuevas columnas
    nombre_archivo = "emps_rendFut.csv"
    df.to_csv(os.path.join(save_path, nombre_archivo), index=False)

    print(f"Archivo {nombre_archivo}, rendimiento futuro agregado\n")
    # print(f"Save_path: {os.path.join(save_path, nombre_archivo)}")

    return df, os.path.join(save_path, nombre_archivo)