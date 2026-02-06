import anthropic
import base64
import json
from pathlib import Path
from decimal import Decimal
from datetime import datetime
from app.config import settings

def extraer_con_claude(ruta_archivo: Path) -> tuple:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    with open(ruta_archivo, 'rb') as f:
        contenido = base64.standard_b64encode(f.read()).decode('utf-8')
    
    extension = ruta_archivo.suffix.lower()
    
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
    
    prompt = """Extrae datos de la FACTURA ELECTRÓNICA (NO la guía de remisión).

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
    {
      "orden": 3,
      "descripcion": "ARRANCADOR 12V 35MT",
      "cantidad": 1.0,
      "unidad_medida": "NIU",
      "precio_unitario": 367.37,
      "descuento_porcentaje": 0.0,
      "valor_total": 364.41
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

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
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
    
    if "```json" in respuesta:
        respuesta = respuesta.split("```json")[1].split("```")[0]
    elif "```" in respuesta:
        respuesta = respuesta.split("```")[1].split("```")[0]
    
    datos = json.loads(respuesta.strip())
    
    if datos.get('fecha_emision'):
        try:
            datos['fecha_emision'] = datetime.strptime(datos['fecha_emision'], '%Y-%m-%d').date()
        except:
            pass
    
    if datos.get('fecha_vencimiento'):
        try:
            datos['fecha_vencimiento'] = datetime.strptime(datos['fecha_vencimiento'], '%Y-%m-%d').date()
        except:
            pass
    
    for campo in ['subtotal', 'igv', 'total']:
        if datos.get(campo) is not None:
            datos[campo] = Decimal(str(datos[campo]))
    
    if datos.get('items'):
        for item in datos['items']:
            for c in ['cantidad', 'precio_unitario', 'descuento_porcentaje', 'valor_total']:
                if item.get(c) is not None:
                    item[c] = Decimal(str(item[c]))
    
    return datos, 98.0