"""
Servicio para generar PDF de Nota de Entrega usando xhtml2pdf
"""
from xhtml2pdf import pisa
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from django.http import HttpResponse
import os


def generar_pdf_nota_entrega(nota_id):
    """
    Genera un PDF de la nota de entrega y lo guarda en media/notas_entrega/
    
    Args:
        nota_id: ID de la NotaEntrega
        
    Returns:
        str: Ruta del archivo PDF generado
    """
    from reportes.models import NotaEntrega
    
    nota = NotaEntrega.objects.select_related('cliente').prefetch_related('items', 'items__stock', 'items__stock_proveedor', 'items__stock_proveedor__proveedor').get(id=nota_id)
    
    # Calcular totales
    items = nota.items.all()
    subtotal = sum(float(item.precio_unitario_dolares or 0) * item.cantidad for item in items)
    
    # Datos para la plantilla
    context = {
        'nota': nota,
        'items': items,
        'subtotal': subtotal,
        'fecha_generacion': timezone.now().strftime('%d/%m/%Y %H:%M'),
        'empresa_nombre': 'SINCRO',
        'empresa_direccion': 'Venezuela',
    }
    
    # Renderizar plantilla HTML
    html_string = render_to_string('reportes/nota_entrega.html', context)
    
    # Guardar en media/notas_entrega/
    media_root = settings.MEDIA_ROOT
    notas_dir = os.path.join(media_root, 'notas_entrega')
    os.makedirs(notas_dir, exist_ok=True)
    
    filename = f'nota_entrega_{nota.numero}.pdf'
    filepath = os.path.join(notas_dir, filename)
    
    # Convertir a PDF usando xhtml2pdf
    with open(filepath, "wb") as output_file:
        pisaStatus = pisa.CreatePDF(
            html_string,                # the HTML to convert
            dest=output_file            # file handle to receive the PDF
        )
    
    return filepath


def generar_pdf_nota_entrega_bytes(nota_id):
    """
    Genera un PDF de la nota de entrega y lo devuelve como bytes
    
    Args:
        nota_id: ID de la NotaEntrega
        
    Returns:
        bytes: Contenido del PDF
    """
    from reportes.models import NotaEntrega
    
    nota = NotaEntrega.objects.select_related('cliente').prefetch_related('items', 'items__stock', 'items__stock_proveedor', 'items__stock_proveedor__proveedor').get(id=nota_id)
    
    # Calcular totales
    items = nota.items.all()
    subtotal = sum(float(item.precio_unitario_dolares or 0) * item.cantidad for item in items)
    
    # Datos para la plantilla
    context = {
        'nota': nota,
        'items': items,
        'subtotal': subtotal,
        'fecha_generacion': timezone.now().strftime('%d/%m/%Y %H:%M'),
        'empresa_nombre': 'SINCRO',
        'empresa_direccion': 'Venezuela',
    }
    
    # Renderizar plantilla HTML
    html_string = render_to_string('reportes/nota_entrega.html', context)
    
    # Crear respuesta HTTP con contenido PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="nota_entrega_{nota.numero}.pdf"'
    
    # Convertir a PDF usando xhtml2pdf
    pisaStatus = pisa.CreatePDF(
        html_string,
        dest=response
    )
    
    # Devolver el contenido como bytes
    return response.content
