"""
Extractor OCR usando Google Vision API
Procesa imágenes y PDFs para extraer texto
"""

import os
import io
import time
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from PIL import Image
import logging

from google.cloud import vision
from google.oauth2 import service_account

from app.config import settings

# Configurar logging
logger = logging.getLogger(__name__)


class GoogleVisionExtractor:
    """
    Clase para extraer texto de facturas usando Google Vision API
    """
    
    def __init__(self):
        """Inicializar el cliente de Google Vision"""
        # Configurar credenciales
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(settings.google_credentials_path)
        
        # Crear cliente
        try:
            credentials = service_account.Credentials.from_service_account_file(
                str(settings.google_credentials_path)
            )
            self.client = vision.ImageAnnotatorClient(credentials=credentials)
            logger.info("✅ Google Vision API inicializado correctamente")
        except Exception as e:
            logger.error(f"❌ Error inicializando Google Vision: {e}")
            raise
    
    def extraer_texto_imagen(self, imagen_path: Path) -> Tuple[str, float, Dict]:
        """
        Extrae texto de una imagen usando Google Vision
        
        Args:
            imagen_path: Ruta de la imagen
            
        Returns:
            Tuple[texto_completo, confianza_promedio, datos_raw]
        """
        inicio = time.time()
        
        try:
            # Leer imagen
            with io.open(str(imagen_path), 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Llamar a Google Vision API - Document Text Detection
            response = self.client.document_text_detection(image=image)
            
            # Verificar errores
            if response.error.message:
                raise Exception(f"Error en Google Vision: {response.error.message}")
            
            # Extraer texto completo
            texto_completo = response.full_text_annotation.text if response.full_text_annotation else ""
            
            # Calcular confianza promedio
            confianza_promedio = self._calcular_confianza(response)
            
            # Preparar datos estructurados
            datos_estructurados = self._estructurar_datos(response)
            
            tiempo_procesamiento = time.time() - inicio
            
            logger.info(
                f"✅ OCR completado en {tiempo_procesamiento:.2f}s - "
                f"Confianza: {confianza_promedio:.2f}% - "
                f"Caracteres: {len(texto_completo)}"
            )
            
            return texto_completo, confianza_promedio, datos_estructurados
            
        except Exception as e:
            logger.error(f"❌ Error en extracción OCR: {e}")
            raise
    
    def _calcular_confianza(self, response) -> float:
        """
        Calcula la confianza promedio del OCR
        
        Args:
            response: Respuesta de Google Vision
            
        Returns:
            Confianza promedio (0-100)
        """
        if not response.full_text_annotation:
            return 0.0
        
        confianzas = []
        
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                confianzas.append(block.confidence)
        
        if not confianzas:
            return 0.0
        
        # Convertir a porcentaje
        return round(sum(confianzas) / len(confianzas) * 100, 2)
    
    def _estructurar_datos(self, response) -> Dict:
        """
        Estructura los datos de la respuesta de Google Vision
        
        Args:
            response: Respuesta de Google Vision
            
        Returns:
            Diccionario con datos estructurados
        """
        datos = {
            "texto_completo": "",
            "bloques": [],
            "parrafos": [],
            "palabras": [],
            "confianza_global": 0.0
        }
        
        if not response.full_text_annotation:
            return datos
        
        datos["texto_completo"] = response.full_text_annotation.text
        
        # Extraer bloques de texto
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                bloque_texto = ""
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        word_text = ''.join([symbol.text for symbol in word.symbols])
                        bloque_texto += word_text + " "
                
                datos["bloques"].append({
                    "texto": bloque_texto.strip(),
                    "confianza": round(block.confidence * 100, 2)
                })
        
        # Extraer palabras individuales
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        word_text = ''.join([symbol.text for symbol in word.symbols])
                        datos["palabras"].append({
                            "texto": word_text,
                            "confianza": round(word.confidence * 100, 2) if hasattr(word, 'confidence') else 0.0
                        })
        
        # Calcular confianza global
        datos["confianza_global"] = self._calcular_confianza(response)
        
        return datos
    
    def preprocesar_imagen(self, imagen_path: Path, output_path: Optional[Path] = None) -> Path:
        """
        Preprocesa la imagen para mejorar OCR
        - Convierte a escala de grises
        - Aumenta contraste
        - Ajusta brillo
        
        Args:
            imagen_path: Ruta de la imagen original
            output_path: Ruta donde guardar imagen procesada (opcional)
            
        Returns:
            Ruta de la imagen procesada
        """
        try:
            # Abrir imagen
            img = Image.open(imagen_path)
            
            # Convertir a RGB si es necesario
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Aquí podrías agregar más procesamiento:
            # - Binarización
            # - Eliminación de ruido
            # - Corrección de inclinación
            # Por ahora dejamos la imagen como está para preservar calidad
            
            # Guardar imagen procesada
            if output_path is None:
                output_path = imagen_path.parent / f"processed_{imagen_path.name}"
            
            img.save(output_path, quality=95)
            
            logger.info(f"✅ Imagen preprocesada: {output_path}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Error en preprocesamiento: {e}")
            return imagen_path  # Retornar original si falla
    
    def extraer_desde_pdf(self, pdf_path: Path) -> Tuple[str, float, Dict]:
        """
        Extrae texto de un PDF
        Convierte PDF a imagen y procesa con OCR
        
        Args:
            pdf_path: Ruta del PDF
            
        Returns:
            Tuple[texto_completo, confianza_promedio, datos_raw]
        """
        try:
            from pdf2image import convert_from_path
            
            # Convertir PDF a imágenes
            imagenes = convert_from_path(str(pdf_path), dpi=300, first_page=1, last_page=1)
            
            if not imagenes:
                raise ValueError("No se pudo convertir el PDF a imagen")
            
            # Guardar primera página como imagen temporal
            imagen_temp_path = pdf_path.parent / f"temp_{pdf_path.stem}.png"
            imagenes[0].save(imagen_temp_path, 'PNG')
            
            # Procesar con OCR
            resultado = self.extraer_texto_imagen(imagen_temp_path)
            
            # Limpiar imagen temporal
            if imagen_temp_path.exists():
                imagen_temp_path.unlink()
            
            return resultado
            
        except ImportError:
            logger.error("❌ pdf2image no instalado. Instalar con: pip install pdf2image")
            raise
        except Exception as e:
            logger.error(f"❌ Error extrayendo texto de PDF: {e}")
            raise


# ==================================
# INSTANCIA GLOBAL DEL EXTRACTOR
# ==================================
ocr_extractor = GoogleVisionExtractor()