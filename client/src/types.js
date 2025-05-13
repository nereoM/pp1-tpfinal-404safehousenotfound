/**
 * @typedef {Object} CV
 * @property {number} id - ID del CV
 * @property {string} fecha_subida - Fecha en formato ISO
 * @property {string} tipo_archivo - Tipo de archivo, ej. 'pdf'
 * @property {string} url - URL del archivo
 */

/**
 * @typedef {Object} Oferta
 * @property {number} id - ID del la oferta
 * @property {string} titulo - Titulo de la oferta
 * @property {string} empresa - Empresa que ofrece la oferta laboral
 * @property {string[]} palabrasClave - Palabras clave de la oferta laboral
 * @property {number} postulaciones - Numero de postulaciones
 */

/**
 * @typedef {Object} Usuario
 * @property {number} id - ID del usuario
 * @property {string} nombre - Nombre del usuario
 * @property {string} correo - Correo electrónico
 * @property {string[]} roles - Lista de roles asignados al usuario
 * @property {number|null} id_empresa - ID de la empresa asociada (puede ser null)
 * @property {string} apellido - apellido del usuario
 * @property {string} username - username
 * @property {string} foto_url - url de la foto de perfil
 */


/**
 * @typedef {Object} Licencia
 * @property {number} id_licencia - ID de la licencia
 * @property {string} tipo - Tipo de licencia (por ejemplo, Vacaciones)
 * @property {string} descripcion - Descripción de la licencia
 * @property {string} fecha_inicio - Fecha de inicio en formato ISO o null
 * @property {string} estado - Estado de la licencia (por ejemplo, aprobada, pendiente)
 * @property {Object} empresa - Información de la empresa asociada
 * @property {number} empresa.id - ID de la empresa
 * @property {string} empresa.nombre - Nombre de la empresa
 * @property {string|null} certificado_url - URL del certificado adjunto o null
 */

/**
 * @typedef {Object} OfertaRecomendada
 * @property {number} coincidencia - Porcentaje o puntuación de coincidencia con el perfil del candidato
 * @property {string} empresa - Nombre de la empresa que publicó la oferta
 * @property {number} id_oferta - ID único de la oferta laboral
 * @property {string} nombre_oferta - Título de la oferta laboral
 * @property {string[]} palabras_clave - Palabras clave asociadas a la oferta
 */

/**
 * @typedef {Object} OfertaFiltrada
 * @property {string} empresa - Porcentaje o puntuación de coincidencia con el perfil del candidato
 * @property {number} id - Nombre de la empresa que publicó la oferta
 * @property {string} nombre_oferta - ID único de la oferta laboral
 * @property {string[]} palabras_clave - Palabras clave asociadas a la oferta
 */

/**
 * @typedef {Object} UserInfo
 * @property {string} nombre - Nombre del empleado
 * @property {string} apellido - Apellido del empleado
 * @property {string} username - Nombre de usuario del empleado
 * @property {string} correo - Correo electrónico del empleado
 */


/**
 * @typedef {Object} OfertasEmpresa
 * @property {Empresa} empresa - Información sobre la empresa
 * @property {OfertaExtendido[]} ofertas - Lista de ofertas laborales publicadas por la empresa
*/

/**
 * @typedef {Object} Empresa
 * @property {number} id - ID de la empresa
 * @property {string} nombre - Nombre de la empresa
 * @property {string} correo - Correo electrónico de la empresa
 */

/**
 * @typedef {Object} OfertaExtendido
 * @property {number} id - ID de la oferta
 * @property {string} nombre - Nombre de la oferta
 * @property {string} descripcion - Descripción de la oferta
 * @property {string} location - Ubicación de la oferta
 * @property {string} employment_type - Tipo de empleo (full-time, part-time, etc.)
 * @property {string} workplace_type - Tipo de lugar de trabajo (presencial, remoto, híbrido)
 * @property {number} salary_min - Salario mínimo de la oferta
 * @property {number} salary_max - Salario máximo de la oferta
 * @property {string} currency - Moneda en que se paga (ej. "ARS", "USD")
 * @property {string} experience_level - Nivel de experiencia requerido (junior, senior, etc.)
 * @property {string} fecha_publicacion - Fecha de publicación de la oferta
 * @property {string} fecha_cierre - Fecha de cierre de la oferta
 */

/**
 * @typedef {Object} EstadoPostulacion
 * @property {number} id_oferta
 * @property {string} nombre_oferta
 * @property {number} id_postulacion
 * @property {string} fecha_postulacion
 * @property {string} estado
 */
