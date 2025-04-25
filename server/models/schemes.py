from sqlalchemy.ext.hybrid import hybrid_property
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)
    correo = db.Column(db.String(100), nullable=False, unique=True)
    _contrasena = db.Column(db.String(512), nullable=False)
    confirmado = db.Column(db.Boolean, default=False)

    @hybrid_property
    def contrasena(self):
        return self._contrasena
    
    @contrasena.setter
    def contrasena(self, contrasena):
        self._contrasena = generate_password_hash(contrasena)

    def verificar_contrasena(self, password):
        return check_password_hash(self._contrasena, password)
    
    def confirmar_usuario(self):
        self.confirmado = True
        db.session.commit()

    roles = db.relationship("Rol", secondary='usuarios_roles', back_populates="usuarios")

    def tiene_rol(self, rol):
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