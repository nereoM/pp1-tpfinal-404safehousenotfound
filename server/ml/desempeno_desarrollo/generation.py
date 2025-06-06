from .dataset_generator import generate_employee_dataset, add_future_performance, add_risks, generate_rot_post_dataset, add_rot_post_risk
from .future_performance_model import train_future_performance_model
from .rotation_model import train_rotation_risk_model
from .dismissal_model import train_dismissal_risk_model
from .resignation_risk_model import train_resignation_risk_model
from .rotation_postulation_model import train_rot_post_model


# from dataset_generator import generate_employee_dataset, add_future_performance, add_risks, generate_rot_post_dataset, add_rot_post_risk
# from future_performance_model import train_future_performance_model
# from rotation_model import train_rotation_risk_model
# from dismissal_model import train_dismissal_risk_model
# from resignation_risk_model import train_resignation_risk_model
# from rotation_postulation_model import train_rot_post_model

def main():
    df_emps, emps_ruta = generate_employee_dataset(400)

    df_emps_rendFut, ruta_emps_rendFut = add_future_performance(emps_ruta)

    df_emps_riesgos, ruta_emps_riesgos = add_risks(ruta_emps_rendFut)

    modelo_rendFut, metricas, df = train_future_performance_model(ruta_emps_rendFut)

    modelo_rotacion, metricas, le_rotacion = train_rotation_risk_model(ruta_emps_riesgos)

    modelo_despido, metricas = train_dismissal_risk_model(ruta_emps_riesgos)

    modelo_renuncia, metricas = train_resignation_risk_model(ruta_emps_riesgos)

    df_rot_post_emps, _ = generate_rot_post_dataset(400)

    df_rot_post_emps_riesgos = add_rot_post_risk(df_rot_post_emps)

    modelo, le = train_rot_post_model(df_rot_post_emps_riesgos)

# if __name__ == "__main__":
#     df_emps, emps_ruta = generate_employee_dataset(400)

#     df_emps_rendFut, ruta_emps_rendFut = add_future_performance(emps_ruta)

#     df_emps_riesgos, ruta_emps_riesgos = add_risks(ruta_emps_rendFut)

#     modelo_rendFut, metricas, df = train_future_performance_model(ruta_emps_rendFut)

#     modelo_rotacion, metricas, le_rotacion = train_rotation_risk_model(ruta_emps_riesgos)

#     modelo_despido, metricas = train_dismissal_risk_model(ruta_emps_riesgos)

#     modelo_renuncia, metricas = train_resignation_risk_model(ruta_emps_riesgos)

#     df_rot_post_emps, _ = generate_rot_post_dataset(400)

#     df_rot_post_emps_riesgos = add_rot_post_risk(df_rot_post_emps)

#     modelo, le = train_rot_post_model(df_rot_post_emps_riesgos)
    