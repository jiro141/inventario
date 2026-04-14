from django.db import models
from inventario.models import Stock, Proveedor, StockProveedor


class Cliente(models.Model):
    """
    Cliente para notas de entrega
    """
    nombre = models.CharField(max_length=255, help_text="Nombre del cliente")
    cedula = models.CharField(max_length=20, unique=True, help_text="Cédula o RIF del cliente")
    telefono = models.CharField(max_length=20, blank=True, null=True, help_text="Teléfono del cliente")
    email = models.EmailField(blank=True, null=True, help_text="Email del cliente")
    direccion = models.TextField(blank=True, null=True, help_text="Dirección del cliente")
    observaciones = models.TextField(blank=True, null=True, help_text="Observaciones adicionales")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True, help_text="Si el cliente está activo")

    class Meta:
        ordering = ['nombre']
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return f"{self.nombre} ({self.cedula})"


class NotaEntrega(models.Model):
    """
    Nota de entrega - documento para entregar materiales del inventario.
    Estados:
    - pendiente: nota creada, items bloqueados pero no descontados
    - aprobada: items descontados del inventario
    - cancelada: nota cancelada, items liberados
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('cancelada', 'Cancelada'),
    ]

    numero = models.CharField(max_length=50, unique=True, help_text="Número de nota de entrega")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    # Cliente/Destinatario (relación con el modelo Cliente)
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='notas_entrega'
    )
    # Cliente/Destinatario (opcional - para cuando no hay cliente registrado)
    cliente_nombre = models.CharField(max_length=255, blank=True, null=True)
    cliente_cedula = models.CharField(max_length=20, blank=True, null=True)
    
    # Totales
    total_dolares = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pesos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = "Nota de Entrega"
        verbose_name_plural = "Notas de Entrega"

    def __str__(self):
        return f"Nota #{self.numero} - {self.fecha_creacion.strftime('%d/%m/%Y')}"

    def aprobar(self):
        """Aprobar la nota y descontar del inventario"""
        if self.estado != 'pendiente':
            raise ValueError("Solo se pueden aprobar notas pendientes")
        
        for item in self.items.all():
            item.descontar_stock()
        
        self.estado = 'aprobada'
        self.save()

    def cancelar(self):
        """Cancelar la nota y liberar los items bloqueados"""
        if self.estado != 'pendiente':
            raise ValueError("Solo se pueden cancelar notas pendientes")
        
        for item in self.items.all():
            item.liberar_bloqueo()
        
        self.estado = 'cancelada'
        self.save()

    def calcular_totales(self):
        """Recalcular los totales de la nota"""
        total_dolares = 0
        
        for item in self.items.all():
            precio_dolar = item.get_precio()
            total_dolares += precio_dolar * item.cantidad
        
        self.total_dolares = total_dolares
        self.save()


class NotaEntregaItem(models.Model):
    """
    Item individual dentro de una nota de entrega
    """
    
    @staticmethod
    def get_costo_choices():
        """Obtiene los choices dinámicos basados en los porcentajes de utilidad de la Taza"""
        from inventario.models import Taza_pesos_dolares
        taza = Taza_pesos_dolares.objects.order_by('-id').first()
        
        choices = [('costo', 'Costo Base')]
        
        if taza:
            p1 = float(taza.utilidad_porcentaje_1) if taza.utilidad_porcentaje_1 else 0
            p2 = float(taza.utilidad_porcentaje_2) if taza.utilidad_porcentaje_2 else 0
            p3 = float(taza.utilidad_porcentaje_3) if taza.utilidad_porcentaje_3 else 0
            
            if p1 > 0:
                choices.append(('costo_1', f'Costo 1 ({p1:.0f}%)'))
            if p2 > 0:
                choices.append(('costo_2', f'Costo 2 ({p2:.0f}%)'))
            if p3 > 0:
                choices.append(('costo_3', f'Costo 3 ({p3:.0f}%)'))
        
        if len(choices) == 1:
            choices.append(('costo_1', 'Costo 1'))
            choices.append(('costo_2', 'Costo 2'))
            choices.append(('costo_3', 'Costo 3'))
        
        return choices

    nota = models.ForeignKey(
        NotaEntrega,
        on_delete=models.CASCADE,
        related_name='items'
    )
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name='notas_entrega'
    )
    stock_proveedor = models.ForeignKey(
        StockProveedor,
        on_delete=models.PROTECT,
        related_name='notas_entrega'
    )
    
    cantidad = models.IntegerField(help_text="Cantidad a entregar")
    cantidad_bloqueada = models.IntegerField(default=0, help_text="Cantidad bloqueada en inventario")
    
    TIPO_VENTA_CHOICES = [
        ('cantidad', 'Por Cantidad'),
        ('mts_ml_m2', 'Por MTS/ML/M²'),
    ]
    
    tipo_venta = models.CharField(
        max_length=20,
        choices=TIPO_VENTA_CHOICES,
        default='cantidad',
        help_text="Cómo se vende: por cantidad o por MTS/ML/M²"
    )
    
    cual_costo = models.CharField(
        max_length=20,
        default='costo',
        help_text="Cuál precio usar para el cálculo"
    )
    
    precio_unitario_dolares = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Precio unitario en dólares basado en cual_costo"
    )
    
    relacion_mts_ml_m2 = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        default=1,
        help_text="Relación MTS/ML/M² del stock"
    )
    
    class Meta:
        verbose_name = "Item de Nota de Entrega"
        verbose_name_plural = "Items de Notas de Entrega"

    def __str__(self):
        return f"{self.stock.codigo} - {self.cantidad} unidades"

    def get_precio_base(self):
        """Obtener el precio base según cual_costo (sin importar tipo_venta)"""
        sp = self.stock_proveedor
        if self.cual_costo == 'costo':
            return float(sp.costo or 0)
        elif self.cual_costo == 'costo_1':
            return float(sp.costo_1 or 0)
        elif self.cual_costo == 'costo_2':
            return float(sp.costo_2 or 0)
        elif self.cual_costo == 'costo_3':
            return float(sp.costo_3 or 0)
        return 0
    
    def get_precio(self):
        """
        Obtener el precio según tipo_venta y cual_costo.
        Si tipo_venta es 'mts_ml_m2', el precio se divide entre la relación.
        """
        precio_base = self.get_precio_base()
        if self.tipo_venta == 'mts_ml_m2' and self.relacion_mts_ml_m2 and self.relacion_mts_ml_m2 > 0:
            return precio_base / float(self.relacion_mts_ml_m2)
        return precio_base
    
    def get_cantidad_mostrar(self):
        """
        Obtener la cantidad a mostrar según tipo_venta.
        Si tipo_venta es 'mts_ml_m2', retorna cantidad * relacion.
        """
        if self.tipo_venta == 'mts_ml_m2' and self.relacion_mts_ml_m2 and self.relacion_mts_ml_m2 > 0:
            return float(self.cantidad) * float(self.relacion_mts_ml_m2)
        return self.cantidad
    
    def get_unidad_mostrar(self):
        """Obtener la unidad a mostrar según tipo_venta"""
        if self.tipo_venta == 'mts_ml_m2':
            if self.stock.pza:
                return self.stock.pza
            return "MTS"
        return "UND"
    
    @property
    def total_linea(self):
        """
        Calcula el total de esta línea.
        El total es el mismo sin importar el tipo de venta.
        """
        return float(self.cantidad) * self.get_precio_base()

    def save(self, *args, **kwargs):
        # Obtener la relación MTS/ML/M² del stock
        if self.stock and self.stock.factor_conversion:
            self.relacion_mts_ml_m2 = self.stock.factor_conversion
        elif not self.relacion_mts_ml_m2 or self.relacion_mts_ml_m2 == 0:
            self.relacion_mts_ml_m2 = 1
        
        # Si es nuevo y la nota está pendiente, bloquear cantidad
        if not self.pk and self.nota.estado == 'pendiente':
            self.cantidad_bloqueada = self.cantidad
            self.bloquear_stock()
        
        super().save(*args, **kwargs)
        
        # Recalcular totales de la nota
        self.nota.calcular_totales()

    def bloquear_stock(self):
        """Bloquear la cantidad en el stock (no descontar, solo bloquear)"""
        self.stock.cantidad_bloqueada = (getattr(self.stock, 'cantidad_bloqueada', 0) or 0) + self.cantidad
        self.stock.save(update_fields=['cantidad_bloqueada'])

    def liberar_bloqueo(self):
        """Liberar el bloqueo de cantidad"""
        bloqueo_actual = getattr(self.stock, 'cantidad_bloqueada', 0) or 0
        if bloqueo_actual >= self.cantidad:
            self.stock.cantidad_bloqueada = bloqueo_actual - self.cantidad
            self.stock.save(update_fields=['cantidad_bloqueada'])

    def descontar_stock(self):
        """Descontar la cantidad del stock al aprobar la nota"""
        # Primero liberar el bloqueo
        self.liberar_bloqueo()
        # Luego descontar de la cantidad disponible
        if self.stock.cantidad >= self.cantidad:
            self.stock.cantidad -= self.cantidad
            self.stock.save(update_fields=['cantidad'])
        
        # Verificar stock bajo después de descontar (si falla, no interrumpe)
        from servicios.telegram_service import notificar_stock_bajo
        try:
            if self.stock.cantidad <= 5:
                # Obtener proveedores del stock
                proveedores_data = []
                for sp in self.stock.proveedores.all():
                    prov = sp.proveedor
                    proveedores_data.append({
                        'nombre': prov.name,
                        'telefono': prov.telefono or 'Sin telefono'
                    })
                notificar_stock_bajo(
                    codigo=self.stock.codigo,
                    descripcion=self.stock.descripcion,
                    cantidad=self.stock.cantidad,
                    proveedores=proveedores_data
                )
        except Exception as e:
            print(f"[DEBUG] Error notificacion stock bajo: {e}")