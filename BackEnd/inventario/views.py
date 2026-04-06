from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Departamento,
    Stock,
    Proveedor,
    MovimientoInventario,
    Taza_pesos_dolares,
    StockProveedor,
    PrecioHistoria,
)
from .serializers import (
    DepartamentoSerializer,
    StockSerializer,
    ProveedorSerializer,
    MovimientoInventarioSerializer,
    TazaSerializer,
    TazaPorcentajesSerializer,
    StockProveedorSerializer,
    PrecioHistoriaSerializer,
)


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all().order_by("id")
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    # 🔍 Habilitar búsqueda dinámica en el endpoint
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class StockViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los ítems de inventario (Stock).
    Los ítems fijos (`item_fijo=True`) siempre se muestran primero.
    """

    queryset = Stock.objects.all().prefetch_related('proveedores__proveedor').order_by("-item_fijo", "descripcion")
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["codigo", "descripcion"]


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by("id")
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]
    # 🔍 Agregamos soporte para búsqueda dinámica
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "encargado"]  # campos donde buscar


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all().order_by("id").order_by("-fecha")
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAuthenticated]


class TazaViewSet(viewsets.ViewSet):
    """
    Maneja GET y POST sobre una única tasa global (solo un registro).
    """

    def list(self, request):
        tasa = Taza_pesos_dolares.objects.order_by("-id").first()
        if not tasa:
            return Response(
                {"detail": "No existe tasa registrada."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = TazaSerializer(tasa)
        return Response(serializer.data)

    def create(self, request):
        tasa = Taza_pesos_dolares.objects.order_by("-id").first()
        if tasa:
            serializer = TazaSerializer(tasa, data=request.data, partial=True)
        else:
            serializer = TazaSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="porcentajes")
    def porcentajes(self, request, pk=None):
        """
        PATCH endpoint para actualizar porcentajes de utilidad global.
        
        Permite actualizar 1, 2 o los 3 porcentajes a la vez.
        Al guardar, se dispara la señal post_save que recalcula
        todos los stocks automáticamente.
        """
        try:
            taza = Taza_pesos_dolares.objects.get(pk=pk)
        except Taza_pesos_dolares.DoesNotExist:
            return Response(
                {"detail": "No se encontró la tasa especificada."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TazaPorcentajesSerializer(taza, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class StockProveedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar StockProveedor - precios por proveedor.
    CRUD operations for provider-specific costs per stock item.
    """
    queryset = StockProveedor.objects.select_related('stock', 'proveedor').all()
    serializer_class = StockProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['proveedor__name', 'stock__descripcion']

    def get_queryset(self):
        """Filter by stock or proveedor query params."""
        queryset = super().get_queryset()
        stock_id = self.request.query_params.get('stock')
        proveedor_id = self.request.query_params.get('proveedor')
        if stock_id:
            queryset = queryset.filter(stock_id=stock_id)
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
        return queryset

    @action(detail=True, methods=["get"], url_path="historial")
    def historial(self, request, pk=None):
        """Get price history for a specific StockProveedor."""
        stock_proveedor = self.get_object()
        historial = stock_proveedor.historial_precios.all().order_by('-fecha')
        serializer = PrecioHistoriaSerializer(historial, many=True)
        return Response(serializer.data)


class PrecioHistoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para acceder al historial de precios (solo lectura).
    """
    queryset = PrecioHistoria.objects.select_related(
        'stock_proveedor__stock',
        'stock_proveedor__proveedor',
        'movimiento'
    ).all()
    serializer_class = PrecioHistoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['stock_proveedor__stock__descripcion', 'stock_proveedor__proveedor__name']

    def get_queryset(self):
        """Filter by stock_proveedor query param."""
        queryset = super().get_queryset()
        stock_proveedor_id = self.request.query_params.get('stock_proveedor')
        if stock_proveedor_id:
            queryset = queryset.filter(stock_proveedor_id=stock_proveedor_id)
        return queryset
