from rest_framework.response import Response
from rest_framework import generics, status
from django.contrib.auth.models import User
from .serializers import RegistroUsuarioSerializer

class RegistroUsuarioAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistroUsuarioSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        return Response(
            {
                "message": "Usuario creado exitosamente.",
                "usuario_id": usuario.id,
                "username": usuario.username
            },
            status=status.HTTP_201_CREATED
        )
