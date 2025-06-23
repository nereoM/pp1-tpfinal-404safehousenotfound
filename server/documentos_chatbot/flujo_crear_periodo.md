# Crear periodo

## Descripción
Este proceso permite que un manager cree un periodo en su empresa. El mismo periodo se utiliza para cargar métricas de empleados y visualizar sus predicciones, asi como tambien generar reportes de los mismos por periodos.

## Pasos detallados
1. El manager de area ingresa al panel y hace clic en "Crear Periodo".
2. Completa los campos: Nombre de periodo, horas laborales y selecciona el rango de fechas en el calendario.
3. Presiona "Crear" y el periodo es creado si no coincide con fechas de un periodo anterior.

## Errores comunes
- No debería generar errores mayores.

## Requisitos previos
- El usuario debe tener rol `manager` y tener sesión iniciada.
- OBLIGATORIO que el usuario tenga rol `manager`.
- El backend debe tener conectividad con la base de datos activa.

## Ejemplo real
> El usuario "user5" ingresa, selecciona la opción "Crear Periodo", carga la información necesaria y se crea el periodo si no coincide con otra fecha de un periodo anterior.

## Resultado esperado
La información queda registrada en la base, y se utilizará para mostrar las encuestas a los usuarios correspondientes.