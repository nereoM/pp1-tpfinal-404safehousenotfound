# Crear encuestas

## Descripción
Este proceso permite que un manager, reclutador o jefe de area cree una encuesta de distintos tipos. Hay encuestas de uso de la plataforma, clima laboral, etc. Los manager pueden crear encuestas para los reclutador de su empresa, los reclutador pueden crear encuestas para los empleados o jefes de area de su empresa, y los jefes de area pueden crear encuestas para los empleados de su area.

## Pasos detallados
1. El manager/reclutador/jefe de area ingresa al panel y hace clic en "Crear Encuesta".
2. Completa los campos: Tipo de pregunta, pregunta, opciones para responder y si es obligatoria o no.
3. Selecciona los usuarios a los que va a ser enviada la encuesta.
4. Presiona "Finalizar" y la encuesta es enviada a todos los destinatarios seleccionados.

## Errores comunes
- No debería generar errores mayores.

## Requisitos previos
- El usuario debe tener rol `manager` o `reclutador` o `empleado` y tener sesión iniciada.
- El backend debe tener conectividad con la base de datos activa.

## Ejemplo real
> El usuario "user5" ingresa, selecciona la opción "Crear Encuesta", carga la información que considera necesaria, apreta en finalizar y se envian las encuestas.

## Resultado esperado
La información queda registrada en la base, y se utilizará para mostrar las encuestas a los usuarios correspondientes.