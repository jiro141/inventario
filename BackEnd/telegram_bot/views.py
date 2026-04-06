# telegram_bot/views.py
import json
import logging
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils import timezone
from telegram_bot.handlers import handle_telegram_update

logger = logging.getLogger(__name__)

@csrf_exempt
def telegram_webhook(request):
    """
    Webhook para recibir actualizaciones del bot de Telegram.
    """
    if request.method == 'POST':
        try:
            update = json.loads(request.body)
            logger.info(f"Telegram update received: {update.get('update_id', 'unknown')}")
            
            # Procesar la actualización
            handle_telegram_update(update)
            
            return JsonResponse({'ok': True})
        except Exception as e:
            logger.error(f"Error processing telegram update: {e}")
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'ok': False, 'error': 'Method not allowed'}, status=405)