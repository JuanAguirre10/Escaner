"""
Servicio OCR para Documentos de Identidad
Detecta automáticamente: DNI, Carnet de Extranjería, Pasaporte, CPP
"""

import json
from typing import Dict, Any

PROMPT_DOC_IDENTIDAD = """
Analiza esta imagen de un DOCUMENTO DE IDENTIDAD y extrae la información.

El documento puede ser:
- DNI (Documento Nacional de Identidad - Perú)
- Carnet de Extranjería
- Pasaporte
- CPP (Carné de Permiso Temporal de Permanencia)
- Otro documento de identidad

INSTRUCCIONES:
1. DETECTA AUTOMÁTICAMENTE el tipo de documento
2. Extrae SIEMPRE estos campos (obligatorios):
   - Número del documento
   - Nombres
   - Apellidos (o nombre completo si no están separados)

3. Extrae campos opcionales si están presentes:
   - Nacionalidad
   - Fecha de nacimiento
   - Fecha de emisión
   - Fecha de vencimiento
   - Sexo/Género

RESPONDE EN FORMATO JSON:
{
  "tipo_documento": "DNI | CARNET_EXTRANJERIA | PASAPORTE | CPP | OTRO",
  "numero_documento": "string (OBLIGATORIO)",
  "nombres": "string (OBLIGATORIO)",
  "apellidos": "string (OBLIGATORIO)",
  "nombre_completo": "string (si no están separados nombres/apellidos)",
  "nacionalidad": "string | null",
  "fecha_nacimiento": "YYYY-MM-DD | null",
  "fecha_emision": "YYYY-MM-DD | null",
  "fecha_vencimiento": "YYYY-MM-DD | null",
  "sexo": "M | F | null",
  "confianza": 0-100,
  "observaciones": "string con detalles adicionales del documento"
}

REGLAS IMPORTANTES:
- Si no puedes detectar el tipo exacto, usa "OTRO"
- SIEMPRE extrae al menos: tipo_documento, numero_documento, y (nombres + apellidos) O nombre_completo
- Si los nombres y apellidos están juntos, ponlos en "nombre_completo"
- Para DNI peruano: el número tiene 8 dígitos
- Para Carnet de Extranjería: suele empezar con letras
- Para Pasaporte: formato varía según país
- Las fechas en formato YYYY-MM-DD
- Confianza: qué tan seguro estás de la extracción (0-100)

RESPONDE SOLO CON EL JSON, SIN TEXTO ADICIONAL.
"""


def construir_payload_identidad(imagen_base64: str) -> Dict[str, Any]:
    """Construye el payload para la API de Claude"""
    return {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 2000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": imagen_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": PROMPT_DOC_IDENTIDAD
                    }
                ]
            }
        ]
    }


def validar_datos_identidad(datos: Dict[str, Any]) -> Dict[str, Any]:
    """Valida y limpia los datos extraídos"""
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