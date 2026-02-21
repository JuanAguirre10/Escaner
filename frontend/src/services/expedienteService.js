import api from './api';

export const expedienteService = {
  /**
   * Lista todos los expedientes
   */
  async listar(params = {}) {
    const response = await api.get('/expedientes/', { params });
    return response.data;
  },

  /**
   * Obtiene un expediente por ID
   */
  async obtener(id) {
    const response = await api.get(`/expedientes/${id}`);
    return response.data;
  },

  /**
   * Obtiene expedientes incompletos de una empresa
   */
  async obtenerIncompletos(empresaId) {
    const response = await api.get(`/expedientes/empresa/${empresaId}/incompletos`);
    return response.data;
  },

  /**
   * Crea un expediente temporal
   */
  async crearTemporal(empresaId) {
    const response = await api.post('/expedientes/crear-temporal', null, {
      params: { empresa_id: empresaId }
    });
    return response.data;
  },

  /**
   * Actualiza expediente desde OC
   */
  async actualizarDesdeOC(expedienteId, numeroOrden) {
    const response = await api.put(`/expedientes/${expedienteId}/actualizar-desde-oc`, null, {
      params: { numero_orden: numeroOrden }
    });
    return response.data;
  },

  /**
   * Verifica completitud del expediente
   */
  async verificarCompletitud(expedienteId) {
    const response = await api.post(`/expedientes/${expedienteId}/verificar-completitud`);
    return response.data;
  },

  /**
   * Asocia documento a expediente
   */
  async asociarDocumento(expedienteId, documentoId) {
    const response = await api.post(`/expedientes/${expedienteId}/asociar-documento/${documentoId}`);
    return response.data;
  },
};