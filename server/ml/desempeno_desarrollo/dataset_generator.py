import pandas as pd
import numpy as np
import os

def generate_employee_dataset(cant_empleados, nombre_archivo="info_empleados.csv"):
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
    
    for i in range(1, cant_empleados+1):
        data['id'].append(i)
        #data['id'].append(id_empleado)
        # Desempeño previo (1-10, siendo 10 el mejor)
        # Distribución: más empleados en el rango 5-8
        # data['desempeno_previo'].append(min(max(1, int(np.random.normal(6.5, 2))), 10))

        if np.random.rand() < 0.2:
            data['desempeno_previo'].append(0.0)
            antiguedad = 0
        else:
            valor_desempeno = min(max(0, np.random.normal(6.5, 2)), 10)
            data['desempeno_previo'].append(round(valor_desempeno, 2))
            antiguedad = min(max(0, int(np.random.normal(5, 4))), 30)


        # Cantidad de proyectos (1-10, mayoría entre 2-6)
        data['cantidad_proyectos'].append(min(max(1, int(np.random.normal(4, 2))), 10))
        
        # Tamaño de equipo (1-15)
        data['tamano_equipo'].append(min(max(1, int(np.random.normal(8, 3))), 15))
        
        # Horas extras (0-30, mayoría entre 0-15)
        data['horas_extras'].append(min(max(0, int(np.random.normal(8, 5))), 30))
        
        # Antigüedad en años (0-30, mayoría entre 1-10)
        data['antiguedad'].append(antiguedad)
        
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

    save_path = os.path.join("server/ml/desempeno_desarrollo/data")
    # save_path = os.path.join(os.getcwd(), "data")
    os.makedirs(save_path, exist_ok=True)

    df.to_csv(os.path.join(save_path, nombre_archivo), index=False)

    #print(f"Archivo {nombre_archivo} generado con {len(lista_ids)} muestras\n")

    # Retornar la ruta del archivo csv generado y el df
    return df, os.path.join(save_path, nombre_archivo)

