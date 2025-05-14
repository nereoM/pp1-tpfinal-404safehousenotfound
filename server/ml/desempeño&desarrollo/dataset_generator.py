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