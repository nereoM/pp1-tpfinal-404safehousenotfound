# Flujo de Postulación a Ofertas Laborales

## Descripción

Este proceso permite que usuarios con rol `candidato` o `empleado` se postulen a ofertas laborales disponibles. Antes de poder ver recomendaciones o postularse, deben subir su CV desde el encabezado de la interfaz.

## Reglas por Rol

| Rol        | Acceso a ofertas                            |
|------------|---------------------------------------------|
| Candidato  | ✅ Todas las ofertas públicas               |
| Empleado   | ✅ Solo ofertas de su propia empresa       |
| Otros      | ❌ No pueden postularse                      |


## Flujo completo

### 1. Subida de CV (Obligatorio antes de postularse)

- El usuario debe subir su CV en formato PDF.
- Accede al botón de "Subir CV" ubicado en la parte superior derecha de la interfaz.
- Una vez subido, se habilita la vista de ofertas recomendadas y la posibilidad de postularse.

*Si no sube el CV, podrá acceder al listado de ofertas pero no podrá recibir recomendaciones.*

### 2. Visualización de Ofertas

- **Candidatos**: ven todas las ofertas públicas del sistema.
- **Empleados**: solo ven las ofertas asociadas a su empresa.


### 3. Recomendaciones Personalizadas

- Una vez subido el CV, el sistema analiza el contenido del mismo.
- Se genera una lista de **ofertas recomendadas** según varias variables.
- El usuario puede navegar entre recomendaciones y todas las ofertas disponibles.


### 4. Postulación

- Al hacer clic en una oferta, el usuario ve los detalles.
- Debe seleccionar un CV de la lista de CVs disponibles (subidos previamente) que le aparecen al momento de postularse.
- Presiona el botón "Postularme".
- El sistema registra la postulación en la base de datos, junto con:
  - ID del usuario
  - ID de la oferta
  - Fecha de postulación
  - Estado inicial (ej: `pendiente` o `en revisión`)


## Requisitos previos

- Estar autenticado como `candidato` o `empleado`
- Haber subido un CV o varios validos.
- Tener acceso a las ofertas (según el rol)


## Errores comunes

- No haber subido CV (bloquea todo el flujo)
- Intentar postularse a ofertas fuera de su empresa (`empleado`)
- Duplicar postulaciones (el sistema puede prevenirlo)

## Resultado esperado

El usuario recibe una confirmación visual de que su postulación fue exitosa. Luego, podrá seguir el estado de sus postulaciones desde su panel personal, y recibir notificaciones por email o dentro de la app si su candidatura avanza.

