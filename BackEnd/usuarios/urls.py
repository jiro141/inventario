from django.urls import path
from .views import RegistroUsuarioAPIView

urlpatterns = [
    path('registro/', RegistroUsuarioAPIView.as_view(), name='registro_usuario'),
]
