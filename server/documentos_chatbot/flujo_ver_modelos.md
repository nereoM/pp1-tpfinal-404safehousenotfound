# Ver predicciones de modelos de machine learning.

## Descripción
Este proceso permite que un usuario con el rol de manager, relutador puedan ingresar a la interfaz de predicciones y visualizar las predicciones sobre rendimiento futuro, riesgo de renuncia, riesgo de despido, riesgo de rotacion intencional y riesgo de rotacion de la empresa.

## Pasos detallados
1. El manager, reclutador o empleado ingresa al panel de "Visualizar predicciones".
2. Si tiene empleados a su cargo y los mismos tienen info laboral, le aparecen las predicciones.

## Errores comunes
- No tener empleados a su cargo o que los mismos no tengan informacion laboral cargada.

## Requisitos previos
- El usuario debe tener rol 'manager', 'reclutador' y tener sesión iniciada.
- El backend debe tener conectividad con la base de datos activa.

## Ejemplo real
> El usuario "user5" ingresa, selecciona la opción "Visualizar predicciones", luego, si tiene empleados a su cargo y con informacion laboral cargada, le aparecera en una tabla toda la informacion.

## Resultado esperado
El usuario vera las predicciones de sus empleados a cargo.