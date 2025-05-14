from dataset_generator import generate_employee_dataset, add_future_performance, add_risks
from future_performance_model import train_future_performance_model

if __name__ == "__main__":
    df_emps, emps_ruta = generate_employee_dataset(400)

    df_emps_rendFut, ruta_emps_rendFut = add_future_performance(emps_ruta)

    df_emps_riesgos, ruta_emps_riesgos = add_risks(ruta_emps_rendFut)

    modelo_rendFut, metricas, df = train_future_performance_model(ruta_emps_rendFut)