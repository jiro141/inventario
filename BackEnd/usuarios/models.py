from django.db import models
from django.contrib.auth.hashers import make_password

class Usuario(models.Model):
    username = models.CharField(max_length=50, unique=True)
    correo = models.EmailField(unique=True)
    contraseña = models.CharField(max_length=128)
    # Chat ID de Telegram vinculado al usuario
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    telegram_username = models.CharField(max_length=100, blank=True, null=True)
    telegram_activo = models.BooleanField(default=False, help_text="Si el usuario quiere recibir notificaciones por Telegram")
    fecha_vinculacion = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # Si la contraseña no está hasheada aún, la encripta
        if not self.pk or 'pbkdf2_' not in self.contraseña:
            self.contraseña = make_password(self.contraseña)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
