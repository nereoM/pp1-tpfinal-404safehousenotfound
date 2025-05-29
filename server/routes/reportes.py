import os, io, base64
from datetime import datetime
from flask import request, send_file
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func, case, text, extract
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from matplotlib import pyplot as plt
from server.models import Usuario, Empresa, Preferencias_empresa, Oferta_laboral, Job_Application, RendimientoEmpleado, Licencia
from auth.decorators import role_required
from manager import manager_bp
from models.extensions import db




@manager_bp.route("/reportes-reclutamiento-manager", methods=["GET"])
@role_required(["manager"])
def reporte_reclutamiento():
    formato = request.args.get("formato", "pdf")

    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    preferencia = Preferencias_empresa.query.get(manager.id_empresa)
    empresa = Empresa.query.get(manager.id_empresa)

    resultados = (
        db.session.query(
            Oferta_laboral.nombre.label("oferta"),
            func.count(Job_Application.id).label("postulaciones"),
            func.sum(case((Job_Application.is_apto == True, 1), else_=0)).label("contratados"),
            func.avg(func.timestampdiff(
                text("DAY"),
                Oferta_laboral.fecha_publicacion,
                Job_Application.fecha_postulacion
            )).label("tiempo_promedio")
        )
        .join(Job_Application, Job_Application.id_oferta == Oferta_laboral.id)
        .filter(Oferta_laboral.id_empresa == manager.id_empresa)
        .group_by(Oferta_laboral.id)
        .all()
    )

    datos = [
        {
            "oferta": row.oferta,
            "postulaciones": row.postulaciones,
            "contratados": row.contratados,
            "tasa_conversion": round((row.contratados / row.postulaciones) * 100, 1) if row.postulaciones else 0,
            "tiempo_promedio": round(row.tiempo_promedio, 1) if row.tiempo_promedio else 0
        }
        for row in resultados
    ]

    if formato == "pdf":
        env = Environment(loader=FileSystemLoader("templates"))
        template = env.get_template("reporte_reclutamiento_profesional.html")

        html_out = template.render(
            empresa=empresa.nombre if empresa else "Empresa Desconocida",
            logo_url=preferencia.logo_url if preferencia and preferencia.logo_url else None,
            color=preferencia.color_secundario if preferencia and preferencia.color_secundario else "#2E86C1",
            datos=datos
        )

        nombre_archivo = f"informe_reclutamiento_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        ruta_archivo = os.path.join("temp", nombre_archivo)

        os.makedirs("temp", exist_ok=True)
        HTML(string=html_out).write_pdf(ruta_archivo)

        return send_file(ruta_archivo, as_attachment=True, download_name=nombre_archivo)

    return {"error": "Formato no soportado"}, 400


def generar_grafico_promedio_puesto_base64(data):
    puestos = [p["puesto"] for p in data]
    promedios = [p["promedio"] for p in data]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(puestos, promedios, color="#117A65")
    ax.set_title("Promedio de Rendimiento Futuro por Puesto", fontsize=14)
    ax.set_xlabel("Promedio", fontsize=12)
    ax.set_xlim(0, 10)

    for bar in bars:
        width = bar.get_width()
        ax.annotate(f'{width:.1f}', xy=(width, bar.get_y() + bar.get_height() / 2),
                    xytext=(5, 0), textcoords="offset points", ha='left', va='center', fontsize=10)

    plt.tight_layout()
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")

def generar_grafico_base64(data):
    nombres = [f["nombre"] for f in data]
    valores = [f["rendimiento_futuro"] for f in data]

    fig, ax = plt.subplots(figsize=(10, 4))
    bars = ax.bar(nombres, valores, color="#2E86C1")
    ax.set_title("Top Rendimiento Futuro")
    ax.set_ylabel("Predicción")
    ax.set_ylim(0, 10)
    ax.set_xticklabels(nombres, rotation=45, ha='right')

    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height:.1f}', xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3), textcoords="offset points", ha='center', fontsize=10)

    plt.tight_layout()
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def grafico_ausencias_base64(data):
    meses = [f["mes"] for f in data]
    dias = [f["total_dias"] for f in data]

    fig, ax = plt.subplots(figsize=(10, 4))
    bars = ax.bar(meses, dias, color="#C0392B")
    ax.set_title("Días de Ausencia por Mes", fontsize=14)
    ax.set_ylabel("Días", fontsize=12)
    ax.set_xlabel("Mes", fontsize=12)
    ax.set_ylim(0, max(dias)+5)

    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height}', xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3), textcoords="offset points", ha='center', fontsize=10)

    plt.tight_layout()
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


