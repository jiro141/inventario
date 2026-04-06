from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotaEntregaViewSet, ClienteViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'notas-entrega', NotaEntregaViewSet, basename='nota-entrega')

urlpatterns = [
    path('', include(router.urls)),
]