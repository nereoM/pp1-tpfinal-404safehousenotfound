# Flujo de Solicitud y Descarga de Reportes

## Descripción

Este proceso permite que los usuarios con rol autorizado (por ejemplo, `manager` o `reclutadores/analistas`) soliciten y descarguen reportes analíticos sobre empleados, postulaciones, rendimiento o riesgos, en formatos PDF o Excel.

## Flujo general

1. El usuario accede a la sección relacionada al reporte que quiere obtener desde el panel principal (ofertas laborales, licencias, predicciones de rendimiento/riesgos).
2. Selecciona el reporte a generar (rendimiento, postulaciones, eficacia, riesgos, etc.).
3. Define los filtros si aplica: rango de fechas, ofertas específicas, empresa, etc.
4. El usuario presiona "Descargar reporte".
5. La aplicación:
   - Genera el reporte en el backend (Flask).
   - Renderiza visualizaciones (gráficos) si corresponde.
   - Crea un archivo descargable (PDF o Excel).
6. Se descarga el reporte elegido.

## Tipos de Reporte Soportados

- Reporte de postulaciones (PDF + Excel).
- Reporte de predicción de riesgos (despido, rotación, renuncia).
- Reporte de eficacia de reclutadores.
- Reporte de predicción de rendimiento futuro.
- Otros según implementación futura

## Requisitos por Rol

| Rol        | Puede generar reportes             |
|------------|------------------------------------|
| admin-emp  | ❌ No tiene acceso.               |
| manager    | ✅ Todos los reportes de su empresa|
| reclutador | ✅ Todos los reportes menos el de eficacia de reclitadores/analistas |
| candidato  | ❌ No autorizado        |

## Tecnologías involucradas

- Backend: Flask
- Generación de archivos: `pandas`, `matplotlib`, `openpyxl`, `weasyprint`, etc.
- Frontend: React + botones de descarga por tipo de archivo

## Errores comunes

- No seleccionar filtros obligatorios (como fecha o oferta)
- Intentar generar reportes sin permisos suficientes
- No tener datos disponibles para el periodo elegido

## Resultado esperado

Una vez generado correctamente el reporte, el usuario puede descargar el archivo generado desde un botón visible en la misma interfaz, o recibirlo automáticamente si así fue configurado.

