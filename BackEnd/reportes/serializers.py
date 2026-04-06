from rest_framework import serializers
from .models import NotaEntrega, NotaEntregaItem, Cliente


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
    proveedor_nombre = serializers.CharField(source='stock_proveedor.proveedor.name', read_only=True)
    precio_mostrar = serializers.SerializerMethodField()
    # Incluir proveedores del stock para poder editarlos
    stock_proveedores = serializers.SerializerMethodField()
    
    class Meta:
        model = NotaEntregaItem
        fields = [
            'id', 'stock', 'stock_codigo', 'stock_descripcion',
            'stock_proveedor', 'proveedor_nombre', 'stock_proveedores',
            'cantidad', 'cantidad_bloqueada',
            'cual_costo', 'precio_unitario_dolares', 'precio_mostrar',
        ]
        read_only_fields = ['cantidad_bloqueada']
    
    def get_precio_mostrar(self, obj):
        return str(obj.precio_unitario_dolares)
    
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
    
    class Meta:
        model = NotaEntrega
        fields = [
            'id', 'numero', 'fecha_creacion', 'fecha_aprobacion',
            'estado', 'estado_display',
            'cliente', 'cliente_nombre_display',
            'cliente_nombre', 'cliente_cedula',
            'total_dolares',
            'observaciones', 'items',
        ]
        read_only_fields = ['numero', 'fecha_creacion', 'total_dolares']
    
    def get_cliente_nombre_display(self, obj):
        if obj.cliente:
            return obj.cliente.nombre
        return obj.cliente_nombre or "—"


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
            'stock', 'stock_proveedor', 'cantidad', 'cual_costo', 'precio_unitario_dolares'
        ]