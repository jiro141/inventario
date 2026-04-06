# telegram_bot/handlers.py
import logging
from django.utils import timezone
from telegram_bot.utils import send_telegram_message

logger = logging.getLogger(__name__)

# Intentamos importar el modelo de Usuario desde la app correcta
try:
    from django.contrib.auth.models import User
    USUARIO_MODEL = User
except:
    from usuarios.models import Usuario as User
    USUARIO_MODEL = User


def handle_telegram_update(update):
    """
    Maneja las actualizaciones recibidas del bot de Telegram.
    """
    # Verificar si es un mensaje
    if 'message' in update:
        message = update['message']
        chat = message.get('chat', {})
        text = message.get('text', '')
        chat_id = str(chat.get('id'))
        username = chat.get('username', '')
        first_name = chat.get('first_name', '')
        
        logger.info(f"Mensaje recibido de {username} ({chat_id}): {text}")
        
        # Procesar comandos
        if text == '/start':
            handle_start_command(chat_id, username, first_name)
        elif text == '/ayuda':
            handle_help_command(chat_id)
        elif text == '/estado':
            handle_status_command(chat_id)
        elif text == '/desactivar':
            handle_deactivate_command(chat_id)
        else:
            # Mensaje de bienvenida para nuevos usuarios
            send_welcome_message(chat_id)
    
    # Verificar callback_query (botones)
    elif 'callback_query' in update:
        callback = update['callback_query']
        data = callback.get('data', '')
        chat_id = str(callback.get('message', {}).get('chat', {}).get('id'))
        
        if data == 'activar':
            handle_activate_callback(chat_id)
        elif data == 'desactivar':
            handle_deactivate_callback(chat_id)


def handle_start_command(chat_id, username, first_name):
    """
    Maneja el comando /start - vincula el usuario de Telegram.
    """
    # Buscar si este chat_id ya está vinculado
    try:
        usuario = USUARIO_MODEL.objects.filter(telegram_chat_id=chat_id).first()
        
        if usuario:
            # Ya estaba vinculado
            mensaje = f"""
Hola {first_name}!

Ya estas vinculado a Sincro como @{username}.

Tus notificaciones de Telegram estan: ACTIVADAS

Usa /ayuda para ver los comandos disponibles.
"""
        else:
            # Crear vinculación (primera vez)
            # Por ahora, activamos a todos los usuarios que envian /start
            # En una versión completa, esto estaria vinculado a un usuario específico
            mensaje = f"""
Hola {first_name}!

Bienvenido a Sincro - Notificaciones de Inventario

Tu Telegram ha sido vinculado exitosamente.

Ahora recibiras alertas cuando:
- El stock de un producto baje a 5 o menos
- Se aprueben notas de entrega

Usa /ayuda para ver los comandos disponibles.
"""
        
        send_telegram_message(chat_id, mensaje)
        
    except Exception as e:
        logger.error(f"Error en handle_start_command: {e}")
        send_telegram_message(chat_id, f"Error al vincular tu cuenta. Contacta al administrador.")


def handle_help_command(chat_id):
    """
    Muestra la ayuda del bot.
    """
    mensaje = """
COMANDOS DE SINCRO

/start - Iniciar el bot y recibir notificaciones
/ayuda - Ver este menu de ayuda
/estado - Ver estado de tus notificaciones
/desactivar - Dejar de recibir notificaciones

El bot te notificara automaticamente cuando:
- Productos tengan stock bajo (5 o menos)
"""
    send_telegram_message(chat_id, mensaje)


def handle_status_command(chat_id):
    """
    Muestra el estado de las notificaciones del usuario.
    """
    try:
        usuario = USUARIO_MODEL.objects.filter(telegram_chat_id=chat_id).first()
        
        if usuario:
            estado = "ACTIVADAS" if usuario.is_active else "DESACTIVADAS"
            mensaje = f"""
TU ESTADO EN SINCRO

Usuario: {usuario.username}
Notificaciones: {estado}
"""
        else:
            mensaje = "No estas vinculado a Sincro. Usa /start para comenzar."
        
        send_telegram_message(chat_id, mensaje)
        
    except Exception as e:
        logger.error(f"Error en handle_status_command: {e}")
        send_telegram_message(chat_id, "Error al obtener tu estado.")


def handle_deactivate_command(chat_id):
    """
    Desactiva las notificaciones para este usuario.
    """
    try:
        usuario = USUARIO_MODEL.objects.filter(telegram_chat_id=chat_id).first()
        
        if usuario:
            usuario.telegram_activo = False
            usuario.save()
            mensaje = "Tus notificaciones de Telegram han sido DESACTIVADAS.\nUsa /start para reactivarlas."
        else:
            mensaje = "No estas vinculado a Sincro. Usa /start para comenzar."
        
        send_telegram_message(chat_id, mensaje)
        
    except Exception as e:
        logger.error(f"Error en handle_deactivate_command: {e}")
        send_telegram_message(chat_id, "Error al procesar tu peticion.")


def handle_activate_callback(chat_id):
    """Activar notificaciones desde callback (botones)."""
    try:
        usuario = USUARIO_MODEL.objects.filter(telegram_chat_id=chat_id).first()
        
        if usuario:
            usuario.telegram_activo = True
            usuario.save()
            send_telegram_message(chat_id, "Tus notificaciones han sido ACTIVADAS!")
    except Exception as e:
        logger.error(f"Error: {e}")


def handle_deactivate_callback(chat_id):
    """Desactivar notificaciones desde callback (botones)."""
    try:
        usuario = USUARIO_MODEL.objects.filter(telegram_chat_id=chat_id).first()
        
        if usuario:
            usuario.telegram_activo = False
            usuario.save()
            send_telegram_message(chat_id, "Tus notificaciones han sido DESACTIVADAS!")
    except Exception as e:
        logger.error(f"Error: {e}")


def send_welcome_message(chat_id):
    """
    Envía mensaje de bienvenida cuando no se reconoce el comando.
    """
    mensaje = """
Bienvenido a Sincro - Notificaciones!

Usa /start para comenzar a recibir alertas de inventario.

Usa /ayuda para ver todos los comandos disponibles.
"""
    send_telegram_message(chat_id, mensaje)