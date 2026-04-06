from django.core.management.base import BaseCommand
from inventario.models import Stock, Proveedor, Departamento
import pandas as pd


class Command(BaseCommand):
    help = "Importa registros desde Excel o CSV sin cargar el campo 'costo'."

    def add_arguments(self, parser):
        parser.add_argument("excel_path", type=str, help="Ruta al archivo Excel o CSV")

    def handle(self, *args, **options):
        file_path = options["excel_path"]
        self.stdout.write(f"Leyendo archivo: {file_path}")

        # Leer archivo Excel o CSV
        if file_path.endswith(".xlsx"):
            df = pd.read_excel(file_path)
        elif file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            self.stderr.write("❌ Formato no soportado (usa .xlsx o .csv)")
            return

        # Normalizar encabezados
        df.columns = df.columns.str.strip().str.lower()

        # Reemplazar NaN por cadenas vacías
        df = df.fillna("")

        # Obtener objetos por defecto
        proveedor_default = Proveedor.objects.get(pk=1)
        departamento_default = Departamento.objects.get(pk=1)

        registros_creados = 0

        for index, row in df.iterrows():
            codigo = str(row.get("codigo", "")).strip() or "No tiene"
            descripcion = str(row.get("descripcion", "")).strip()
            pza = str(row.get("pza", "")).strip()

            # 🔒 Forzamos costo a 0.0 siempre (sin importar si el Excel trae algo)
            costo = 0.0

            # Calcular utilidad_15 (basada en costo = 0)
            utilidad_15 = 0.0
            mts_ml_m2 = 0.0

            Stock.objects.create(
                codigo=codigo,
                descripcion=descripcion,
                pza=pza,
                costo=costo,
                utilidad_15=utilidad_15,
                mts_ml_m2=mts_ml_m2,
                proveedor=proveedor_default,
                departamento=departamento_default,
            )

            registros_creados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Importación completada correctamente:\n"
                f"🆕 {registros_creados} registros creados con costo = 0.0"
            )
        )
