from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import NotaEntrega, NotaEntregaItem, Cliente
from .serializers import (
    NotaEntregaSerializer,
    NotaEntregaCreateSerializer,
    NotaEntregaItemSerializer,
    NotaEntregaItemCreateSerializer,
    ClienteSerializer,
)
from django.utils import timezone


class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet para clientes"""
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    
    def get_queryset(self):
        # Si hay búsqueda, filtrar por nombre o cédula
        queryset = Cliente.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(nombre__icontains=search) |
                models.Q(cedula__icontains=search)
            )
        return queryset


class NotaEntregaViewSet(viewsets.ModelViewSet):
    """ViewSet para notas de entrega"""
    queryset = NotaEntrega.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotaEntregaCreateSerializer
        return NotaEntregaSerializer
    
    def get_queryset(self):
        queryset = NotaEntrega.objects.select_related('cliente').all()
        
        search = self.request.query_params.get('search', None)
        if search:
            # Buscar por número de nota o nombre del cliente
            queryset = queryset.filter(
                models.Q(numero__icontains=search) |
                models.Q(cliente__nombre__icontains=search) |
                models.Q(cliente_nombre__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar una nota de entrega"""
        nota = self.get_object()
        try:
            nota.aprobar()
            nota.fecha_aprobacion = timezone.now()
            nota.save()
            return Response({'mensaje': 'Nota aprobada correctamente'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar una nota de entrega"""
        nota = self.get_object()
        try:
            nota.cancelar()
            return Response({'mensaje': 'Nota cancelada correctamente'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def agregar_item(self, request, pk=None):
        """Agregar un item a una nota"""
        nota = self.get_object()
        
        if nota.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden agregar items a notas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = NotaEntregaItemCreateSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save(nota=nota)
            return Response(
                NotaEntregaItemSerializer(item).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], url_path='items/(?P<item_id>[^/.]+)')
    def eliminar_item(self, request, pk=None, item_id=None):
        """Eliminar un item de una nota"""
        nota = self.get_object()
        
        if nota.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden eliminar items de notas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = nota.items.get(id=item_id)
            item.delete()
            return Response({'mensaje': 'Item eliminado'})
        except NotaEntregaItem.DoesNotExist:
            return Response(
                {'error': 'Item no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='eliminar_item')
    def eliminar_item_post(self, request, pk=None):
        """Eliminar un item usando POST (más compatible)"""
        item_id = request.data.get('item_id')
        if not item_id:
            return Response({'error': 'item_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        nota = self.get_object()
        
        if nota.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden eliminar items de notas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = nota.items.get(id=item_id)
            item.delete()
            return Response({'mensaje': 'Item eliminado'})
        except NotaEntregaItem.DoesNotExist:
            return Response(
                {'error': 'Item no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'], url_path='items/(?P<item_id>[^/.]+)')
    def actualizar_item(self, request, pk=None, item_id=None):
        """Actualizar un item de una nota"""
        nota = self.get_object()
        
        if nota.estado != 'pendiente':
            return Response(
                {'error': 'Solo se pueden modificar items de notas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = nota.items.get(id=item_id)
        except NotaEntregaItem.DoesNotExist:
            return Response(
                {'error': 'Item no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Si se cambia el stock_proveedor, recalcular el precio
        nuevo_sp_id = request.data.get('stock_proveedor')
        if nuevo_sp_id and str(item.stock_proveedor_id) != str(nuevo_sp_id):
            try:
                from inventario.models import StockProveedor
                sp = StockProveedor.objects.get(id=nuevo_sp_id, stock=item.stock)
                cual_costo = request.data.get('cual_costo', item.cual_costo)
                # Recalcular precio
                if cual_costo == 'costo_1':
                    nuevo_precio = sp.costo_1 or 0
                elif cual_costo == 'costo_2':
                    nuevo_precio = sp.costo_2 or 0
                elif cual_costo == 'costo_3':
                    nuevo_precio = sp.costo_3 or 0
                else:
                    nuevo_precio = float(sp.costo) if sp.costo else 0
                request.data['precio_unitario_dolares'] = nuevo_precio
            except StockProveedor.DoesNotExist:
                return Response(
                    {'error': 'Proveedor de stock no encontrado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Actualizar campos permitidos
        serializer = NotaEntregaItemCreateSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(NotaEntregaItemSerializer(item).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def generar_pdf(self, request, pk=None):
        """Genera un PDF de la nota de entrega"""
        import traceback
        from servicios.pdf_service import generar_pdf_nota_entrega_bytes
        
        nota = self.get_object()
        
        try:
            pdf_bytes = generar_pdf_nota_entrega_bytes(nota.id)
            
            from django.http import HttpResponse
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="nota_entrega_{nota.numero}.pdf"'
            return response
        except Exception as e:
            # Log the full error for debugging
            print(f"Error generating PDF: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Error al generar PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generar_excel(self, request, pk=None):
        """Genera un Excel de la nota de entrega"""
        import traceback
        from servicios.excel_service import generar_excel_nota_entrega_bytes
        
        nota = self.get_object()
        
        try:
            excel_bytes = generar_excel_nota_entrega_bytes(nota.id)
            
            from django.http import HttpResponse
            response = HttpResponse(excel_bytes, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="nota_entrega_{nota.numero}.xlsx"'
            return response
        except Exception as e:
            # Log the full error for debugging
            print(f"Error generating Excel: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Error al generar Excel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )