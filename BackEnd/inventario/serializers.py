from rest_framework import serializers
from .models import (
    Departamento,
    Stock,
    Proveedor,
    MovimientoInventario,
    Taza_pesos_dolares,
    StockProveedor,
    PrecioHistoria,
)


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = "__all__"


class StockProveedorSerializer(serializers.ModelSerializer):
    """Serializer for StockProveedor - provider-specific pricing."""
    proveedor_nombre = serializers.CharField(source='proveedor.name', read_only=True)
    proveedor_id = serializers.IntegerField(source='proveedor.id', read_only=True)

    class Meta:
        model = StockProveedor
        fields = [
            'id', 'stock', 'proveedor', 'proveedor_nombre', 'proveedor_id',
            'es_preferido',
            'costo_pesos', 'costo_dolares', 'envio',
            'costo', 'mts_ml_m2',
            'costo_1', 'costo_2', 'costo_3',
        ]
        read_only_fields = ['costo', 'mts_ml_m2', 'costo_1', 'costo_2', 'costo_3']


class PrecioHistoriaSerializer(serializers.ModelSerializer):
    """Serializer for PrecioHistoria - immutable price snapshots."""
    proveedor_nombre = serializers.CharField(
        source='stock_proveedor.proveedor.name',
        read_only=True
    )
    stock_descripcion = serializers.CharField(
        source='stock_proveedor.stock.descripcion',
        read_only=True
    )

    class Meta:
        model = PrecioHistoria
        fields = [
            'id', 'stock_proveedor', 'proveedor_nombre', 'stock_descripcion',
            'precio_unitario', 'costo_pesos', 'costo_dolares', 'envio',
            'fecha', 'movimiento'
        ]


class StockSerializer(serializers.ModelSerializer):
    """Serializer for Stock with nested proveedores and computed preferred."""
    proveedores = StockProveedorSerializer(many=True, read_only=True)
    preferido = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = [
            'id', 'codigo', 'descripcion', 'pza', 'cantidad',
            'factor_conversion', 'item_fijo', 'departamento',
            'proveedores', 'preferido'
        ]

    def get_preferido(self, obj):
        """Returns the preferred StockProveedor or None."""
        return StockProveedorSerializer(obj.get_preferido()).data if obj.get_preferido() else None


# 🔹 Serializer para Proveedor (sin EPP ni Consumibles)
class ProveedorSerializer(serializers.ModelSerializer):
    stocks = StockSerializer(many=True, required=False)

    class Meta:
        model = Proveedor
        fields = [
            "id",
            "name",
            "direccion",
            "telefono",
            "encargado",
            "stocks",
        ]

    def create(self, validated_data):
        stocks_data = validated_data.pop("stocks", [])

        # 🔸 Crear el proveedor primero
        proveedor = Proveedor.objects.create(**validated_data)

        # 🔸 Crear Stocks asociados
        for stock in stocks_data:
            Stock.objects.create(proveedor=proveedor, **stock)

        return proveedor

    def update(self, instance, validated_data):
        # Actualizar los campos básicos del proveedor
        instance.name = validated_data.get("name", instance.name)
        instance.direccion = validated_data.get("direccion", instance.direccion)
        instance.telefono = validated_data.get("telefono", instance.telefono)
        instance.encargado = validated_data.get("encargado", instance.encargado)
        instance.save()

        return instance


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    """Serializer for MovimientoInventario with optional stock_proveedor."""
    stock_proveedor = serializers.PrimaryKeyRelatedField(
        queryset=StockProveedor.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    stock_proveedor_detail = StockProveedorSerializer(
        source='stock_proveedor',
        read_only=True
    )

    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'fecha', 'tipo', 'cantidad', 'observacion',
            'stock', 'stock_proveedor', 'stock_proveedor_detail'
        ]
        read_only_fields = ['fecha']


class TazaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taza_pesos_dolares
        fields = "__all__"


class TazaPorcentajesSerializer(serializers.ModelSerializer):
    """Serializer específico para actualizar porcentajes de utilidad global."""
    
    class Meta:
        model = Taza_pesos_dolares
        fields = [
            "id",
            "utilidad_porcentaje_1",
            "utilidad_porcentaje_2",
            "utilidad_porcentaje_3",
        ]
    
    def validate_utilidad_porcentaje_1(self, value):
        """Validar que el porcentaje no sea negativo y esté dentro del rango permitido."""
        if value < 0:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 1 no puede ser negativo."
            )
        if value > 999.99:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 1 no puede ser mayor a 999.99."
            )
        return value
    
    def validate_utilidad_porcentaje_2(self, value):
        """Validar que el porcentaje no sea negativo y esté dentro del rango permitido."""
        if value < 0:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 2 no puede ser negativo."
            )
        if value > 999.99:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 2 no puede ser mayor a 999.99."
            )
        return value
    
    def validate_utilidad_porcentaje_3(self, value):
        """Validar que el porcentaje no sea negativo y esté dentro del rango permitido."""
        if value < 0:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 3 no puede ser negativo."
            )
        if value > 999.99:
            raise serializers.ValidationError(
                "El porcentaje de utilidad 3 no puede ser mayor a 999.99."
            )
        return value
