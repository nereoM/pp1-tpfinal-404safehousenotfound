# Creación de oferta laboral

## Descripción
Este proceso permite que un manager cree una nueva oferta laboral y la asigne a un reclutador dentro de su empresa. Un reclutador/analista puede tener varias ofertas laborales asignadas, pero una oferta laboral solo puede estar asignada a un reclutador/analista al mismo tiempo.

## Pasos detallados
1. El manager ingresa al panel y hace clic en "Crear Oferta".
2. Completa los campos obligatorios: nombre, salario, modalidad, tipo de trabajo (Remoto, presencial, híbrido).
3. El manager puede elegir el umbral de evaluación de los CVs.
4. El manager puede seleccionar varias etiquetas para el procesado automático de CVs de un banco de etiquetas ya predefinido.
5. La oferta se publica y queda disponible para los candidatos y empleados.

## Errores comunes
- No seleccionar modalidad laboral.
- Ingresar salario en formato incorrecto o que el salario mínimo sea mayor al salario máximo.
- Selección incorrecta de fecha de cierre.

## Requisitos previos
- El usuario debe tener rol `manager` y tener sesión iniciada.
- El backend debe tener conectividad con la base de datos activa.

## Ejemplo real
> El usuario "user5" ingresa, carga una oferta para "Desarrollador Python", con salario entre 800k y 1M, y si todos los campos obligatorios estan llenos y son correctos, la oferta se crea.

## Resultado esperado
La oferta queda registrada en la base, y visible en la sección de postulaciones para candidatos.

