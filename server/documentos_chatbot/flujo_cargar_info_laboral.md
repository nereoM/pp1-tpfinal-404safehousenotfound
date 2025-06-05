# Cargar información laboral de empleados

## Descripción
Este proceso permite que un manager ingrese información laboral de sus empleados/analistas por medio de una tabla, la cual mostrará la información laboral previa de los mismos al momento de cargar nueva información. Esta tabla se encuentra en la sección Editar métricas de empleados. El manager podrá cargar información como horas extras, horas de capacitación, ausencias injustificadas, llegadas tarde y salidas tempranas.

## Pasos detallados
1. El manager ingresa al panel y hace clic en "Editar métricas de empleados".
2. Completa los campos: horas extras, horas de capacitación, ausencias injustificadas, llegadas tarde y salidas tempranas. No son obligatorios.
3. El manager apreta el botón de guardar.
4. Se actualiza la información de los empleados.

## Errores comunes
- No debería generar errores mayores.

## Requisitos previos
- El usuario debe tener rol `manager` y tener sesión iniciada.
- El backend debe tener conectividad con la base de datos activa.

## Ejemplo real
> El usuario "user5" ingresa, selecciona la opción "Editar métricas empleados", carga la información que considera necesaria a los empleados que elija, apreta en guardar y se actualiza la información.

## Resultado esperado
La información queda registrada en la base, y se utilizará para las predicciones de rendimiento futuro y riesgos.