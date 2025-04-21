from sqlalchemy.ext.hybrid import hybrid_property
from .extensions import db, pwd_context

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)
    correo = db.Column(db.String(100), nullable=False, unique=True)
    _contrasena = db.Column(db.String(100), nullable=False)

    @hybrid_property
    def contrasena(self):
        return self._contrasena
    
    @contrasena.setter
    def contrasena(self, contrasena):
        self._contrasena = pwd_context.hash(contrasena)

    def verificar_contrasena(self, contrasena):
        return pwd_context.verify(contrasena, self._contrasena)


    roles = db.relationship("Rol", secondary='usuarios_roles', back_populates="usuarios")

    def verificar_rol(self, rol):
        return bool(
            Rol.query.join(Rol.usuarios).filter(Usuario.id == self.id, Rol.slug == rol).count() == 1
        )

class Rol(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)
    permisos = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(50), nullable=False, unique=True)

    usuarios = db.relationship("Usuario", secondary='usuarios_roles', back_populates="roles")


class UsuarioRol(db.Model):
    __tablename__ = 'usuarios_roles'

    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), primary_key=True)
    id_rol = db.Column(db.Integer, db.ForeignKey('roles.id'), primary_key=True)


