import api from './api';

export const ocrService = {
  /**
   * Procesa un documento con OCR
   * @param {File} archivo - Archivo de imagen/PDF
   * @param {number} empresaId - ID de la empresa emisora (opcional)
   * @param {number} tipoDocumentoId - ID del tipo de documento (1=FACTURA, 2=GUIA, 3=ORDEN)
   * @returns {Promise}
   */
  async procesarDocumento(archivo, empresaId = null, tipoDocumentoId = 1) {
    const formData = new FormData();
    formData.append('file', archivo);
    
    if (empresaId) {
      formData.append('empresa_id', empresaId);
    }
    
    formData.append('tipo_documento_id', tipoDocumentoId);

    const response = await api.post('/ocr/procesar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Reprocesa un documento existente
   * @param {number} documentoId
   * @returns {Promise}
   */
  async reprocesarDocumento(documentoId) {
    const response = await api.post(`/ocr/${documentoId}/reprocesar`);
    return response.data;
  },

  /**
   * Elimina un documento
   * @param {number} documentoId - ID del documento a eliminar
   * @returns {Promise}
   */
  async eliminarDocumento(documentoId) {
    const response = await api.delete(`/documentos/${documentoId}`);
    return response.data;
  },

  // Alias para compatibilidad
  procesarFactura(archivo, empresaId = null) {
    return this.procesarDocumento(archivo, empresaId, 1);
  },

  reprocesarFactura(documentoId) {
    return this.reprocesarDocumento(documentoId);
  },
};