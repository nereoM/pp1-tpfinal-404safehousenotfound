from models.schemes import Notificacion, UsuarioTelegram, Usuario
from models.extensions import db
from services.config import Config
from flask import Blueprint, jsonify, request
import requests
from flask_jwt_extended import get_jwt_identity, jwt_required
import json

notificacion_bp = Blueprint("notificacion", __name__)

def crear_notificacion(id_usuario, mensaje):
    notificacion = Notificacion(
        id_usuario=id_usuario,
        mensaje=mensaje,
    )
    db.session.add(notificacion)
    db.session.commit()
    

@notificacion_bp.route("/enviar-notificacion-telegram", methods=["POST"])
def enviar_telegram():
    data = request.get_json()
    texto = data.get("mensaje")
    chat_id = data.get("chat_id")

    if not texto or not chat_id:
        return jsonify({"error": "Faltan datos"}), 400

    resultado = enviar_mensaje_telegram(chat_id, texto)
    return jsonify(resultado), 200

def enviar_mensaje_telegram(chat_id, texto, bot_token=None):
    if bot_token is None:
        bot_token = Config.TELEGRAM_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": texto
    }
    r = requests.post(url, json=payload)
    return r.json()

@notificacion_bp.route("/webhook-telegram", methods=["POST"])
def webhook_telegram():
    data = request.get_json()
    try:
        mensaje = data["message"]
        chat_id = mensaje["chat"]["id"]
        texto = mensaje["text"].strip()
        nombre = mensaje["from"].get("first_name", "")

        if texto.startswith("/start "):
            id_usuario = texto.replace("/start ", "").strip()
            usuario = Usuario.query.get(int(id_usuario))

            if usuario:
                guardar_chat_id_telegram(usuario.id, chat_id, nombre)
                enviar_mensaje_telegram(chat_id, "¡Listo! Te registré para recibir notificaciones.", Config.TELEGRAM_TOKEN)
                return jsonify({"ok": True}), 200
            else:
                enviar_mensaje_telegram(chat_id, "No encontré tu usuario en el sistema.", Config.TELEGRAM_TOKEN)
                return jsonify({"error": "usuario no encontrado"}), 404

        return jsonify({"ok": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def guardar_chat_id_telegram(id_usuario, chat_id, nombre=None):
    existente = UsuarioTelegram.query.filter_by(id_usuario=id_usuario).first()
    if existente:
        existente.chat_id = chat_id
        if nombre:
            existente.nombre = nombre
    else:
        nuevo = UsuarioTelegram(
            id_usuario=id_usuario,
            chat_id=chat_id,
            nombre=nombre
        )
        db.session.add(nuevo)
    db.session.commit()

@notificacion_bp.route("/telegram/link", methods=["GET"])
@jwt_required()
def generar_link_telegram():
    id_usuario = get_jwt_identity()
    link = f"https://t.me/sigrh404_bot?start={id_usuario}"
    return jsonify({"link": link})

@notificacion_bp.route("/telegram/configurar-webhook", methods=["GET"])
def configurar_webhook():
    bot_token = Config.TELEGRAM_TOKEN
    dominio = Config.DOMINIO_PUBLICO.rstrip("/")
    url_webhook = f"{dominio}/api/webhook-telegram"

    response = requests.get(
        f"https://api.telegram.org/bot{bot_token}/setWebhook",
        params={"url": url_webhook}
    )
    return jsonify(response.json())
