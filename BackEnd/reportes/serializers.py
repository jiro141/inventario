from rest_framework import serializers
from .models import NotaEntrega, NotaEntregaItem, Cliente


class UtilidadPorcentajesSerializer(serializers.Serializer):
    """Serializer para obtener los porcentajes de utilidad configurados"""
    utilidad_porcentaje_1 = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    utilidad_porcentaje_2 = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    utilidad_porcentaje_3 = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    @staticmethod
    def get_choices():
        """Obtiene las opciones de costo con los porcentajes reales"""
        from inventario.models import Taza_pesos_dolares
        taza = Taza_pesos_dolares.objects.order_by('-id').first()
        
        choices = [{'value': 'costo', 'label': 'Costo Base'}]
        
        if taza:
            p1 = float(taza.utilidad_porcentaje_1) if taza.utilidad_porcentaje_1 else 0
            p2 = float(taza.utilidad_porcentaje_2) if taza.utilidad_porcentaje_2 else 0
            p3 = float(taza.utilidad_porcentaje_3) if taza.utilidad_porcentaje_3 else 0
            
            if p1 > 0:
                choices.append({'value': 'costo_1', 'label': f'Costo 1 ({p1:.0f}%)'})
            if p2 > 0:
                choices.append({'value': 'costo_2', 'label': f'Costo 2 ({p2:.0f}%)'})
            if p3 > 0:
                choices.append({'value': 'costo_3', 'label': f'Costo 3 ({p3:.0f}%)'})
        
        if len(choices) == 1:
            choices.append({'value': 'costo_1', 'label': 'Costo 1'})
            choices.append({'value': 'costo_2', 'label': 'Costo 2'})
            choices.append({'value': 'costo_3', 'label': 'Costo 3'})
        
        return choices


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para los clientes"""
    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'cedula', 'telefono', 'email',
            'direccion', 'observaciones', 'fecha_creacion', 'activo'
        ]
        read_only_fields = ['fecha_creacion']


class NotaEntregaItemSerializer(serializers.ModelSerializer):
    """Serializer para los items de la nota de entrega"""
    stock_codigo = serializers.CharField(source='stock.codigo', read_only=True)
    stock_descripcion = serializers.CharField(source='stock.descripcion', read_only=True)
    stock_pza = serializers.CharField(source='stock.pza', read_only=True)
    stock_factor_conversion = serializers.DecimalField(source='stock.factor_conversion', max_digits=10, decimal_places=4, read_only=True)
    proveedor_nombre = serializers.CharField(source='stock_proveedor.proveedor.name', read_only=True)
    precio_mostrar = serializers.SerializerMethodField()
    cantidad_mostrar = serializers.SerializerMethodField()
    unidad_mostrar = serializers.SerializerMethodField()
    precio_unitario_base = serializers.SerializerMethodField()
    total_linea = serializers.SerializerMethodField()
    stock_proveedores = serializers.SerializerMethodField()
    TIPO_VENTA_CHOICES = [
        {'value': 'cantidad', 'label': 'Por Cantidad'},
        {'value': 'mts_ml_m2', 'label': 'Por MTS/ML/M²'},
    ]
    
    class Meta:
        model = NotaEntregaItem
        fields = [
            'id', 'stock', 'stock_codigo', 'stock_descripcion', 'stock_pza',
            'stock_factor_conversion', 'stock_proveedor', 'proveedor_nombre', 'stock_proveedores',
            'cantidad', 'cantidad_bloqueada',
            'tipo_venta', 'TIPO_VENTA_CHOICES',
            'cual_costo', 'precio_unitario_dolares', 'precio_unitario_base', 'precio_mostrar',
            'relacion_mts_ml_m2', 'cantidad_mostrar', 'unidad_mostrar', 'total_linea',
        ]
        read_only_fields = ['cantidad_bloqueada', 'relacion_mts_ml_m2']
    
    def get_precio_unitario_base(self, obj):
        """Precio base sin dividir por relación"""
        return str(obj.get_precio_base())
    
    def get_precio_mostrar(self, obj):
        """Precio a mostrar según tipo_venta"""
        return str(round(obj.get_precio(), 4))
    
    def get_cantidad_mostrar(self, obj):
        """Cantidad a mostrar según tipo_venta"""
        return str(obj.get_cantidad_mostrar())
    
    def get_unidad_mostrar(self, obj):
        """Unidad a mostrar según tipo_venta"""
        return obj.get_unidad_mostrar()
    
    def get_total_linea(self, obj):
        """Total de la línea"""
        return str(round(obj.total_linea, 2))
    
    def get_stock_proveedores(self, obj):
        """Devolver la lista de proveedores del stock"""
        from inventario.serializers import StockProveedorSerializer
        proveedores = obj.stock.proveedores.all()
        return StockProveedorSerializer(proveedores, many=True).data


class NotaEntregaSerializer(serializers.ModelSerializer):
    """Serializer para la nota de entrega"""
    items = NotaEntregaItemSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cliente_nombre_display = serializers.SerializerMethodField()
    costo_choices = serializers.SerializerMethodField()
    utilidad_porcentajes = serializers.SerializerMethodField()
    
    class Meta:
        model = NotaEntrega
        fields = [
            'id', 'numero', 'fecha_creacion', 'fecha_aprobacion',
            'estado', 'estado_display',
            'cliente', 'cliente_nombre_display',
            'cliente_nombre', 'cliente_cedula',
            'total_dolares',
            'observaciones', 'items',
            'costo_choices', 'utilidad_porcentajes',
        ]
        read_only_fields = ['numero', 'fecha_creacion', 'total_dolares']
    
    def get_cliente_nombre_display(self, obj):
        if obj.cliente:
            return obj.cliente.nombre
        return obj.cliente_nombre or "—"
    
    def get_costo_choices(self, obj):
        return UtilidadPorcentajesSerializer.get_choices()
    
    def get_utilidad_porcentajes(self, obj):
        from inventario.models import Taza_pesos_dolares
        taza = Taza_pesos_dolares.objects.order_by('-id').first()
        if taza:
            return {
                'utilidad_porcentaje_1': float(taza.utilidad_porcentaje_1) if taza.utilidad_porcentaje_1 else 0,
                'utilidad_porcentaje_2': float(taza.utilidad_porcentaje_2) if taza.utilidad_porcentaje_2 else 0,
                'utilidad_porcentaje_3': float(taza.utilidad_porcentaje_3) if taza.utilidad_porcentaje_3 else 0,
            }
        return {'utilidad_porcentaje_1': 0, 'utilidad_porcentaje_2': 0, 'utilidad_porcentaje_3': 0}


class NotaEntregaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear notas de entrega"""
    items = NotaEntregaItemSerializer(many=True)
    cliente_nombre_display = serializers.SerializerMethodField()
    
    class Meta:
        model = NotaEntrega
        fields = [
            'id', 'numero', 'cliente', 'cliente_nombre_display',
            'cliente_nombre', 'cliente_cedula', 'observaciones', 'items'
        ]
        read_only_fields = ['id', 'numero']
    
    def get_cliente_nombre_display(self, obj):
        if obj.cliente:
            return obj.cliente.nombre
        return obj.cliente_nombre or "—"
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Generar número de nota automáticamente
        ultimo = NotaEntrega.objects.order_by('-id').first()
        siguiente_numero = (ultimo.id + 1) if ultimo else 1
        numero = f"NE-{siguiente_numero:05d}"
        
        nota = NotaEntrega.objects.create(numero=numero, **validated_data)
        
        # Crear los items
        for item_data in items_data:
            NotaEntregaItem.objects.create(nota=nota, **item_data)
        
        # Recargar para obtener los items completos
        nota.refresh_from_db()
        return nota


class NotaEntregaItemCreateSerializer(serializers.ModelSerializer):
    """Serializer para agregar items a una nota"""
    
    class Meta:
        model = NotaEntregaItem
        fields = [
            'stock', 'stock_proveedor', 'cantidad', 'cual_costo', 'tipo_venta'
        ]