"""
Data migration: Migrate existing Stock.proveedor costs to StockProveedor.

This migration creates StockProveedor records for each Stock that has a
proveedor assigned, copying the cost data and setting es_preferido=True.
"""
from decimal import Decimal
from django.db import migrations


def migrate_stock_to_stockproveedor(apps, schema_editor):
    """
    For each Stock with a proveedor, create a StockProveedor record.
    """
    Stock = apps.get_model('inventario', 'Stock')
    StockProveedor = apps.get_model('inventario', 'StockProveedor')

    # Get all Stock records that have a proveedor
    stocks_with_proveedor = Stock.objects.filter(proveedor__isnull=False)

    created_count = 0
    for stock in stocks_with_proveedor:
        # Skip if already migrated (StockProveedor exists)
        if StockProveedor.objects.filter(stock=stock, proveedor=stock.proveedor).exists():
            continue

        # Create StockProveedor with the existing cost data
        stock_proveedor = StockProveedor(
            stock=stock,
            proveedor=stock.proveedor,
            es_preferido=True,
            costo_pesos=stock.costo_pesos,
            costo_dolares=stock.costo_dolares,
            envio=stock.envio,
            costo=stock.costo,
            utilidad_15=stock.utilidad_15,
            mts_ml_m2=stock.mts_ml_m2,
            mts_ml_m2_1=stock.mts_ml_m2_1,
            mts_ml_m2_2=stock.mts_ml_m2_2,
            mts_ml_m2_3=stock.mts_ml_m2_3,
        )
        stock_proveedor.save()  # Triggers signal to create PrecioHistoria
        created_count += 1

    print(f"Migrated {created_count} Stock records to StockProveedor")


def reverse_migration(apps, schema_editor):
    """Reverse: Nothing to do - Stock costs are preserved on Stock model."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0015_multi_provider_stock'),
    ]

    operations = [
        migrations.RunPython(
            migrate_stock_to_stockproveedor,
            reverse_migration,
            atomic=True,
        ),
    ]
