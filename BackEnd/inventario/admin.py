from django.contrib import admin
from .models import (
    Departamento,
    Stock,
    Proveedor,
    MovimientoInventario,
    Taza_pesos_dolares,
    StockProveedor,
)


# ==========================
# CLASES BÁSICAS
# ==========================


@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


# ==========================
# INLINES (para mostrar stock_proveedores en Stock)
# ==========================


class StockProveedorInline(admin.TabularInline):
    model = StockProveedor
    extra = 0
    fields = ("proveedor", "es_preferido", "costo_pesos", "costo_dolares", "envio", "costo", "mts_ml_m2", "costo_1", "costo_2", "costo_3")
    readonly_fields = ("costo", "mts_ml_m2", "costo_1", "costo_2", "costo_3")
    show_change_link = True


# ==========================
# PRODUCTOS (STOCK)
# ==========================


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "descripcion",
        "pza",
        "cantidad",
        "factor_conversion",
        "departamento",
        "item_fijo",
    )
    list_filter = ("departamento", "item_fijo")
    search_fields = ("codigo", "descripcion")
    list_editable = ("item_fijo",)
    ordering = ("-item_fijo", "descripcion")
    inlines = [StockProveedorInline]


# ==========================
# STOCK PROVEEDOR (para ver en admin si es necesario)
# ==========================


@admin.register(StockProveedor)
class StockProveedorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "stock",
        "proveedor",
        "es_preferido",
        "costo",
        "mts_ml_m2",
        "costo_1",
        "costo_2",
        "costo_3",
    )
    list_filter = ("es_preferido", "proveedor")
    search_fields = ("stock__descripcion", "proveedor__name")
    readonly_fields = ("costo", "mts_ml_m2", "costo_1", "costo_2", "costo_3")


# ==========================
# PROVEEDOR
# ==========================


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("name", "direccion", "telefono", "encargado")
    search_fields = ("name", "direccion", "encargado")


# ==========================
# MOVIMIENTOS DE INVENTARIO
# ==========================


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tipo",
        "cantidad",
        "fecha",
        "stock",
        "observacion",
    )
    list_filter = ("tipo", "fecha")
    search_fields = ("stock__descripcion",)
    readonly_fields = ("fecha",)


# ==========================
# TASA PESOS/DÓLARES
# ==========================


@admin.register(Taza_pesos_dolares)
class TazaAdmin(admin.ModelAdmin):
    list_display = ("id", "valor", "utilidad_porcentaje_1", "utilidad_porcentaje_2", "utilidad_porcentaje_3")
    search_fields = ("valor",)
    list_display_links = ("id", "valor")
    ordering = ("-id",)