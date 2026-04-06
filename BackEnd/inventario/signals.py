# inventario/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import MovimientoInventario, StockProveedor, Taza_pesos_dolares, PrecioHistoria, Stock


# Umbral de stock bajo
STOCK_BAJO_UMBRAL = 5

# Variable para evitar notificaciones duplicadas en la misma sesión
_stock_bajo_notificado = set()


def verificar_y_notificar_stock_bajo(stock):
    """
    Verifica si el stock está bajo el umbral y envía notificación por Telegram.
    Solo notifica una vez por cada item en la misma sesión/server restart.
    """
    from servicios.telegram_service import notificar_stock_bajo
    
    if not stock:
        return
    
    # Skip si ya notificado recientemente
    if stock.id in _stock_bajo_notificado:
        return
    
    # Verificar si el stock está bajo el umbral
    if stock.cantidad <= STOCK_BAJO_UMBRAL:
        # Marcar como notificado para evitar duplicados
        _stock_bajo_notificado.add(stock.id)
        
        # Obtener proveedores del stock
        proveedores_data = []
        for sp in stock.proveedores.all():
            prov = sp.proveedor
            proveedores_data.append({
                'nombre': prov.name,
                'telefono': prov.telefono or 'Sin telefono'
            })
        
        # Enviar notificación (si falla, no interrumpe el flujo)
        try:
            notificar_stock_bajo(
                codigo=stock.codigo,
                descripcion=stock.descripcion,
                cantidad=stock.cantidad,
                proveedores=proveedores_data
            )
        except Exception as e:
            print(f"[DEBUG] Error notificacion stock bajo: {e}")


@receiver(post_save, sender=Stock)
def recalcular_proveedores_por_stock(sender, instance, created, **kwargs):
    """
    Cuando se guarda el Stock, recalcular todos los StockProveedor relacionados.
    Esto asegura que cuando cambia el factor_conversion, se actualicen los mts_ml_m2.
    """
    # Recalcular todos los proveedores de este stock
    for sp in instance.proveedores.all():
        sp.save()  # Esto dispara el save() de StockProveedor que recalcula mts_ml_m2


@receiver(post_save, sender=MovimientoInventario)
def actualizar_stock_por_movimiento(sender, instance, created, **kwargs):
    """
    Cada vez que se crea un MovimientoInventario, actualiza automáticamente
    la cantidad del Stock asociado.
    
    - entrada: suma la cantidad al stock
    - salida: resta la cantidad del stock
    - ajuste: suma (puede ser positivo o negativo)
    
    También verifica si el stock quedó bajo el umbral para notificar.
    """
    if not created:
        return
    
    stock = instance.stock
    if not stock:
        return
    
    cantidad = instance.cantidad
    tipo = instance.tipo
    
    if tipo == "entrada":
        stock.cantidad += cantidad
    elif tipo == "salida":
        stock.cantidad -= cantidad
    elif tipo == "ajuste":
        stock.cantidad += cantidad  # positivo suma, negativo resta
    
    # No permitir cantidad negativa
    if stock.cantidad < 0:
        stock.cantidad = 0
    
    stock.save(update_fields=["cantidad"])
    
    # Verificar stock bajo después de actualizar
    verificar_y_notificar_stock_bajo(stock)


@receiver(post_save, sender=Taza_pesos_dolares)
def recalcular_todos_precios(sender, instance, **kwargs):
    """
    When Taza_pesos_dolares changes, recalculate ALL StockProveedor records.
    Uses transaction.on_commit to defer execution after DB commit.
    """
    def _recalcular():
        proveedores = StockProveedor.objects.select_related('stock').all()
        for sp in proveedores:
            sp.save()  # Triggers PrecioHistoria via post_save below

    transaction.on_commit(_recalcular)


@receiver(post_save, sender=StockProveedor)
def crear_historial_precio(sender, instance, created, **kwargs):
    """
    When StockProveedor is saved, insert a snapshot into PrecioHistoria.
    This creates an immutable record of the price at this point in time.
    """
    PrecioHistoria.objects.create(
        stock_proveedor=instance,
        precio_unitario=instance.costo,
        costo_pesos=instance.costo_pesos,
        costo_dolares=instance.costo_dolares,
        envio=instance.envio,
    )
