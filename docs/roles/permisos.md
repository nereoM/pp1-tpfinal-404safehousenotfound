# Documentación de Casos de Uso y Permisos por Rol

## 🧭 Descripción General

Este documento detalla los casos de uso definidos para el sistema y los permisos asignados a cada uno de los roles principales: **Administrador**, **Reclutador** y **Postulante**. También se describe un actor intermedio, **Usuario RRHH**, que agrupa las funcionalidades comunes entre Administrador y Reclutador.

Los permisos están definidos a partir del enunciado del trabajo práctico, en concreto a partir de los detalles de las funcionalidades de los módulos que elegimos vamos a implementar (Gestión de Reclutamiento de Talentos, Gestión de Desempeño y Desarrollo, Módulo de reportaría y analítica)

Se usa un diagrama de casos de usos para identificar los permisos y límites de cada rol.

---

## 🎭 Actores del Sistema

- **Administrador**
  - Usuario con acceso completo al sistema.
  - Puede gestionar usuarios, roles y datos críticos.

- **Reclutador**
  - Usuario encargado de publicar ofertas y gestionar postulantes.
  - Pertenece al área de Recursos Humanos.

- **Postulante**
  - Usuario externo que se postula a ofertas laborales.

---

## ✅ Permisos por Rol

| Acción                            | Admin | Reclutador | Postulante |
|----------------------------------|:-----:|:----------:|:----------:|
| Crear cuenta/Iniciar sesión      |  ✅   |     ✅     |     ✅     |
| Ver listado de ofertas           |  ✅   |     ✅     |     ✅     |
| Publicar una nueva oferta        |  ❌   |     ✅     |     ❌     |
| Postularse a una oferta          |  ❌   |     ❌     |     ✅     |
| Editar o eliminar ofertas        |  ✅   |     ✅     |     ❌     |
| **Visualizar candidatos aptos***      |  ❌   |     ✅     |     ❌     |
| **configurar etiquetas de aptitud***  |  ❌   |     ✅     |     ❌     |
| Gestionar usuarios               |  ✅   |     ❌     |     ❌     |
| Asignar o modificar roles        |  ✅   |     ❌     |     ❌     |
| Ver perfil propio                |  ✅   |     ✅     |     ✅     |
| Ver estado postulación           |  ✅   |     ✅     |     ✅     |
| Ver dashboard                    |  ✅   |     ✅     |     ❌     |
| Generar reporte                  |  ✅   |     ✅     |     ❌     |

**Reveer si tambien se le permite al rol de admin*
---

## 🗂 Casos de Uso Representados

### Casos Básicos
- Creación de usuario
- Inicar sesión en el sistema
- Visualizar ofertas de trabajo

### Casos Comunes (Usuario RRHH)
- Consultar listado de postulantes
- Visualizar dashboard y generar reportes

### Casos Exclusivos de Administrador
- Asignar roles
- Eliminar usuarios

### Casos Exclusivos de Reclutador
- Gestionar ofertas laborales
- Revisar y calificar CVs

### Casos Exclusivos de Postulante
- Postularse a ofertas
- Ver estado de sus postulaciones

---

## ✅ Permisos por Recursos
Esta tabla detalla los permisos de acceso que tiene cada rol dentro del sistema para interactuar con los distintos recursos o entidades de la base de datos. Estos permisos se utilizan para definir el acceso a los endpoints de la API.

Los permisos están representados por las siguientes letras:

- 🅲 = Crear
- 🆁 = Leer
- 🆄 = Actualizar
- 🅳 = Eliminar

| Recurso                            | Admin | Reclutador | Postulante |
|----------------------------------|:-----:|:----------:|:----------:|
| Usuario                          |  🅲 🆁 🆄 🅳   |     🅲  🅳     |     🅲        |
| Postulacion laboral              |  🆁 🆄 🅳   |     🅲 🆁 🆄 🅳     |     🆁        |
| Oferta laboral                   |  🆁           |     🆁 🆄 🅳        |     🅲 🆁     |


## 📝 Cambios en el Diagrama

| Fecha       | Responsable | Versión | Descripción                       |
|-------------|-------------|---------|-----------------------------------|
| 2025-04-23  | Santiago Zarate | v1.0    | Versión inicial del diagrama |

---

## 📎 Archivos relacionados

- `docs/roles/diagrama-casos-de-uso-roles.drawio.svg` (Se puede visualizar y editar en draw.io)

