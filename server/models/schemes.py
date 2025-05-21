import json
import pickle

from sqlalchemy.ext.hybrid import hybrid_property
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db

from datetime import datetime, timezone


class Usuario(db.Model):
    __tablename__ = "usuarios"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=False)
    username = db.Column(db.String(50), nullable=False, unique=True)
    correo = db.Column(db.String(100), nullable=False, unique=True)
    _contrasena = db.Column(db.String(512), nullable=False)
    confirmado = db.Column(db.Boolean, default=False)
    id_empresa = db.Column(
        db.Integer, db.ForeignKey("empresas.id"), nullable=True
    )  # Relación con Empresa
    activo = db.Column(db.Boolean, default=True)
    id_superior = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)
    foto_url = db.Column(db.String(255), nullable=True)
    fecha_ingreso = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    puesto_trabajo = db.Column(db.String(50), nullable=True)

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

    roles = db.relationship(
        "Rol", secondary="usuarios_roles", back_populates="usuarios"
    )

    def tiene_rol(self, rol):
        return bool(
            Rol.query.join(Rol.usuarios)
            .filter(Usuario.id == self.id, Rol.slug == rol)
            .count()
            == 1
        )


class Rol(db.Model):
    __tablename__ = "roles"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)
    permisos = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(50), nullable=False, unique=True)

    usuarios = db.relationship(
        "Usuario", secondary="usuarios_roles", back_populates="roles"
    )


class UsuarioRol(db.Model):
    __tablename__ = "usuarios_roles"
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id"), primary_key=True)
    id_rol = db.Column(db.Integer, db.ForeignKey("roles.id"), primary_key=True)


class CV(db.Model):
    __tablename__ = "cvs"
    id = db.Column(db.Integer, primary_key=True)
    id_candidato = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    url_cv = db.Column(db.String(255), nullable=False)
    tipo_archivo = db.Column(db.String(200))
    fecha_subida = db.Column(db.DateTime, default=db.func.now())

    usuario = db.relationship("Usuario", backref="cvs")


class Empresa(db.Model):
    __tablename__ = "empresas"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)
    correo = db.Column(db.String(100), nullable=False, unique=True)
    id_admin_emp = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)

    admin_emp = db.relationship(
        "Usuario", backref="empresa", foreign_keys=[id_admin_emp]
    )

    def __init__(self, nombre, id_admin_emp):
        self.nombre = nombre
        self.correo = f"{nombre.lower().replace(' ', '_')}@empresa.com"
        self.id_admin_emp = id_admin_emp


class TarjetaCredito(db.Model):
    __tablename__ = "tarjetas_credito"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    numero_tarjeta = db.Column(db.String(16), nullable=False, unique=True)
    nombre = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # Ejemplo: Visa, Mastercard
    cvv = db.Column(db.String(4), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)

    usuario = db.relationship("Usuario", backref="tarjetas_credito")


class Oferta_laboral(db.Model):
    __tablename__ = "ofertas_laborales"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_empresa = db.Column(db.Integer, db.ForeignKey("empresas.id"), nullable=False)
    id_creador = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    employment_type = db.Column(db.String(50), nullable=False)
    workplace_type = db.Column(db.String(50), nullable=False)
    salary_min = db.Column(db.Float, nullable=False)
    salary_max = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    experience_level = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    palabras_clave = db.Column(db.Text, nullable=False)
    fecha_publicacion = db.Column(db.DateTime, default=db.func.now())
    fecha_cierre = db.Column(db.DateTime, nullable=True)
    umbral_individual = db.Column(db.Float, nullable=True)

    empresa = db.relationship("Empresa", backref="ofertas_laborales")


class Oferta_analista(db.Model):
    __tablename__ = "ofertas_analista"
    id_oferta = db.Column(
        db.Integer, db.ForeignKey("ofertas_laborales.id"), primary_key=True
    )
    id_analista = db.Column(db.Integer, db.ForeignKey("usuarios.id"), primary_key=True)
    estado = db.Column(db.String(50), default="asignada")


class Job_Application(db.Model):
    __tablename__ = "job_application"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_candidato = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    id_oferta = db.Column(
        db.Integer, db.ForeignKey("ofertas_laborales.id"), nullable=False
    )
    id_cv = db.Column(db.Integer, db.ForeignKey("cvs.id"), nullable=False)
    is_apto = db.Column(db.Boolean, nullable=False)
    fecha_postulacion = db.Column(db.DateTime, default=db.func.now())
    estado_postulacion = db.Column(db.String(50), nullable=False)
    porcentaje_similitud = db.Column(db.Float, nullable=True)

    candidato = db.relationship("Usuario", backref="cv_files")


