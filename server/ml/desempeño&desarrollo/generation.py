from dataset_generator import generate_employee_dataset, add_future_performance

if __name__ == "__main__":
    df_emps, emps_ruta = generate_employee_dataset(400)

    df_emps_rendFut, ruta_emps_rendFut = add_future_performance(emps_ruta)