def add_future_performance(ruta_csv, nombre_archivo = "emps_rendFut.csv"):
    # Cargar el dataset
    try:
        df = pd.read_csv(ruta_csv)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {ruta_csv}")
        return None
    
    # # Verificar que existan las columnas necesarias
    # columnas_requeridas = ['desempeno_previo', 'cantidad_proyectos', 'tamano_equipo', 
    #                       'horas_extras', 'antiguedad', 'horas_capacitacion']
    
    # for col in columnas_requeridas:
    #     if col not in df.columns:
    #         print(f"Error: Falta la columna requerida '{col}' en el dataset")
    #         return None
    
    # # Pesos ajustados para obtener valores más altos
    # pesos = {
    #     'desempeno_previo': 0.35,  # Mayor peso al desempeño previo
    #     'cantidad_proyectos': 0.25,  # Más importancia a proyectos
    #     'tamano_equipo': 0.05,  # Muy poco impacto negativo
    #     'horas_extras': 0.15,  
    #     'antiguedad': 0.10,
    #     'horas_capacitacion': 0.20  # Más peso a capacitación
    # }
    
    # # Normalización mejorada con mínimos y máximos
    # def normalizar(columna, min_val=None, max_val=None):
    #     if min_val is None:
    #         min_val = columna.min()
    #     if max_val is None:
    #         max_val = columna.max()
    #     return (columna - min_val) / (max_val - min_val)
    
    # # Normalizar los datos (escalar a 0-1) con rangos esperados
    # df_normalizado = df.copy()
    # # df_normalizado['desempeno_previo'] = normalizar(df['desempeno_previo'], 1, 10)
    # df_normalizado['desempeno_previo'] = normalizar(df['desempeno_previo'], 0, 10)
    # df_normalizado['cantidad_proyectos'] = normalizar(df['cantidad_proyectos'], 0, 10)
    # df_normalizado['tamano_equipo'] = 1 - normalizar(df['tamano_equipo'], 1, 15)  # Invertir para que equipo más pequeño sea mejor
    # df_normalizado['horas_extras'] = normalizar(df['horas_extras'].clip(0, 20), 0, 20)  # Limitar impacto de horas extras muy altas
    # df_normalizado['antiguedad'] = normalizar(df['antiguedad'], 0, 30)
    # df_normalizado['horas_capacitacion'] = normalizar(df['horas_capacitacion'], 0, 40)
    
    # # Fórmula mejorada para rendimiento más alto
    # df['rendimiento_futuro'] = (
    #     pesos['desempeno_previo'] * df_normalizado['desempeno_previo'] * 1.2 +  # Boost desempeño
    #     pesos['cantidad_proyectos'] * df_normalizado['cantidad_proyectos'] * 1.1 +
    #     pesos['tamano_equipo'] * df_normalizado['tamano_equipo'] +  # Ya no es negativo
    #     pesos['horas_extras'] * np.sqrt(df_normalizado['horas_extras']) * 1.3 +  # Usar raíz cuadrada para reducir impacto negativo
    #     pesos['antiguedad'] * df_normalizado['antiguedad'] * 1.1 +
    #     pesos['horas_capacitacion'] * df_normalizado['horas_capacitacion'] * 1.2
    # )

    # Verificar que existan las columnas necesarias
    columnas_requeridas = [
        'desempeno_previo', 'horas_extras', 'antiguedad', 'horas_capacitacion',
        'ausencias_injustificadas', 'llegadas_tarde', 'salidas_tempranas'
    ]
    
    for col in columnas_requeridas:
        if col not in df.columns:
            print(f"Error: Falta la columna requerida '{col}' en el dataset")
            return None
    
    # Pesos ajustados para las nuevas variables
    pesos = {
        'desempeno_previo': 0.35,
        'horas_extras': 0.15,
        'antiguedad': 0.10,
        'horas_capacitacion': 0.20,
        'ausencias_injustificadas': -0.08,  # Negativo porque restan al rendimiento
        'llegadas_tarde': -0.06,
        'salidas_tempranas': -0.06
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
    df_normalizado['desempeno_previo'] = normalizar(df['desempeno_previo'], 0, 10)
    df_normalizado['horas_extras'] = normalizar(df['horas_extras'].clip(0, 20), 0, 20)
    df_normalizado['antiguedad'] = normalizar(df['antiguedad'], 0, 30)
    df_normalizado['horas_capacitacion'] = normalizar(df['horas_capacitacion'], 0, 40)
    df_normalizado['ausencias_injustificadas'] = normalizar(df['ausencias_injustificadas'], 0, 15)
    df_normalizado['llegadas_tarde'] = normalizar(df['llegadas_tarde'], 0, 30)
    df_normalizado['salidas_tempranas'] = normalizar(df['salidas_tempranas'], 0, 20)
    
    # Si desempeno_previo es 0, no se tiene en cuenta en el cálculo
    desempeno_previo_ajustado = np.where(df['desempeno_previo'] == 0, 0, df_normalizado['desempeno_previo'])
    # Si horas_capacitacion es 0, no se tiene en cuenta en el cálculo
    horas_capacitacion_ajustada = np.where(df['horas_capacitacion'] == 0, 0, df_normalizado['horas_capacitacion'])
    antiguedad_ajustada = np.where(df['antiguedad'] == 0, 0, df_normalizado['antiguedad'])


    # Nueva fórmula para rendimiento futuro
    df['rendimiento_futuro'] = (
        pesos['desempeno_previo'] * desempeno_previo_ajustado * 1.2 +
        pesos['horas_extras'] * np.sqrt(df_normalizado['horas_extras']) * 1.3 +
        pesos['antiguedad'] * antiguedad_ajustada * 1.1 +
        pesos['horas_capacitacion'] * horas_capacitacion_ajustada * 1.2 +
        pesos['ausencias_injustificadas'] * df_normalizado['ausencias_injustificadas'] +
        pesos['llegadas_tarde'] * df_normalizado['llegadas_tarde'] +
        pesos['salidas_tempranas'] * df_normalizado['salidas_tempranas']
    )
    
    # Ajustar la escala para que la mayoría esté entre 6-9 con algunos extremos
    # Primero escalamos a 0-1 manteniendo la distribución
    min_rf = df['rendimiento_futuro'].min()
    max_rf = df['rendimiento_futuro'].max()
    df['rendimiento_futuro'] = (df['rendimiento_futuro'] - min_rf) / (max_rf - min_rf)
    
    # Luego aplicamos una curva sigmoide para concentrar valores en el rango medio-alto
    df['rendimiento_futuro'] = 1 / (1 + np.exp(-(df['rendimiento_futuro']*10 - 5)))
    
    # Finalmente escalamos a 4-10 (eliminando los peores valores)
    df['rendimiento_futuro'] = np.round(df['rendimiento_futuro'] * 6 + 4, 2)
    
    # Asegurarse de que esté dentro del rango 4-10
    df['rendimiento_futuro'] = df['rendimiento_futuro'].clip(4, 10)
    
    save_path = os.path.join("server/ml/desempeno_desarrollo/data")
    # save_path = os.path.join(os.getcwd(), "data")
    os.makedirs(save_path, exist_ok=True)
    # Crear otro archivo .csv con las mismas columnas mas las nuevas columnas
    df.to_csv(os.path.join(save_path, nombre_archivo), index=False)

    print(f"Archivo {nombre_archivo}, rendimiento futuro agregado\n")
    # print(f"Save_path: {os.path.join(save_path, nombre_archivo)}")

    return df, os.path.join(save_path, nombre_archivo)

def add_risks(ruta_csv, nombre_archivo = "emps_riesgos.csv"):
    try:
        df = pd.read_csv(ruta_csv)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {ruta_csv}")
        return None
    
    # Verificar que existe la columna rendimiento_futuro
    if 'rendimiento_futuro' not in df.columns:
        print("Error: Falta la columna 'rendimiento_futuro' en el dataset")
        return None
    
    def calcular_riesgo_rotacion(ausencias, tardes, tempranas, desempeno):
        # Calculamos un score basado en los diferentes factores
        score = 0
        
        # Ponderación de cada factor
        score += ausencias * 0.4       # Ausencias tienen mayor peso
        score += tardes * 0.3          # Llegadas tarde
        score += tempranas * 0.3       # Salidas tempranas
        # score -= desempeno * 0.5      # Buen desempeño reduce el riesgo
        if desempeno > 0:
            score -= desempeno * 0.5 
        
        # Determinamos el nivel de riesgo
        if score < 5:
            return "bajo"
        elif 5 <= score < 10:
            return "medio"
        else:
            return "alto"
    
    def calcular_riesgo_despido(ausencias, tardes, tempranas, desempeno, riesgo_rotacion, rendimiento_futuro):
        # Convertimos el riesgo de rotación a un valor numérico
        riesgo_rotacion_val = {"bajo": 1, "medio": 3, "alto": 5}[riesgo_rotacion]
        
        # Calculamos el score
        score = 0
        score += ausencias * 0.5       # Ausencias son muy importantes para despido
        score += tardes * 0.2
        score += tempranas * 0.3
        # score -= desempeno * 0.4       # Buen desempeño reduce riesgo de despido
        if desempeno > 0:
            score -= desempeno * 0.4
        score += riesgo_rotacion_val * 2  # Riesgo de rotación influye
        
        # Ajuste basado en rendimiento futuro (4-10)
        # Bajo rendimiento futuro (4-6) aumenta riesgo
        # Alto rendimiento futuro (8-10) disminuye riesgo
        if rendimiento_futuro <= 6:
            score += 4  # Aumenta riesgo significativamente
        elif rendimiento_futuro >= 8:
            score -= 3  # Reduce riesgo considerablemente
        
        # Determinamos el nivel de riesgo
        if score < 8:
            return "bajo"
        elif 8 <= score < 15:
            return "medio"
        else:
            return "alto"
    
    def calcular_riesgo_renuncia(ausencias, tardes, tempranas, riesgo_rotacion, riesgo_despido, rendimiento_futuro):
        # Convertimos los riesgos a valores numéricos
        riesgo_rotacion_val = {"bajo": 1, "medio": 3, "alto": 5}[riesgo_rotacion]
        riesgo_despido_val = {"bajo": 1, "medio": 3, "alto": 5}[riesgo_despido]
        
        # Calculamos el score
        score = 0
        score += ausencias * 0.3       # Ausencias influyen pero no tanto
        score += tardes * 0.4         # Llegadas tarde pueden indicar descontento
        score += tempranas * 0.3      # Salidas tempranas también
        score += riesgo_rotacion_val * 1.5
        score += riesgo_despido_val * 1.5
        
        # Ajuste basado en rendimiento futuro
        # Alto rendimiento futuro (8-10) aumenta riesgo por oportunidades externas
        # Medio rendimiento (6-8) tiene impacto neutro
        # Bajo rendimiento (<6) reduce riesgo (menos oportunidades)
        if rendimiento_futuro >= 8:
            score += 4  # Aumenta riesgo por atractivo en mercado
        elif rendimiento_futuro <= 5:
            score -= 2  # Reduce riesgo por menor demanda externa
        
        # Determinamos el nivel de riesgo
        if score < 7:
            return "bajo"
        elif 7 <= score < 14:
            return "medio"
        else:
            return "alto"

    # Aplicamos las funciones a cada fila del DataFrame
    df['Riesgo de rotacion'] = df.apply(lambda x: calcular_riesgo_rotacion(
        x['ausencias_injustificadas'], 
        x['llegadas_tarde'], 
        x['salidas_tempranas'],
        x['desempeno_previo']
    ), axis=1)
    
    df['Riesgo de despido'] = df.apply(lambda x: calcular_riesgo_despido(
        x['ausencias_injustificadas'],
        x['llegadas_tarde'], 
        x['salidas_tempranas'],
        x['desempeno_previo'],
        x['Riesgo de rotacion'],
        x['rendimiento_futuro']
    ), axis=1)
    
    df['Riesgo de renuncia'] = df.apply(lambda x: calcular_riesgo_renuncia(
        x['ausencias_injustificadas'], 
        x['llegadas_tarde'],
        x['salidas_tempranas'],
        x['Riesgo de rotacion'],
        x['Riesgo de despido'],
        x['rendimiento_futuro']
    ), axis=1)

    save_path = os.path.join("server/ml/desempeno_desarrollo/data")
    # save_path = os.path.join(os.getcwd(), "data")
    os.makedirs(save_path, exist_ok=True)
    df.to_csv(os.path.join(save_path, nombre_archivo), index=False)

    print(f"Archivo {nombre_archivo}, columnas de rotacion, despido y renuncia agregadas\n")
    return df, os.path.join(save_path, nombre_archivo)