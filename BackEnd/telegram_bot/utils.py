# telegram_bot/utils.py
import urllib.request
import urllib.error
import json
import logging

logger = logging.getLogger(__name__)

# Configuración del bot - estos valores se cargan desde settings
TELEGRAM_BOT_TOKEN = "8715084597:AAFaSQNDvK7nbkBwd2Q_dVSO8fpPZI03OJY"


def send_telegram_message(chat_id, mensaje):
    """
    Envía un mensaje a un chat específico de Telegram.
    """
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    data = json.dumps({
        "chat_id": str(chat_id),
        "text": mensaje
    }).encode('utf-8')
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                logger.info(f"Mensaje enviado a {chat_id}")
                return True
            else:
                logger.error(f"Error al enviar mensaje: {response.status}")
                return False
    except Exception as e:
        logger.error(f"Excepcion al enviar Telegram: {str(e)}")
        return False


def send_telegram_message_to_all(mensaje):
    """
    Envía un mensaje a TODOS los usuarios que tienen Telegram vinculado.
    """
    from django.contrib.auth.models import User
    
    # Buscar todos los usuarios con telegram_activo = True
    usuarios = User.objects.filter(telegram_activo=True, telegram_chat_id__isnull=False)
    
    count = 0
    for usuario in usuarios:
        try:
            if send_telegram_message(usuario.telegram_chat_id, mensaje):
                count += 1
        except Exception as e:
            logger.error(f"Error al enviar a {usuario.username}: {e}")
    
    logger.info(f"Mensaje enviado a {count} usuarios")
    return count


def send_telegram_message_to_user(user_id, mensaje):
    """
    Envía un mensaje a un usuario específico.
    """
    from django.contrib.auth.models import User
    
    try:
        usuario = User.objects.get(id=user_id, telegram_activo=True, telegram_chat_id__isnull=False)
        return send_telegram_message(usuario.telegram_chat_id, mensaje)
    except User.DoesNotExist:
        logger.warning(f"Usuario {user_id} no encontrado o inactivo")
        return False


def format_stock_alert_message(codigo, descripcion, cantidad, proveedores=None):
    """
    Formatea el mensaje de alerta de stock bajo.
    """
    prov_str = ""
    if proveedores:
        prov_list = []
        for p in proveedores:
            nombre = p.get('nombre', 'Sin nombre')
            telefono = p.get('telefono', 'Sin telefono')
            prov_list.append(f"  - {nombre}: {telefono}")
        if prov_list:
            prov_str = "\nProveedores:\n" + "\n".join(prov_list)
    
    return f"""
[ALERTA] STOCK BAJO

Producto:
- Codigo: {codigo}
- Descripcion: {descripcion}
- Cantidad actual: {cantidad}
{prov_str}

Por favor reponer este producto.
""".strip()


def notify_stock_low(codigo, descripcion, cantidad, proveedores=None):
    """
    Envía notificación de stock bajo a TODOS los usuarios activos.
    """
    mensaje = format_stock_alert_message(codigo, descripcion, cantidad, proveedores)
    return send_telegram_message_to_all(mensaje)


def set_webhook(url):
    """
    Configura el webhook del bot de Telegram.
    """
    webhook_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook"
    
    data = json.dumps({
        "url": url
    }).encode('utf-8')
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        req = urllib.request.Request(webhook_url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            logger.info(f"Webhook configurado: {result}")
            return result
    except Exception as e:
        logger.error(f"Error al configurar webhook: {e}")
        return {"ok": False, "error": str(e)}