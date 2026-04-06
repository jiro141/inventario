from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    DepartamentoViewSet,
    StockViewSet,
    ProveedorViewSet,
    MovimientoInventarioViewSet,
    TazaViewSet,
    StockProveedorViewSet,
    PrecioHistoriaViewSet,
)

router = DefaultRouter()
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'stock', StockViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet)
router.register(r"taza", TazaViewSet, basename="taza")
router.register(r'stock-proveedores', StockProveedorViewSet, basename='stock-proveedor')
router.register(r'precio-historia', PrecioHistoriaViewSet, basename='precio-historia')

urlpatterns = [
    path('', include(router.urls)),
]
