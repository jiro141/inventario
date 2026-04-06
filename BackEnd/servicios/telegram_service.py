# servicios/telegram_service.py
import urllib.request
import urllib.error
import json

# Configuración del bot
TELEGRAM_BOT_TOKEN = "8715084597:AAFaSQNDvK7nbkBwd2Q_dVSO8fpPZI03OJY"
# Chat ID correcto obtenido del bot
TELEGRAM_CHAT_ID = "1786367124"


def formato_mensaje_stock_bajo(codigo, descripcion, cantidad, proveedores=None):
    """
    Formatea un mensaje de notificacion para stock bajo.
    """
    # Formatear proveedores si se proporcionan
    prov_str = ""
    if proveedores:
        prov_list = []
        for p in proveedores:
            nombre = p.get('nombre', 'Sin nombre')
            telefono = p.get('telefono', 'Sin telefono')
            prov_list.append(f"  - {nombre}: {telefono}")
        if prov_list:
            prov_str = "\nProveedores:\n" + "\n".join(prov_list)
    
    mensaje = f"""
⚠️ STOCK BAJO

Producto:
- Codigo: {codigo}
- Descripcion: {descripcion}
- Cantidad actual: {cantidad}
{prov_str}

Por favor reponer este producto.
"""
    return mensaje.strip()


def send_telegram_message(mensaje):
    """
    Envía un mensaje a través del bot de Telegram usando urllib.
    """
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    data = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": mensaje
    }).encode('utf-8')
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                print("[OK] Notificacion de Telegram enviada exitosamente")
                return True
            else:
                print(f"[ERROR] Telegram response: {response.status}")
                return False
    except urllib.error.HTTPError as e:
        print(f"[ERROR] HTTP Error: {e.code} - {e.reason}")
        return False
    except Exception as e:
        print(f"[ERROR] Excepcion al enviar Telegram: {str(e)}")
        return False


def notificar_stock_bajo(codigo, descripcion, cantidad, proveedores=None):
    """
    Envía notificación de stock bajo por Telegram.
    Si falla, solo printa el error sin interrumpir.
    """
    try:
        mensaje = formato_mensaje_stock_bajo(codigo, descripcion, cantidad, proveedores)
        return send_telegram_message(mensaje)
    except Exception as e:
        # Silenciar errores de Telegram para no interrumpir el flujo principal
        print(f"[DEBUG] Telegram no disponible: {str(e)}")
        return False


def notificar_multiple_items_bajos(items):
    """
    Envía notificación de múltiples items con stock bajo.
    items: lista de diccionarios con {codigo, descripcion, cantidad}
    """
    if not items:
        return
    
    if len(items) == 1:
        item = items[0]
        mensaje = formato_mensaje_stock_bajo(item['codigo'], item['descripcion'], item['cantidad'])
    else:
        productos = "\n".join([
            f"- {item['codigo']} - {item['descripcion']} (Stock: {item['cantidad']})"
            for item in items
        ])
        mensaje = f"""
⚠️ STOCK BAJO - MULTIPLES ITEMS

Se han detectado {len(items)} productos con stock bajo (5 o menos unidades):

{productos}

Por favor reponer estos productos.
"""
    return send_telegram_message(mensaje.strip())