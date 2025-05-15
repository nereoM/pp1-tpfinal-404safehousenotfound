from models.schemes import Notificacion
from models.extensions import db

def crear_notificacion(id_usuario, mensaje):
    notificacion = Notificacion(
        id_usuario=id_usuario,
        mensaje=mensaje,
    )
    db.session.add(notificacion)
    db.session.commit()