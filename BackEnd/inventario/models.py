from django.db import models


# ==========================
# MODELOS BASE
# ==========================


class Departamento(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# ==========================
# PROVEEDOR
# ==========================


class Proveedor(models.Model):
    name = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20)
    encargado = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.name


# ==========================
# PRODUCTOS Y CONFIGURACIONES
# ==========================


class Taza_pesos_dolares(models.Model):
    """Configuración global de la tasa de conversión."""

    valor = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Tasa pesos/dólar actual"
    )
    utilidad_porcentaje_1 = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Primer porcentaje de utilidad global (0 = sin margen, muestra costo base)"
    )
    utilidad_porcentaje_2 = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Segundo porcentaje de utilidad global"
    )
    utilidad_porcentaje_3 = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Tercer porcentaje de utilidad global"
    )

    def __str__(self):
        return f"Tasa: {self.valor}"

    class Meta:
        verbose_name = "Tasa Pesos/Dólares"
        verbose_name_plural = "Tasas Pesos/Dólares"


class Stock(models.Model):
    codigo = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=255)
    pza = models.CharField(max_length=50)
    cantidad = models.IntegerField(default=0, help_text="Cantidad disponible en inventario")
    cantidad_bloqueada = models.IntegerField(default=0, help_text="Cantidad bloqueada por notas de entrega pendientes")

    factor_conversion = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Factor para convertir costo a mts/ml/m2 (ej: 2.5 para m²)",
    )

    item_fijo = models.BooleanField(
        default=False, help_text="Indica si es un ítem fijo del sistema."
    )

    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name="stocks",
    )

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

    def get_preferido(self):
        """Returns the StockProveedor where es_preferido=True, or the one with highest costo if none is preferred."""
        # Primero buscar los marcados como preferido
        preferido = self.proveedores.filter(es_preferido=True).first()
        if preferido:
            return preferido
        # Si ninguno es preferido, devolver el de mayor costo
        return self.proveedores.order_by('-costo').first()


# ==========================
# STOCK PROVEEDOR (Multi-provider pricing)
# ==========================


class StockProveedor(models.Model):
    """
    Junction table between Stock and Proveedor for provider-specific pricing.
    Each Stock item can have N providers with independent costs.
    """
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name='proveedores'
    )
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='stock_items'
    )
    es_preferido = models.BooleanField(default=False)

    # Cost fields (per-provider)
    costo_pesos = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    costo_dolares = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    envio = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, default=0
    )

    # Campos calculados automáticamente
    costo = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Costo transformado (en dólares)"
    )
    mts_ml_m2 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Costo transformado con factor 15%"
    )
    # Costos con porcentaje de utilidad (aplicando factor si existe)
    costo_1 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Costo con %1 (con factor si existe)"
    )
    costo_2 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Costo con %2 (con factor si existe)"
    )
    costo_3 = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Costo con %3 (con factor si existe)"
    )

    class Meta:
        unique_together = [['stock', 'proveedor']]
        verbose_name = "Stock Proveedor"
        verbose_name_plural = "Stocks Proveedores"

    def __str__(self):
        return f"{self.stock.descripcion} - {self.proveedor.name}"

    def save(self, *args, **kwargs):
        """Calcula costos base y con porcentajes de utilidad."""
        from decimal import Decimal, ROUND_HALF_UP

        # Obtener tasa y porcentajes
        taza = Taza_pesos_dolares.objects.order_by("-id").first()
        tasa_valor = taza.valor if taza else Decimal("1.0")
        p1 = Decimal(str(taza.utilidad_porcentaje_1)) if taza else Decimal("0.00")
        p2 = Decimal(str(taza.utilidad_porcentaje_2)) if taza else Decimal("0.00")
        p3 = Decimal(str(taza.utilidad_porcentaje_3)) if taza else Decimal("0.00")

        # Calcular costo base (en dólares)
        costo_pesos = self.costo_pesos or Decimal("0.00")
        envio = self.envio or Decimal("0.00")

        if self.costo_dolares:
            # Si es en dólares: costo_dolares + envio
            costo_base = self.costo_dolares + envio
        elif costo_pesos:
            # Si es en pesos: (costo_pesos + envio) / tasa
            costo_base = (costo_pesos + envio) / tasa_valor
        else:
            costo_base = Decimal("0.00")

        costo_base = costo_base.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Obtener factor de conversión del stock padre
        factor = self.stock.factor_conversion

        if costo_base > 0:
            # Calcular costos con porcentajes de utilidad
            utilidad_p1 = costo_base * (Decimal("1.0") + p1 / Decimal("100"))
            utilidad_p2 = costo_base * (Decimal("1.0") + p2 / Decimal("100"))
            utilidad_p3 = costo_base * (Decimal("1.0") + p3 / Decimal("100"))
            utilidad_15 = costo_base * Decimal("1.15")
        else:
            utilidad_p1 = Decimal("0.00")
            utilidad_p2 = Decimal("0.00")
            utilidad_p3 = Decimal("0.00")
            utilidad_15 = Decimal("0.00")

        # Si hay factor de conversión, transformar todos los costos
        if factor and factor > 0:
            # costo = costo base sin transformar
            self.costo = costo_base
            # mts_ml_m2 = costo base transformado
            self.mts_ml_m2 = (costo_base / factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            # costo_1,2,3 = utilidad calculada sobre costo_base transformado
            self.costo_1 = (utilidad_p1 / factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            self.costo_2 = (utilidad_p2 / factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            self.costo_3 = (utilidad_p3 / factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            # Sin factor: los costos son los valores con porcentaje sin transformar
            self.costo = costo_base
            self.mts_ml_m2 = None
            self.costo_1 = utilidad_p1.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            self.costo_2 = utilidad_p2.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            self.costo_3 = utilidad_p3.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        super().save(*args, **kwargs)


class PrecioHistoria(models.Model):
    """
    Immutable snapshot of StockProveedor pricing at a point in time.
    Created automatically when StockProveedor is saved.
    """
    stock_proveedor = models.ForeignKey(
        StockProveedor,
        on_delete=models.CASCADE,
        related_name='historial_precios'
    )
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    costo_pesos = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    costo_dolares = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    envio = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    fecha = models.DateTimeField(auto_now_add=True)
    movimiento = models.ForeignKey(
        'MovimientoInventario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='precios_historicos'
    )

    class Meta:
        verbose_name = "Historial de Precio"
        verbose_name_plural = "Historiales de Precios"
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.stock_proveedor} - ${self.precio_unitario} - {self.fecha.strftime('%d/%m/%Y')}"


# ==========================
# MOVIMIENTOS DE INVENTARIO
# ==========================


class MovimientoInventario(models.Model):
    TIPO_CHOICES = (
        ("entrada", "Entrada"),
        ("salida", "Salida"),
        ("ajuste", "Ajuste"),
    )

    fecha = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    observacion = models.TextField(blank=True)

    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, null=True, blank=True)
    stock_proveedor = models.ForeignKey(
        StockProveedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos'
    )

    def __str__(self):
        return f"{self.tipo.upper()} - {self.stock} - {self.cantidad}u - {self.fecha.strftime('%d/%m/%Y')}"