# Documentación de Casos de Uso y Permisos por Rol

## 🧭 Descripción General

Este documento detalla los casos de uso definidos para el sistema y los permisos asignados a cada uno de los roles principales: **Administrador**, **Reclutador** y **Postulante**. También se describe un actor intermedio, **Usuario RRHH**, que agrupa las funcionalidades comunes entre Administrador y Reclutador.

Los permisos están definidos a partir del enunciado del trabajo práctico, en concreto a partir de los detalles de las funcionalidades de los módulos que elegimos vamos a implementar (Gestión de Reclutamiento de Talentos, Gestión de Desempeño y Desarrollo, Módulo de reportaría y analítica)

Se usa un diagrama de casos de usos para identificar los permisos y límites de cada rol.

---

 Actores del Sistema

ROOT (SuperAdministrador)

Tiene acceso total a la plataforma SaaS.

Crea empresas, administra sus parámetros globales, y puede suspender cuentas.

Admin de Empresa

Usuario con control sobre su propia organización.

Puede gestionar usuarios internos, crear managers, y personalizar la apariencia del entorno.

RRHH Manager

Encargado de gestionar candidatos, visualizar métricas y subir evaluaciones.

Recibe alertas sobre posibles riesgos de renuncia, incluyendo puestos clave.

RRHH Analista

Rol con permisos de análisis limitado.

Puede visualizar dashboards y recibir alertas relacionadas a posiciones no críticas.

Usuario / Candidato

Usuario externo que se postula a ofertas laborales.

Puede subir su CV, ver el estado de sus postulaciones y su propia evaluación.

Soporte Técnico

Usuario con acceso técnico al entorno del cliente.

Encargado de configurar parámetros como SMTP y gestionar solicitudes de cambio enviadas por la empresa.

---

## ✅ Permisos por Rol

| Acción                                                 | ROOT | Admin Empresa | RRHH Manager | RRHH Analista | Usuario / Candidato | Soporte Técnico |
|--------------------------------------------------------|------|----------------|---------------|----------------|----------------------|------------------|
| Crear cuenta / Iniciar sesión                          | ✔    | ✔              | ✔             | ✔              | ✔                     | ✔               |
| Crear nueva empresa                                    | ✔    | ✘              | ✘             | ✘              | ✘                     | ✘               |
| Crear Admin de empresa                                 | ✔    | ✘              | ✘             | ✘              | ✘                     | ✘               |
| Eliminar / suspender empresa                           | ✔    | ✘              | ✘             | ✘              | ✘                     | ✘               |
| Configurar ajustes globales (SMTP, logo y estilo)      | ✔    | ✘              | ✘             | ✘              | ✘                     | ✔               |
| Ver métricas y actividad general de todas las empresas | ✔    | ✘              | ✘             | ✘              | ✘                     | ✘               |
| Gestionar usuarios de su empresa                       | ✘    | ✔              | ✘             | ✘              | ✘                     | ✘               |
| Crear Managers en su empresa                           | ✘    | ✔              | ✘             | ✘              | ✘                     | ✘               |
| Ver dashboards y métricas de su empresa                | ✘    | ✔              | ✔             | ✔              | ✘                     | ✘               |
| Cargar CV / Postularse                                 | ✘    | ✘              | ✘             | ✘              | ✔                     | ✘               |
| Ver estado de postulación                              | ✘    | ✘              | ✘             | ✘              | ✔                     | ✘               |
| Visualizar candidatos aptos                            | ✘    | ✔              | ✔             | ✔ (limitado)   | ✘                     | ✘               |
| Subir evaluación de desempeño                          | ✘    | ✔              | ✔             | ✘              | ✘                     | ✘               |
| Visualizar evaluaciones propias                        | ✘    | ✔              | ✘             | ✘              | ✔                     | ✘               |
| Exportar informes                                      | ✘    | ✔              | ✔             | ✘              | ✘                     | ✘               |
| Configurar logo y estilo de la empresa                 | ✘    | ✔              | ✘             | ✘              | ✘                     | ✘               |
| Recibir alertas de riesgo (puestos clave)              | ✔    | ✔              | ✔             | ✘              | ✘                     | ✘               |
| Recibir alertas de riesgo (puestos básicos)            | ✔    | ✘              | ✔             | ✔              | ✘                     | ✘               |
| Gestionar solicitudes de cambio del cliente            | ✘    | ✘              | ✘             | ✘              | ✘                     | ✔               |



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

