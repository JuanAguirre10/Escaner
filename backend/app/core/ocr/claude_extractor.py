"""
Extractor OCR con Claude Vision API
Procesa facturas, guías de remisión, órdenes de compra y documentos de identidad
"""

import anthropic
import base64
import json
from pathlib import Path
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any, Tuple

from app.config import settings


class ClaudeExtractor:
    """
    Clase para extraer datos de documentos usando Claude Vision API
    """
    
    def __init__(self):
        """Inicializa el cliente de Anthropic"""
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-20250514"
    
    
    def extraer_datos_factura(
        self, 
        ruta_archivo: str | Path,
        tipo_archivo: str = "pdf"
    ) -> Dict[str, Any]:
        """
        Extrae datos estructurados de una factura usando Claude Vision
        
        Args:
            ruta_archivo: Ruta al archivo PDF o imagen
            tipo_archivo: Extensión del archivo (pdf, png, jpg, etc.)
        
        Returns:
            Dict con datos extraídos
        """
        ruta_archivo = Path(ruta_archivo)
        
        # Leer archivo como base64
        with open(ruta_archivo, 'rb') as f:
            contenido = base64.standard_b64encode(f.read()).decode('utf-8')
        
        # Determinar tipo de contenido
        extension = ruta_archivo.suffix.lower() if ruta_archivo.suffix else f".{tipo_archivo}"
        
        media_types = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        
        media_type = media_types.get(extension, 'application/pdf')
        content_type = "image" if extension in ['.png', '.jpg', '.jpeg', '.webp', '.gif'] else "document"
        
        # Generar prompt
        prompt = self._generar_prompt_factura()
        
        # Llamar a Claude Vision
        message = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": [{
                    "type": content_type,
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": contenido,
                    },
                }, {
                    "type": "text",
                    "text": prompt
                }],
            }],
        )
        
        # Extraer respuesta
        respuesta = message.content[0].text
        
        # Limpiar JSON de la respuesta
        respuesta = self._limpiar_json(respuesta)
        
        # Parsear JSON
        try:
            datos = json.loads(respuesta.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Error parseando respuesta de Claude: {e}\nRespuesta: {respuesta}")
        
        # Convertir tipos de datos
        datos = self._convertir_tipos_datos(datos)
        
        return datos
    
    
    def _generar_prompt_factura(self) -> str:
        """Genera el prompt para extraer datos de factura"""
        return """Extrae datos de la FACTURA ELECTRÓNICA (NO la guía de remisión).

UBICACIÓN DEL NÚMERO DE FACTURA:
En facturas peruanas, busca un RECUADRO en la parte superior derecha que dice:

┌─────────────────────────┐
│ RUC N° 20516587360      │
│ FACTURA ELECTRÓNICA     │
│ F001-32056              │ ← ESTE es el número de factura
└─────────────────────────┘

Abajo del recuadro puede aparecer:
G.Rem.: T001-2642 ← Esto es la GUÍA, NO la factura

REGLA CRÍTICA:
- Extrae el número que está DENTRO del recuadro con "FACTURA ELECTRÓNICA"
- NO extraigas el número que está después de "G.Rem:"
- numero_factura DEBE empezar con F, B, o E
- guia_remision puede empezar con T o G

Retorna JSON:

{
  "numero_factura": "F001-32056",
  "serie": "F001",
  "correlativo": "32056",
  "fecha_emision": "2026-01-07",
  "fecha_vencimiento": "2026-02-06",
  "ruc_emisor": "20516587360",
  "razon_social_emisor": "INVERSIONES DIFE COLORS S.A.C.",
  "direccion_emisor": "Av.Tomas Valle Mz.K It.24B Urb.Jorge Chavez 1 Etapa",
  "telefono_emisor": "575-2154",
  "email_emisor": "grupo_difecolors@yahoo.com",
  "guia_remision": "T001-2642",
  "subtotal": 847.46,
  "igv": 152.54,
  "total": 1000.00,
  "moneda": "PEN",
  "forma_pago": "CREDITO",
  "condicion_pago": "FACTURA A 30 DIAS",
  "orden_compra": "0001-67974",
  "items": [
    {
      "orden": 1,
      "descripcion": "ORING",
      "cantidad": 1.0,
      "unidad_medida": "UND",
      "precio_unitario": 4.28,
      "descuento_porcentaje": 10.0,
      "valor_total": 3.85
    },
    {
      "orden": 2,
      "descripcion": "TRANSFORMADOR DE OXIDO",
      "cantidad": 2.0,
      "unidad_medida": "GL",
      "precio_unitario": 118.64,
      "descuento_porcentaje": 0.0,
      "valor_total": 237.28
    }
  ]
}

NOTA IMPORTANTE PARA EXTRACCIÓN DE ITEMS:
Lee los números CON CUIDADO del PDF:
- Si ves "118.64" NO lo leas como "18.64"
- Si ves "237.28" NO lo leas como "37.28"
- Verifica TODOS los dígitos del precio
- El precio puede tener 1, 2 o 3 dígitos antes del punto decimal

INSTRUCCIONES DETALLADAS:

1. NÚMERO DE FACTURA:
   - Busca el recuadro con "FACTURA ELECTRÓNICA"
   - El número dentro es la factura (F###-######)
   - NO uses el que dice "G.Rem:" (esa es la guía)

2. RAZÓN SOCIAL:
   - Nombre COMPLETO de la empresa
   - Incluye: COMPAÑIA, SOCIEDAD ANONIMA, CERRADA, S.A.C., etc.

3. DIRECCIÓN DEL EMISOR:
   - IMPORTANTE: Extrae la dirección de la EMPRESA EMISORA (la que emite la factura)
   - NO extraigas la dirección del cliente/receptor
   - Busca cerca del RUC y razón social del emisor
   - En facturas Vistony: "OF. Principal: Mz. B1 Lt. 1 - Parque Industrial..."
   - NO usar: "AV. ELMER FAUCETT..." (esa es del receptor en general para todos)

4. TELÉFONO:
   - Solo números: "(01) 5521325" o "014567890"
   - Sin etiquetas como "Tel:" o "Central:"

5. EMAIL:
   - Si hay MÚLTIPLES emails separados por "/" o espacios, toma SOLO EL PRIMERO
   - Ejemplo correcto: "grupo_difecolors@yahoo.com"
   - Ejemplo incorrecto: "email1@domain.com / email2@domain.com"

6. FECHAS:
   - Formato: YYYY-MM-DD
   - fecha_emision: buscar "Fecha Emisión"
   - fecha_vencimiento: buscar "Fecha Vto"

7. ITEMS - VALIDACIÓN MATEMÁTICA OBLIGATORIA:
   - Extrae de la tabla principal de productos
   
   IMPORTANTE - IDENTIFICAR COLUMNAS CORRECTAMENTE:
   - precio_unitario: Buscar columna "Valor Unitario", "P.Unit", "Precio Unit", "P. Und"
   - valor_total: Buscar columna "Valor Venta", "P. Venta", "Total", "Precio Venta Total"
   
   NO CONFUNDIR:
   - "Valor Unitario" = precio_unitario (precio sin IGV de 1 unidad)
   - "Valor Venta Total" = valor_total (cantidad × precio_unitario)
   - "Precio Venta Total" = con IGV incluido (NO extraer)
   
   Ejemplo factura M&M:
   - Valor Unitario: 367.37 → precio_unitario = 367.37
   - Valor Venta Total: 364.41 → valor_total = 364.41
   - NO usar "Precio Venta Total: 433.99" (ese incluye IGV)

   CRÍTICO - VALIDACIÓN AUTOMÁTICA:
   - Después de extraer, VALIDA: cantidad × precio_unitario = valor_total
   - Si NO coincide (diferencia > 0.50), RECALCULA: precio_unitario = valor_total / cantidad
   
   Ejemplo validación Item 1:
   - Cantidad: 2 GL
   - Precio extraído: 18.64 (puede estar mal por OCR)
   - Total: 237.28
   - Validación: 2 × 18.64 = 37.28 ≠ 237.28 ❌ ERROR DE OCR
   - Recalcular: precio_unitario = 237.28 / 2 = 118.64 ✅ CORRECTO
   
   Ejemplo validación Item 2:
   - Cantidad: 40 UND
   - Precio extraído: 15.25
   - Total: 610.18
   - Validación: 40 × 15.25 = 610.00 ≈ 610.18 ✅ CORRECTO (redondeo normal)
   
   SIEMPRE aplicar esta validación y corrección automática
   
   - descuento_porcentaje: BUSCAR columna "%Dto", "Dto%", "DESC%", "Descuento %" o similar
   - Lee SOLO el número (ejemplo: si dice "10.00" extraer 10.0)
   - Si NO hay columna de descuento, poner 0.0
   - IMPORTANTE: Si hay descuento, entonces:
     * Valor Venta = cantidad × precio_unitario
     * P. Venta = Valor Venta × (1 - descuento/100)
   - NO incluyas: formas de pago, notas, totales

8. MONTOS:
   - subtotal: "OP. GRAVADA" o "Operaciones Gravadas"
   - igv: "I.G.V 18%" o "IGV"
   - total: "IMPORTE TOTAL"
   - moneda: SOLO códigos de 3 letras: "PEN", "USD", "EUR"
     * Si dice "Soles" o "Nuevos Soles" → "PEN"
     * Si dice "Dólares" o "Dólares Americanos" → "USD"
     * NUNCA poner el nombre completo, solo el código
     
9. Si un campo no existe: null

10. Retorna SOLO JSON sin explicaciones

VERIFICACIÓN FINAL:
✅ numero_factura empieza con F, B, o E (NO con T)
✅ email_emisor es UN SOLO email
✅ descuento_porcentaje entre 0 y 100
✅ razon_social_emisor es el nombre completo
"""
    
    
    def _limpiar_json(self, respuesta: str) -> str:
        """Limpia la respuesta de Claude para extraer solo el JSON"""
        # Quitar bloques de código markdown
        if "```json" in respuesta:
            respuesta = respuesta.split("```json")[1].split("```")[0]
        elif "```" in respuesta:
            respuesta = respuesta.split("```")[1].split("```")[0]
        
        return respuesta.strip()
    
    
    def _convertir_tipos_datos(self, datos: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convierte los tipos de datos del JSON a tipos de Python apropiados
        
        Args:
            datos: Diccionario con datos en formato string/float
        
        Returns:
            Diccionario con tipos convertidos (Decimal, date, etc.)
        """
        # Convertir fechas
        if datos.get('fecha_emision'):
            try:
                if isinstance(datos['fecha_emision'], str):
                    datos['fecha_emision'] = datetime.strptime(
                        datos['fecha_emision'], '%Y-%m-%d'
                    ).date()
            except:
                pass
        
        if datos.get('fecha_vencimiento'):
            try:
                if isinstance(datos['fecha_vencimiento'], str):
                    datos['fecha_vencimiento'] = datetime.strptime(
                        datos['fecha_vencimiento'], '%Y-%m-%d'
                    ).date()
            except:
                pass
        
        # Convertir montos a Decimal
        for campo in ['subtotal', 'igv', 'total']:
            if datos.get(campo) is not None:
                datos[campo] = Decimal(str(datos[campo]))
        
        # Convertir items
        if datos.get('items'):
            for item in datos['items']:
                for campo in ['cantidad', 'precio_unitario', 'descuento_porcentaje', 'valor_total']:
                    if item.get(campo) is not None:
                        item[campo] = Decimal(str(item[campo]))
        
        # Agregar confianza promedio (fija por ahora)
        datos['confianza_promedio'] = 98.0
        
        return datos
    
    def extraer_datos_recibo_honorarios(
        self,
        ruta_archivo: str | Path,
        tipo_archivo: str = "pdf"
    ) -> Dict[str, Any]:
        """
        Extrae datos estructurados de un Recibo por Honorarios peruano usando Claude Vision

        Args:
            ruta_archivo: Ruta al archivo PDF o imagen
            tipo_archivo: Extensión del archivo (pdf, png, jpg, etc.)

        Returns:
            Dict con datos extraídos
        """
        ruta_archivo = Path(ruta_archivo)

        with open(ruta_archivo, 'rb') as f:
            contenido = base64.standard_b64encode(f.read()).decode('utf-8')

        extension = ruta_archivo.suffix.lower() if ruta_archivo.suffix else f".{tipo_archivo}"

        media_types = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }

        media_type = media_types.get(extension, 'application/pdf')
        content_type = "image" if extension in ['.png', '.jpg', '.jpeg', '.webp', '.gif'] else "document"

        prompt = self._generar_prompt_recibo_honorarios()

        message = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": [{
                    "type": content_type,
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": contenido,
                    },
                }, {
                    "type": "text",
                    "text": prompt
                }],
            }],
        )

        respuesta = message.content[0].text
        respuesta = self._limpiar_json(respuesta)

        try:
            datos = json.loads(respuesta.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Error parseando respuesta de Claude: {e}\nRespuesta: {respuesta}")

        datos = self._convertir_tipos_datos_rxh(datos)

        return datos


    def _generar_prompt_recibo_honorarios(self) -> str:
        """Genera el prompt para extraer datos de Recibo por Honorarios peruano"""
        return """Extrae datos del RECIBO POR HONORARIOS ELECTRÓNICO peruano.

CARACTERÍSTICAS DEL RECIBO POR HONORARIOS:
- Serie empieza con "E" (ej: E001-123)
- NO tiene IGV (operación exonerada o inafecta)
- Puede tener Retención del Impuesto a la Renta (IR) del 8% si el monto supera S/ 1,500
- Es emitido por personas naturales por servicios independientes

Retorna JSON:

{
  "tipo_comprobante": "RECIBO_HONORARIOS",
  "numero_factura": "E001-00000123",
  "serie": "E001",
  "correlativo": "00000123",
  "fecha_emision": "2026-01-07",
  "fecha_vencimiento": null,
  "ruc_emisor": "10123456789",
  "razon_social_emisor": "JUAN PEREZ GARCIA",
  "direccion_emisor": "Jr. Las Flores 123, Lima",
  "telefono_emisor": null,
  "email_emisor": null,
  "ruc_cliente": "20516185211",
  "razon_social_cliente": "SUPERVAN S.A.C.",
  "direccion_cliente": "Av. Principal 456",
  "orden_compra": null,
  "subtotal": 2000.00,
  "igv": null,
  "retencion_ir": 160.00,
  "total": 1840.00,
  "moneda": "PEN",
  "forma_pago": null,
  "condicion_pago": null,
  "items": [
    {
      "orden": 1,
      "descripcion": "Servicios de consultoría",
      "cantidad": 1.0,
      "unidad_medida": "SRV",
      "precio_unitario": 2000.00,
      "descuento_porcentaje": 0.0,
      "valor_total": 2000.00
    }
  ]
}

INSTRUCCIONES DETALLADAS:

1. NÚMERO DE RECIBO:
   - Busca el recuadro con "RECIBO POR HONORARIOS ELECTRÓNICO"
   - La serie DEBE empezar con "E" (ej: E001)
   - Formato: E###-########

2. EMISOR:
   - Es una persona natural (no empresa)
   - RUC de persona natural empieza con "10"
   - Nombre completo en mayúsculas

3. MONTOS:
   - subtotal: monto de honorarios brutos (antes de retención)
   - igv: SIEMPRE null (los RxH no tienen IGV)
   - retencion_ir: retención del 8% si aplica (cuando honorarios > S/ 1,500), sino null
   - total: monto neto a pagar (subtotal - retencion_ir)
   - Si no hay retención: total = subtotal

4. SERVICIO:
   - Describe el servicio prestado en items
   - Usualmente es un solo item de servicio

5. FECHAS:
   - Formato: YYYY-MM-DD

6. Si un campo no existe: null

7. Retorna SOLO JSON sin explicaciones

VERIFICACIÓN FINAL:
✅ tipo_comprobante = "RECIBO_HONORARIOS"
✅ serie empieza con "E"
✅ igv es null
✅ ruc_emisor empieza con "10" (persona natural)
"""


    def _convertir_tipos_datos_rxh(self, datos: Dict[str, Any]) -> Dict[str, Any]:
        """Convierte los tipos de datos del Recibo por Honorarios"""
        # Convertir fechas
        if datos.get('fecha_emision'):
            try:
                if isinstance(datos['fecha_emision'], str):
                    datos['fecha_emision'] = datetime.strptime(
                        datos['fecha_emision'], '%Y-%m-%d'
                    ).date()
            except:
                pass

        if datos.get('fecha_vencimiento'):
            try:
                if isinstance(datos['fecha_vencimiento'], str):
                    datos['fecha_vencimiento'] = datetime.strptime(
                        datos['fecha_vencimiento'], '%Y-%m-%d'
                    ).date()
            except:
                pass

        # Convertir montos a Decimal
        for campo in ['subtotal', 'total']:
            if datos.get(campo) is not None:
                datos[campo] = Decimal(str(datos[campo]))

        # igv siempre None para RxH
        datos['igv'] = None

        # retencion_ir
        if datos.get('retencion_ir') is not None:
            datos['retencion_ir'] = Decimal(str(datos['retencion_ir']))

        # Convertir items
        if datos.get('items'):
            for item in datos['items']:
                for campo in ['cantidad', 'precio_unitario', 'descuento_porcentaje', 'valor_total']:
                    if item.get(campo) is not None:
                        item[campo] = Decimal(str(item[campo]))

        # Asegurar tipo_comprobante
        datos['tipo_comprobante'] = 'RECIBO_HONORARIOS'

        # Confianza
        datos['confianza_promedio'] = 98.0

        return datos


    def extraer_datos_guia_remision(
        self, 
        ruta_archivo: str | Path,
        tipo_archivo: str = "pdf"
    ) -> Dict[str, Any]:
        """
        Extrae datos estructurados de una guía de remisión usando Claude Vision
        
        Args:
            ruta_archivo: Ruta al archivo PDF o imagen
            tipo_archivo: Extensión del archivo (pdf, png, jpg, etc.)
        
        Returns:
            Dict con datos extraídos
        """
        ruta_archivo = Path(ruta_archivo)
        
        # Leer archivo como base64
        with open(ruta_archivo, 'rb') as f:
            contenido = base64.standard_b64encode(f.read()).decode('utf-8')
        
        # Determinar tipo de contenido
        extension = ruta_archivo.suffix.lower() if ruta_archivo.suffix else f".{tipo_archivo}"
        
        media_types = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        
        media_type = media_types.get(extension, 'application/pdf')
        content_type = "image" if extension in ['.png', '.jpg', '.jpeg', '.webp', '.gif'] else "document"
        
        # Generar prompt
        prompt = self._generar_prompt_guia_remision()
        
        # Llamar a Claude Vision
        message = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": [{
                    "type": content_type,
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": contenido,
                    },
                }, {
                    "type": "text",
                    "text": prompt
                }],
            }],
        )
        
        # Extraer respuesta
        respuesta = message.content[0].text
        
        # Limpiar JSON de la respuesta
        respuesta = self._limpiar_json(respuesta)
        
        # Parsear JSON
        try:
            datos = json.loads(respuesta.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Error parseando respuesta de Claude: {e}\nRespuesta: {respuesta}")
        
        # Convertir tipos de datos
        datos = self._convertir_tipos_datos_guia(datos)
        
        return datos
    
    
    def _generar_prompt_guia_remision(self) -> str:
        """Genera el prompt para extraer datos de guía de remisión"""
        return """Extrae datos de la GUÍA DE REMISIÓN ELECTRÓNICA peruana.

Retorna JSON:

{
  "numero_guia": "T001-2642",
  "serie": "T001",
  "correlativo": "2642",
  "fecha_emision": "2026-01-07",
  "fecha_traslado": "2026-01-08",
  "motivo_traslado": "VENTA",
  "modalidad_transporte": "Transporte Privado",
  "punto_partida": "Av. Industrial 123, Lima",
  "punto_llegada": "Jr. Comercio 456, Callao",
  "ruc_emisor": "20516587360",
  "razon_social_emisor": "EMPRESA S.A.C.",
  "direccion_emisor": "Av. Principal 789",
  "ruc_destinatario": "20102030405",
  "razon_social_destinatario": "CLIENTE S.A.",
  "direccion_destinatario": "Jr. Los Pinos 321",
  "transportista_razon_social": "TRANSPORTES S.A.C.",
  "transportista_ruc": "20123456789",
  "vehiculo_placa": "ABC-123",
  "vehiculo_mtc": "123456789",
  "conductor_nombre": "JUAN PEREZ GOMEZ",
  "conductor_dni": "12345678",
  "conductor_licencia": "Q12345678",
  "peso_bruto": 100.5,
  "unidad_peso": "KGM",
  "transbordo_programado": false,
  "factura_relacionada": "F001-123",
  "items": [
        {
            "codigo": "código del producto",
            "descripcion": "descripción completa del producto",
            "cantidad": "cantidad como número decimal",
            "unidad_medida": "unidad de medida",
            "peso_bruto": "peso bruto de este item en kilogramos (si aparece en la tabla PESO BRUTO, sino 0)"
        }
    ]
}
IMPORTANTE SOBRE PESOS:
- Si hay una tabla "PESO BRUTO" con pesos por item, extrae cada peso en el campo peso_bruto de cada item
- Si solo hay PESO TOTAL sin detalle por item, deja peso_bruto en 0 para todos los items
- El peso_bruto debe estar en kilogramos (KG)


INSTRUCCIONES:

1. NÚMERO DE GUÍA:
   - Busca el recuadro con "GUÍA DE REMISIÓN ELECTRÓNICA"
   - Formato: T###-###### o G###-######
   - Ejemplo: "T001-2642"

2. FECHAS:
   - Formato: YYYY-MM-DD
   - fecha_emision: Fecha de emisión del documento
   - fecha_traslado: Fecha programada del traslado

3. MOTIVO DE TRASLADO:
   - Extrae el motivo exacto: "VENTA", "COMPRA", "TRASLADO ENTRE ESTABLECIMIENTOS", etc.

4. TRANSPORTE:
   - modalidad_transporte: "Transporte Privado" o "Transporte Público"
   - Datos del transportista, vehículo y conductor

5. PUNTOS:
   - punto_partida: Dirección completa de origen
   - punto_llegada: Dirección completa de destino

6. PESO:
   - peso_bruto: Peso total en números decimales
   - unidad_peso: "KGM" (kilogramos), "TNE" (toneladas), etc.

7. ITEMS:
   - Productos o bienes transportados
   - Solo cantidad y unidad de medida (sin precios)

8. Si un campo no existe: null

9. Retorna SOLO JSON sin explicaciones

VERIFICACIÓN FINAL:
✅ numero_guia empieza con T o G
✅ fechas en formato YYYY-MM-DD
✅ peso_bruto es numérico
"""
    
    
    def _convertir_tipos_datos_guia(self, datos: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convierte los tipos de datos de guía de remisión
        
        Args:
            datos: Diccionario con datos en formato string/float
        
        Returns:
            Diccionario con tipos convertidos
        """
        # Convertir fechas
        for campo_fecha in ['fecha_emision', 'fecha_traslado']:
            if datos.get(campo_fecha):
                try:
                    if isinstance(datos[campo_fecha], str):
                        datos[campo_fecha] = datetime.strptime(
                            datos[campo_fecha], '%Y-%m-%d'
                        ).date()
                except:
                    pass
        
        # Convertir peso a Decimal
        if datos.get('peso_bruto') is not None:
            datos['peso_bruto'] = Decimal(str(datos['peso_bruto']))
        
        # Convertir items
        if datos.get('items'):
            for item in datos['items']:
                if item.get('cantidad') is not None:
                    item['cantidad'] = Decimal(str(item['cantidad']))
        
        # Agregar confianza promedio
        datos['confianza_promedio'] = 95.0
        
        return datos
        
    def extraer_datos_orden_compra(
        self, 
        ruta_archivo: str | Path,
        tipo_archivo: str = "pdf"
    ) -> Dict[str, Any]:
        """
        Extrae datos estructurados de una Orden de Compra usando Claude Vision
        
        Args:
            ruta_archivo: Ruta al archivo PDF o imagen
            tipo_archivo: Extensión del archivo (pdf, png, jpg, etc.)
        
        Returns:
            Dict con datos extraídos
        """
        ruta_archivo = Path(ruta_archivo)
        
        # Leer archivo como base64
        with open(ruta_archivo, 'rb') as f:
            contenido = base64.standard_b64encode(f.read()).decode('utf-8')
        
        # Determinar tipo de contenido
        extension = ruta_archivo.suffix.lower() if ruta_archivo.suffix else f".{tipo_archivo}"
        
        media_types = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        
        media_type = media_types.get(extension, 'application/pdf')
        content_type = "image" if extension in ['.png', '.jpg', '.jpeg', '.webp', '.gif'] else "document"
        
        # Generar prompt
        prompt = self._generar_prompt_orden_compra()
        
        # Llamar a Claude Vision
        message = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": [{
                    "type": content_type,
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": contenido,
                    },
                }, {
                    "type": "text",
                    "text": prompt
                }],
            }],
        )
        
        # Extraer respuesta
        respuesta = message.content[0].text
        
        # Limpiar JSON de la respuesta
        respuesta = self._limpiar_json(respuesta)
        
        # Parsear JSON
        try:
            datos = json.loads(respuesta.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Error parseando respuesta de Claude: {e}\nRespuesta: {respuesta}")
        
        # Convertir tipos de datos
        datos = self._convertir_tipos_datos_orden_compra(datos)
        
        return datos
    
    
    def _generar_prompt_orden_compra(self) -> str:
        """Genera el prompt para extraer datos de Orden de Compra"""
        return """
Eres un experto en procesamiento de documentos comerciales peruanos.

Analiza esta ORDEN DE COMPRA y extrae la siguiente información en formato JSON.

CAMPOS A EXTRAER:

{
    "numero_orden_compra": "número completo de la OC (ej: 0001-68688)",
    "serie_orden": "serie (ej: 0001)",
    "correlativo_orden": "correlativo (ej: 68688)",
    
    "fecha_emision": "fecha de emisión en formato YYYY-MM-DD",
    "fecha_entrega": "fecha de entrega en formato YYYY-MM-DD",
    
    "ruc_comprador": "RUC del comprador (quien emite la OC)",
    "razon_social_comprador": "razón social del comprador",
    "direccion_comprador": "dirección del comprador",
    "telefono_comprador": "teléfono del comprador",
    
    "ruc_proveedor": "RUC del proveedor",
    "razon_social_proveedor": "razón social del proveedor",
    "direccion_proveedor": "dirección del proveedor",
    
    "direccion_entrega": "dirección de entrega de la mercadería",
    "modo_pago": "modo o condición de pago",
    "moneda": "moneda (Soles, Dolares Americanos → convertir a PEN, USD)",
    
    "observaciones": "observaciones o notas adicionales",
    
    "subtotal": "subtotal sin IGV como número decimal",
    "igv": "IGV como número decimal",
    "total": "total como número decimal",
    
    "items": [
        {
            "codigo": "código del producto",
            "descripcion": "descripción del producto o servicio",
            "cantidad": "cantidad como número decimal",
            "unidad_medida": "unidad de medida (UND, KG, etc)",
            "precio_unitario": "precio unitario como número decimal",
            "importe": "importe total del item como número decimal",
            "peso_bruto": "peso bruto de este item en KG (si aparece, sino 0)"
        }
    ],
    
    "peso_total": "peso bruto total de todos los items en KG (si aparece, sino null)",
    "unidad_peso": "unidad del peso (KG, KGM, TNE, etc)",
    
    "confianza_promedio": 95.0
}

IMPORTANTE SOBRE PESOS:
- Algunas OC tienen peso por item Y peso total
- Otras OC solo tienen peso total (sin detalle por item)
- Otras OC no tienen ningún dato de peso
- Si hay peso por item, extráelo en cada item
- Si solo hay peso total, ponlo en "peso_total"
- Si no hay pesos, usa 0 o null

INSTRUCCIONES:
- Extrae TODOS los campos que encuentres
- Si un campo no existe, usa null
- Para fechas usa formato YYYY-MM-DD
- Para números usa decimales (ej: 465.63)
- Para moneda: "Soles" → "PEN", "Dolares Americanos" o "US$" → "USD"
- La confianza es tu estimación de precisión (0-100)
- Responde SOLO con el JSON, sin explicaciones adicionales
"""
    
    
    def _convertir_tipos_datos_orden_compra(self, datos: dict) -> dict:
        """Convierte tipos de datos de la orden de compra"""
        # Convertir fechas
        if datos.get("fecha_emision"):
            try:
                datos["fecha_emision"] = datetime.strptime(
                    datos["fecha_emision"], "%Y-%m-%d"
                ).date()
            except:
                datos["fecha_emision"] = None
        
        if datos.get("fecha_entrega"):
            try:
                datos["fecha_entrega"] = datetime.strptime(
                    datos["fecha_entrega"], "%Y-%m-%d"
                ).date()
            except:
                datos["fecha_entrega"] = None
        
        # Convertir montos a Decimal
        for campo in ["subtotal", "igv", "total"]:
            if datos.get(campo):
                try:
                    datos[campo] = Decimal(str(datos[campo]))
                except:
                    datos[campo] = Decimal("0.00")
        
        # Convertir items
        if datos.get("items"):
            for item in datos["items"]:
                for campo in ["cantidad", "precio_unitario", "importe", "peso_bruto"]:
                    if item.get(campo):
                        try:
                            item[campo] = Decimal(str(item[campo]))
                        except:
                            item[campo] = Decimal("0.00")
        
        return datos
    
    
    def extraer_datos_identidad(
        self, 
        ruta_archivo: str | Path,
        tipo_archivo: str = "pdf"
    ) -> Dict[str, Any]:
        """
        Extrae datos de documento de identidad (DNI, CE, Pasaporte, CPP)
        
        Args:
            ruta_archivo: Ruta al archivo PDF o imagen
            tipo_archivo: Extensión del archivo (pdf, png, jpg, etc.)
        
        Returns:
            Dict con datos extraídos
        """
        ruta_archivo = Path(ruta_archivo)
        
        # Leer archivo como base64
        with open(ruta_archivo, 'rb') as f:
            contenido = base64.standard_b64encode(f.read()).decode('utf-8')
        
        # Determinar tipo de contenido
        extension = ruta_archivo.suffix.lower() if ruta_archivo.suffix else f".{tipo_archivo}"
        
        media_types = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        
        media_type = media_types.get(extension, 'application/pdf')
        content_type = "image" if extension in ['.png', '.jpg', '.jpeg', '.webp', '.gif'] else "document"
        
        # Generar prompt
        prompt = self._generar_prompt_identidad()
        
        # Llamar a Claude Vision
        message = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": [{
                    "type": content_type,
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": contenido,
                    },
                }, {
                    "type": "text",
                    "text": prompt
                }],
            }],
        )
        
        # Extraer respuesta
        respuesta = message.content[0].text
        
        # Limpiar JSON de la respuesta
        respuesta = self._limpiar_json(respuesta)
        
        # Parsear JSON
        try:
            datos = json.loads(respuesta.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Error parseando respuesta de Claude: {e}\nRespuesta: {respuesta}")
        
        # Validar datos
        datos = self._validar_datos_identidad(datos)
        
        # Convertir tipos de datos
        datos = self._convertir_tipos_datos_identidad(datos)
        
        return datos
    
    
    def _generar_prompt_identidad(self) -> str:
        """Genera el prompt para extraer datos de documento de identidad"""
        return """Analiza este documento de identidad y extrae:

RESPONDE EN JSON:
{
  "tipo_documento": "DNI o CARNET_EXTRANJERIA o PASAPORTE o CPP o OTRO",
  "numero_documento": "número del documento",
  "nombres": "nombres de la persona",
  "apellidos": "apellidos de la persona",
  "nombre_completo": "nombre completo si no están separados",
  "nacionalidad": "nacionalidad o null",
  "fecha_nacimiento": "YYYY-MM-DD o null",
  "fecha_emision": "YYYY-MM-DD o null",
  "fecha_vencimiento": "YYYY-MM-DD o null",
  "sexo": "M o F o null",
  "confianza": 95,
  "observaciones": "detalles adicionales"
}

Solo JSON, sin texto adicional."""
    
    
    def _validar_datos_identidad(self, datos: Dict[str, Any]) -> Dict[str, Any]:
        """Valida y limpia los datos extraídos del documento de identidad"""
        if not datos.get('numero_documento'):
            raise ValueError("No se pudo extraer el número de documento")
        
        if not (datos.get('nombres') and datos.get('apellidos')) and not datos.get('nombre_completo'):
            raise ValueError("No se pudieron extraer los nombres/apellidos")
        
        if not datos.get('tipo_documento'):
            datos['tipo_documento'] = 'OTRO'
        
        tipos_validos = ['DNI', 'CARNET_EXTRANJERIA', 'PASAPORTE', 'CPP', 'OTRO']
        if datos['tipo_documento'] not in tipos_validos:
            datos['tipo_documento'] = 'OTRO'
        
        campos_opcionales = [
            'nacionalidad', 'fecha_nacimiento', 'fecha_emision', 
            'fecha_vencimiento', 'sexo', 'observaciones'
        ]
        
        for campo in campos_opcionales:
            if campo in datos and datos[campo] in [None, '', 'null', 'NULL']:
                datos[campo] = None
        
        return datos
    
    
    def _convertir_tipos_datos_identidad(self, datos: Dict[str, Any]) -> Dict[str, Any]:
        """Convierte tipos de datos del documento de identidad"""
        for campo_fecha in ['fecha_nacimiento', 'fecha_emision', 'fecha_vencimiento']:
            if datos.get(campo_fecha):
                try:
                    if isinstance(datos[campo_fecha], str):
                        datos[campo_fecha] = datetime.strptime(
                            datos[campo_fecha], '%Y-%m-%d'
                        ).date()
                except:
                    datos[campo_fecha] = None
        
        if 'confianza' not in datos:
            datos['confianza'] = 95.0
        
        return datos


# ==================================
# FUNCIÓN LEGACY PARA COMPATIBILIDAD
# ==================================

def extraer_con_claude(ruta_archivo: Path) -> Tuple[Dict[str, Any], float]:
    """
    Función de compatibilidad con código antiguo
    
    Args:
        ruta_archivo: Ruta al archivo
    
    Returns:
        Tupla (datos_extraidos, confianza)
    """
    extractor = ClaudeExtractor()
    datos = extractor.extraer_datos_factura(ruta_archivo)
    confianza = datos.pop('confianza_promedio', 98.0)
    return datos, confianza