@manager_bp.route("/reportes-desempeno-manager", methods=["GET"])
@role_required(["manager"])
def reporte_desempeno():
    formato = request.args.get("formato", "pdf")

    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    preferencia = Preferencias_empresa.query.get(manager.id_empresa)
    empresa = Empresa.query.get(manager.id_empresa)

    ranking_futuro = (
        db.session.query(
            Usuario.nombre,
            Usuario.apellido,
            Usuario.username,
            RendimientoEmpleado.rendimiento_futuro_predicho.label("prediccion")
        )
        .join(Usuario, Usuario.id == RendimientoEmpleado.id_usuario)
        .filter(Usuario.id_empresa == manager.id_empresa)
        .filter(RendimientoEmpleado.rendimiento_futuro_predicho != None)
        .order_by(RendimientoEmpleado.rendimiento_futuro_predicho.desc())
        .limit(10)
        .all()
    )


    ranking_dict = [
        {
            "nombre": f"{r.nombre} {r.apellido}",
            "username": r.username,
            "rendimiento_futuro": round(r.rendimiento_futuro_predicho, 2)
        }
        for r in ranking_futuro
    ]

    grafico_base64 = generar_grafico_base64(ranking_dict)


    agrupado_por_puesto = (
        db.session.query(
            Usuario.puesto_trabajo,
            func.avg(RendimientoEmpleado.rendimiento_futuro_predicho).label("promedio")
        )
        .join(RendimientoEmpleado, Usuario.id == RendimientoEmpleado.id_usuario)
        .filter(Usuario.id_empresa == empresa.id)
        .filter(RendimientoEmpleado.rendimiento_futuro_predicho != None)
        .group_by(Usuario.puesto_trabajo)
        .order_by(func.avg(RendimientoEmpleado.rendimiento_futuro_predicho).desc())
        .all()
    )


    promedios_por_puesto = [
        {
            "puesto": row.puesto_trabajo if row.puesto_trabajo else "Analista",
            "promedio": round(row.promedio, 2)
        }
        for row in agrupado_por_puesto
    ]

    grafico_puesto_base64 = generar_grafico_promedio_puesto_base64(promedios_por_puesto)


    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("reporte_rendimiento.html")

    html_out = template.render(
        empresa=empresa.nombre,
        logo_url=preferencia.logo_url if preferencia and preferencia.logo_url else None,
        color=preferencia.color_secundario or "#2E86C1",
        ranking_futuro=ranking_dict,
        grafico_base64=grafico_base64,
        promedios_por_puesto=promedios_por_puesto,
        grafico_puesto_base64=grafico_puesto_base64
    )
    
    nombre_archivo = f"desempeno_futuro_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    ruta_archivo = os.path.join("temp", nombre_archivo)
    os.makedirs("temp", exist_ok=True)
    HTML(string=html_out).write_pdf(ruta_archivo)

    return send_file(ruta_archivo, as_attachment=True, download_name=nombre_archivo)


@manager_bp.route("/reporte-riesgos-manager", methods=["GET"])
@role_required(["manager"])
def reporte_riesgos():
    formato = request.args.get("formato", "pdf")

    id_manager = get_jwt_identity()
    manager = Usuario.query.get(id_manager)
    preferencia = Preferencias_empresa.query.get(manager.id_empresa)

    empresa = Empresa.query.get(manager.id_empresa)


    dias_por_tipo = (
        db.session.query(
            Licencia.tipo,
            func.sum(func.datediff(Licencia.fecha_fin, Licencia.fecha_inicio)).label("total_dias")
        )
        .filter(Licencia.estado == "Aprobada")
        .filter(Licencia.id_empresa == empresa.id)
        .group_by(Licencia.tipo)
        .all()
    )

    dias_por_tipo = [{"tipo": r.tipo, "total_dias": int(r.total_dias)} for r in dias_por_tipo]


    ranking_empleados = (
        db.session.query(
            Usuario.username,
            func.sum(func.datediff(Licencia.fecha_fin, Licencia.fecha_inicio)).label("total_dias")
        )
        .join(Usuario, Usuario.id == Licencia.id_empleado)
        .filter(Licencia.estado == "Aprobada")
        .filter(Usuario.id_empresa == empresa.id)
        .group_by(Usuario.username)
        .order_by(func.sum(func.datediff(Licencia.fecha_fin, Licencia.fecha_inicio)).desc())
        .limit(10)
        .all()
    )

    ranking_empleados = [{"username": r.username, "total_dias": int(r.total_dias)} for r in ranking_empleados]


    frecuencia_empleado = (
        db.session.query(
            Usuario.username,
            func.count(Licencia.id).label("cantidad_licencias")
        )
        .join(Usuario, Usuario.id == Licencia.id_empleado)
        .filter(Licencia.estado == "Aprobada")
        .filter(Usuario.id_empresa == empresa.id)
        .group_by(Usuario.username)
        .order_by(func.count(Licencia.id).desc())
        .all()
    )

    frecuencia_empleado = [{"username": r.username, "cantidad_licencias": r.cantidad_licencias} for r in frecuencia_empleado]


    dias_por_mes = (
        db.session.query(
            extract("month", Licencia.fecha_inicio).label("mes"),
            func.sum(func.datediff(Licencia.fecha_fin, Licencia.fecha_inicio)).label("total_dias")
        )
        .filter(Licencia.estado == "Aprobada")
        .filter(Licencia.id_empresa == empresa.id)
        .group_by(extract("month", Licencia.fecha_inicio))
        .order_by(extract("month", Licencia.fecha_inicio))
        .all()
    )
    
    dias_mes_data = [{"mes": int(m.mes), "total_dias": int(m.total_dias)} for m in dias_por_mes]
    meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    for d in dias_mes_data:
        d["mes"] = meses_nombres[d["mes"] - 1]

    # 5. Generar gráfico
    grafico_base64 = grafico_ausencias_base64(dias_mes_data)

    # 6. Render y exportar
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("reporte_asistencia_profesional.html")
    html_out = template.render(
        empresa=empresa.nombre,
        logo_url=preferencia.logo_url if preferencia and preferencia.logo_url else None,
        color=preferencia.color_secundario or "#2E86C1",
        dias_por_tipo=dias_por_tipo,
        ranking_empleados=ranking_empleados,
        frecuencia_empleado=frecuencia_empleado,
        grafico_ausencias_base64=grafico_base64
    )

    archivo = f"reporte_asistencia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    ruta = os.path.join("temp", archivo)
    os.makedirs("temp", exist_ok=True)
    HTML(string=html_out).write_pdf(ruta)

    return send_file(ruta, as_attachment=True, download_name=archivo)
