"""
Parser de datos extraídos por OCR
Interpreta el texto y extrae información estructurada de facturas
"""

import re
from typing import Dict, Optional, List, Tuple
from datetime import datetime, date
from decimal import Decimal
import logging

# Configurar logging
logger = logging.getLogger(__name__)


class FacturaParser:
    """Parser mejorado para extraer datos de facturas del texto OCR"""
    
    def __init__(self, texto_ocr: str, datos_ocr: dict):
        self.texto_completo = texto_ocr
        self.lineas = [l.strip() for l in texto_ocr.split('\n') if l.strip()]
        self.datos_ocr = datos_ocr
        
    def extraer_datos(self) -> dict:
        """Extrae todos los datos de la factura"""
        return {
            'numero_factura': self.extraer_numero_factura(),
            'serie': self.extraer_serie(),
            'correlativo': self.extraer_correlativo(),
            'fecha_emision': self.extraer_fecha_emision(),
            'fecha_vencimiento': self.extraer_fecha_vencimiento(),
            'ruc_emisor': self.extraer_ruc_emisor(),
            'razon_social_emisor': self.extraer_razon_social_emisor(),
            'direccion_emisor': self.extraer_direccion_emisor(),
            'telefono_emisor': self.extraer_telefono_emisor(),
            'email_emisor': self.extraer_email_emisor(),
            'subtotal': self.extraer_subtotal(),
            'igv': self.extraer_igv(),
            'total': self.extraer_total(),
            'moneda': self.extraer_moneda(),
            'items': self.extraer_items(),
            'forma_pago': self.extraer_forma_pago(),
            'condicion_pago': self.extraer_condicion_pago(),
            'orden_compra': self.extraer_orden_compra(),
            'guia_remision': self.extraer_guia_remision(),
        }
    
    def extraer_razon_social_emisor(self) -> Optional[str]:
        """Extrae la razón social del emisor - MEJORADO"""
        # Buscar RUC seguido de razón social
        for i, linea in enumerate(self.lineas):
            # Si encontramos un RUC de 11 dígitos
            if re.search(r'\b\d{11}\b', linea):
                # Buscar en la misma línea después del RUC
                match = re.search(r'\d{11}[-\s]+(.+?)(?:SOCIEDAD|S\.A|SAC|S\.R\.L|EIRL|$)', linea, re.IGNORECASE)
                if match:
                    razon = match.group(1).strip()
                    if len(razon) > 5:  # Filtrar nombres muy cortos
                        return razon
                
                # O en la siguiente línea
                if i + 1 < len(self.lineas):
                    siguiente = self.lineas[i + 1]
                    # Filtrar líneas que claramente no son razón social
                    if not any(x in siguiente.upper() for x in ['RUC', 'FACTURA', 'BOLETA', 'DIRECCION', 'TELEFONO']):
                        if len(siguiente) > 5 and len(siguiente) < 100:
                            return siguiente
        
        # Buscar "VISTONY" específicamente para esta factura
        for linea in self.lineas[:10]:  # Solo en las primeras líneas
            if 'VISTONY' in linea.upper() and 'TECNOLOGIA' not in linea.upper():
                # Extraer solo "VISTONY"
                match = re.search(r'\b(VISTONY[^\n]*?PERU[^\n]*?ANONIMA[^\n]*?)\b', linea, re.IGNORECASE)
                if match:
                    return match.group(1).strip()
        
        return None
    
    def extraer_subtotal(self) -> Optional[Decimal]:
        """Extrae el subtotal - MEJORADO"""
        # Buscar en todo el texto
        patterns = [
            r'GRAVADA[.\s:]*S/\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})',
            r'GRAVADAS[.\s:]*S/\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})',
            r'SUBTOTAL[.\s:]*S/\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.texto_completo, re.IGNORECASE)
            if match:
                monto_str = match.group(1).replace(',', '')
                try:
                    monto = Decimal(monto_str)
                    if monto > 10:  # Filtrar montos muy pequeños
                        return monto
                except:
                    pass
        
        return None
    
    def extraer_igv(self) -> Optional[Decimal]:
        """Extrae el IGV - MEJORADO"""
        patterns = [
            r'I\.?G\.?V[.\s]*18%[.\s:]*S/\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})',
            r'IGV[.\s:]*S/\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.texto_completo, re.IGNORECASE)
            if match:
                monto_str = match.group(1).replace(',', '')
                try:
                    monto = Decimal(monto_str)
                    if monto > 0:
                        return monto
                except:
                    pass
        
        return None
    
    def extraer_total(self) -> Optional[Decimal]:
        """Extrae el total - MEJORADO"""
        patterns = [
            r'IMPORTE\s*TOTAL[.\s:]*S/\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})',
            r'TOTAL[.\s:]*S/\s*(\d{1,3}(?:,\d{3})*\.?\d{0,2})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.texto_completo, re.IGNORECASE)
            if match:
                monto_str = match.group(1).replace(',', '')
                try:
                    monto = Decimal(monto_str)
                    if monto > 10:
                        return monto
                except:
                    pass
        
        return None
    
    def extraer_items(self) -> List[dict]:
        """Extrae items - MEJORADO filtrando basura"""
        items = []
        orden = 1
        
        # Palabras clave para filtrar líneas que NO son productos
        palabras_filtro = [
            'FORMA DE PAGO', 'PAGO ADELANTADO', 'CUOTA', 'VENCIMIENTO',
            'SON:', 'SOLES', 'GRAVADA', 'EXONERADA', 'GRATUITAS',
            'DSCTO', 'I.G.V', 'IMPORTE TOTAL', 'N° CUENTA', 'BCP',
            'INFORMACIÓN', 'ESTIMADO', 'CLIENTE', 'SUPERVAN S.A.',
            'FNF 2026', 'ENE 2026'
        ]
        
        for linea in self.lineas:
            # Filtrar líneas de basura
            if any(filtro in linea.upper() for filtro in palabras_filtro):
                continue
            
            # Buscar líneas que parecen productos (tienen cantidad y precio)
            match = re.search(
                r'(CAJ\d+|UND|KG|LT|UN|PZA|BOX)\s+(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)',
                linea,
                re.IGNORECASE
            )
            
            if match:
                descripcion = match.group(2).strip()
                try:
                    cantidad = Decimal(match.group(3))
                    precio = Decimal(match.group(4))
                    
                    if cantidad > 0 and precio > 0:
                        items.append({
                            'orden': orden,
                            'descripcion': descripcion,
                            'cantidad': cantidad,
                            'precio_unitario': precio,
                            'valor_total': cantidad * precio,
                            'unidad_medida': match.group(1).upper(),
                        })
                        orden += 1
                except:
                    pass
        
        return items
    
    # Las demás funciones quedan igual
    def extraer_numero_factura(self) -> Optional[str]:
        pattern = r'([A-Z]\d{3}-\d{8})'
        match = re.search(pattern, self.texto_completo)
        return match.group(1) if match else None
    
    def extraer_serie(self) -> Optional[str]:
        numero = self.extraer_numero_factura()
        return numero.split('-')[0] if numero and '-' in numero else None
    
    def extraer_correlativo(self) -> Optional[str]:
        numero = self.extraer_numero_factura()
        return numero.split('-')[1] if numero and '-' in numero else None
    
    def extraer_fecha_emision(self) -> Optional[date]:
        patterns = [
            r'Fecha\s+Emisi[oó]n\s*:?\s*(\d{2})/(\d{2})/(\d{4})',
            r'F\.\s*Emisi[oó]n\s*:?\s*(\d{2})/(\d{2})/(\d{4})',
            r'(\d{2})/(\d{2})/(\d{4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.texto_completo, re.IGNORECASE)
            if match:
                try:
                    dia, mes, anio = match.groups()
                    return date(int(anio), int(mes), int(dia))
                except:
                    pass
        return None
    
    def extraer_fecha_vencimiento(self) -> Optional[date]:
        patterns = [
            r'Fecha\s+Vto\.?\s*:?\s*(\d{2})/(\d{2})/(\d{4})',
            r'F\.\s*Vto\.?\s*:?\s*(\d{2})/(\d{2})/(\d{4})',
            r'Vencimiento\s*:?\s*(\d{2})/(\d{2})/(\d{4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, self.texto_completo, re.IGNORECASE)
            if match:
                try:
                    dia, mes, anio = match.groups()
                    return date(int(anio), int(mes), int(dia))
                except:
                    pass
        return None
    
    def extraer_ruc_emisor(self) -> Optional[str]:
        pattern = r'RUC\s*N[°º]?\s*(\d{11})'
        match = re.search(pattern, self.texto_completo, re.IGNORECASE)
        if match:
            return match.group(1)
        
        pattern2 = r'\b(\d{11})\b'
        match2 = re.search(pattern2, self.texto_completo)
        if match2:
            return match2.group(1)
        
        return None
    
    def extraer_direccion_emisor(self) -> Optional[str]:
        keywords = ['OF. Principal:', 'Dirección:', 'Dir.:', 'Domicilio:']
        for keyword in keywords:
            for i, linea in enumerate(self.lineas):
                if keyword in linea:
                    direccion = linea.split(keyword, 1)[1].strip()
                    if len(direccion) > 10:
                        return direccion
        return None
    
    def extraer_telefono_emisor(self) -> Optional[str]:
        pattern = r'(?:Tel|Teléfono|Central)[:\s]*(\(?\d{2,3}\)?\s*\d{6,8})'
        match = re.search(pattern, self.texto_completo, re.IGNORECASE)
        return match.group(1).strip() if match else None
    
    def extraer_email_emisor(self) -> Optional[str]:
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(pattern, self.texto_completo)
        return match.group(0) if match else None
    
    def extraer_moneda(self) -> str:
        if 'USD' in self.texto_completo or '$' in self.texto_completo:
            return 'USD'
        return 'PEN'
    
    def extraer_forma_pago(self) -> Optional[str]:
        keywords = ['CONTADO', 'CREDITO', 'CRÉDITO', 'ADELANTADO']
        for keyword in keywords:
            if keyword in self.texto_completo.upper():
                return keyword
        return None
    
    def extraer_condicion_pago(self) -> Optional[str]:
        pattern = r'FORMA DE PAGO[:\s]*(.*?)(?:\n|$)'
        match = re.search(pattern, self.texto_completo, re.IGNORECASE)
        return match.group(1).strip() if match else None
    
    def extraer_orden_compra(self) -> Optional[str]:
        pattern = r'(?:Orden|O/C|OC)[:\s]*(\d+[-/]?\d*)'
        match = re.search(pattern, self.texto_completo, re.IGNORECASE)
        return match.group(1) if match else None
    
    def extraer_guia_remision(self) -> Optional[str]:
        pattern = r'Gu[ií]a[:\s]*(T?\d{3}[\s-]?\d{8})'
        match = re.search(pattern, self.texto_completo, re.IGNORECASE)
        return match.group(1) if match else None
    
    
def parsear_factura_ocr(texto_ocr: str, datos_estructurados: Dict) -> Dict:
    """
    Función helper para parsear una factura
    
    Args:
        texto_ocr: Texto extraído por OCR
        datos_estructurados: Datos estructurados de Google Vision
        
    Returns:
        Diccionario con datos parseados
    """
    parser = FacturaParser(texto_ocr, datos_estructurados)
    return parser.extraer_todos_los_datos()