class Licencia(db.Model):
    __tablename__ = "licencias"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_empleado = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    fecha_inicio = db.Column(db.DateTime, nullable=True)
    fecha_fin = db.Column(db.DateTime, nullable=True)
    certificado_url = db.Column(db.String(255), nullable=True)  # AL MENOS POR AHORA
    estado = db.Column(db.String(50), nullable=False)
    id_empresa = db.Column(db.Integer, db.ForeignKey("empresas.id"), nullable=False)
    motivo_rechazo = db.Column(db.Text, nullable=True)
    dias_requeridos = db.Column(db.Integer, nullable=True)

class Preferencias_empresa(db.Model):
    __tablename__ = "preferencias_empresa"
    id_empresa = db.Column(db.Integer, db.ForeignKey("empresas.id"), primary_key=True)
    slogan = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(700), nullable=True)
    color_principal = db.Column(db.String(7), nullable=False) # COLOR HEX
    color_secundario = db.Column(db.String(7), nullable=False)
    color_texto = db.Column(db.String(7), nullable=False)

class RendimientoEmpleado(db.Model):
    __tablename__ = 'rendimiento_empleados'
    
    id = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False, index=True)
    desempeno_previo = db.Column(db.Float, nullable=True)
    cantidad_proyectos = db.Column(db.Integer, nullable=True)
    tamano_equipo = db.Column(db.Integer, nullable=True)
    horas_extras = db.Column(db.Integer, nullable=True)
    antiguedad = db.Column(db.Integer, nullable=True)
    horas_capacitacion = db.Column(db.Integer, nullable=True)
    ausencias_injustificadas = db.Column(db.Integer, nullable=True)
    llegadas_tarde = db.Column(db.Integer, nullable=True)
    salidas_tempranas = db.Column(db.Integer, nullable=True)
    rendimiento_futuro_predicho = db.Column(db.Float, nullable=True)
    riesgo_rotacion_predicho = db.Column(db.String(50), nullable=True)
    riesgo_despido_predicho = db.Column(db.String(50), nullable=True)
    riesgo_renuncia_predicho = db.Column(db.String(50), nullable=True)
    clasificacion_rendimiento = db.Column(db.String(50), nullable=True)
    fecha_calculo_rendimiento = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=True)

    # Relación con Usuario
    usuario = db.relationship('Usuario', backref='rendimiento')
    
    def actualizar_rendimiento(self, data):
        self.desempeno_previo = data.get('desempeno_previo', self.desempeno_previo)
        self.cantidad_proyectos = data.get('cantidad_proyectos', self.cantidad_proyectos)
        self.tamano_equipo = data.get('tamano_equipo', self.tamano_equipo)
        self.horas_extras = data.get('horas_extras', self.horas_extras)
        self.antiguedad = data.get('antiguedad', self.antiguedad)
        self.horas_capacitacion = data.get('horas_capacitacion', self.horas_capacitacion)
        
        
class Notificacion(db.Model):
    __tablename__ = 'notificaciones'

    id = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    mensaje = db.Column(db.String(1000), nullable=False)
    leida = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    usuario = db.relationship('Usuario', backref=db.backref('notificaciones', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'id_usuario': self.id_usuario,
            'mensaje': self.mensaje,
            'leida': self.leida,
            'fecha_creacion': self.fecha_creacion
        }
    
class HistorialRendimientoEmpleado(db.Model):
    __tablename__ = 'historial_rendimiento_empleados'

    id_empleado = db.Column(db.Integer, db.ForeignKey('usuarios.id'), primary_key=True, index=True)
    fecha_calculo = db.Column(db.DateTime, primary_key=True, default=datetime.utcnow)
    rendimiento = db.Column(db.Float, nullable=False)

    empleado = db.relationship('Usuario', backref='historial_rendimiento')


def guardar_modelo_en_oferta(id_oferta, modelo, vectorizador, palabras_clave):
    oferta = Oferta_laboral.query.get(id_oferta)

    if not oferta:
        raise Exception(f"No se encontró la oferta laboral con id {id_oferta}")

    oferta.modelo = pickle.dumps(modelo)
    oferta.vectorizador = pickle.dumps(vectorizador)
    oferta.palabras_clave = json.dumps(palabras_clave)

    db.session.commit()
    return True
