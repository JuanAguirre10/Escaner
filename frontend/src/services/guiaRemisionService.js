/**
 * Servicio para gestionar guías de remisión
 */

import api from './api';

const guiaRemisionService = {
  /**
   * Obtener guía de remisión por ID de documento
   */
  obtenerPorDocumento: async (documentoId) => {
    try {
      const response = await api.get(`/guias-remision/${documentoId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No existe guía para este documento
      }
      throw error;
    }
  },

  /**
   * Actualizar datos de guía de remisión
   */
  actualizar: async (documentoId, datos) => {
    const response = await api.put(`/guias-remision/${documentoId}`, datos);
    return response.data;
  },
};

export default guiaRemisionService;