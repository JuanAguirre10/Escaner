import api from './api';

export const ocrService = {
  /**
   * Procesa una factura con OCR
   * @param {File} archivo - Archivo de imagen/PDF
   * @returns {Promise}
   */
  async procesarFactura(archivo) {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await api.post('/ocr/procesar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Reprocesa una factura existente
   * @param {number} facturaId
   * @returns {Promise}
   */
  async reprocesarFactura(facturaId) {
    const response = await api.post(`/ocr/reprocesar/${facturaId}`);
    return response.data;
  },
};