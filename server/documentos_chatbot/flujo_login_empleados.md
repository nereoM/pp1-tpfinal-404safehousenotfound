# Logearse como un usuario admin-emp, 'manager', 'reclutador', 'empleado'.

## Descripción
Este proceso permite que un usuario con una cuenta ya registrada como: admin-emp o 'manager' o 'reclutador' o 'empleado' pueda iniciar sesión/logearse, desde un login personalizado segun su empresa.

## Requisitos por Rol

| Rol        | Puede iniciar sesion               |
|------------|------------------------------------|
| admin-emp  | Autorizado                         |
| manager    | Autorizado                         |
| reclutador | Autorizado                         |
| empleado   | Autorizado                         |
| candidato  | No autorizado                      |


## Pasos detallados
1. Pulsar en Iniciar Sesión y Soy Empresa desde el home.
2. Inidicar el nombre de la empresa a la que pertenece.
3. Rellenar los datos para iniciar sesión.
4. Pulsa el botón Iniciar Sesión
5. Alternativa: pulsa el botón Acceder con Google y elige cuenta.

## Errores comunes
- No tener cuenta registrada.
- Se olvido la contraseña.
- No tiene su correo validado.
- Ingresar sus datos de forma incorrecta.
- Selección incorrecta de login (eligio login de candidato).
- Puso el nombre de otra empresa
- La empresa no existe en el sistema

## Requisitos previos
- El usuario debe SI O SI una cuenta registrada.
- El usuario deberia de tener el rol de admin-emp o 'manager' o 'reclutador' o 'empleado'.
- El usuario debe de pertenecer a una empresa
- El backend debe tener conectividad con la base de datos activa.

## Ejemplo real
> El usuario "user" quiere iniciar sesión en su cuenta que tiene los roles anteriomente mencionados, el usuario debera de indicar el nombre de su empresa y luego rellenar los formularios de forma correcta para poder acceder. 

## Resultado esperado
El usuario pudo ingresar sesión satisfactoriamente a su cuenta personal según su rol.