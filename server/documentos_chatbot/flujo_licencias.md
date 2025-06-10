# Solicitar una licencia.

## Descripción
Este proceso permite que un usuario con el rol de manager, relutador o empleado puedan solicitar una licencia. Los tipos de licencias disponibles son: Vacaciones, enfermedad, mudanza, matrimonio, paternidad.

## Pasos detallados
1. El manager, reclutador o empleado ingresa al panel de "Cargar una licencia".
2. Elije el tipo de licencia y sube el certificado si corresponde.
3. Apreta el boton de solicitar licencia.

## Errores comunes
- Solicitar una licencia sin subir un certificado.

## Requisitos previos
- El usuario debe tener rol 'manager', 'reclutador' o 'empleado' y tener sesión iniciada.
- El backend debe tener conectividad con la base de datos activa.

## Ejemplo real
> El usuario "user5" ingresa, selecciona la opción "Cargar licencia", elije el tipo de licencia que necesite y carga el certificado si corresponde.

## Resultado esperado
La licencia quedara registrada y el superior podra visualizarla, aprobarla o rechazarla.