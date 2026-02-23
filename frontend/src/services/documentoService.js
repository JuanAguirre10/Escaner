import api from './api';

export const documentoService = {
  /**
   * Obtiene todos los documentos con filtros
   */
  async listar(params = {}) {
    const response = await api.get('/documentos/', { params });
    return response.data;
  },

  /**
   * Obtiene un documento por ID
   */
  async obtener(id) {
    const response = await api.get(`/documentos/${id}`);
    return response.data;
  },

  /**
   * Obtiene un documento por UUID
   */
  async obtenerPorUuid(uuid) {
    const response = await api.get(`/documentos/uuid/${uuid}`);
    return response.data;
  },

  /**
   * Actualiza un documento
   */
  async actualizar(id, data) {
    const response = await api.put(`/documentos/${id}`, data);
    return response.data;
  },

  /**
   * Valida un documento
   */
  async validar(id) {
    const response = await api.post(`/documentos/${id}/validar`);
    return response.data;
  },

  /**
   * Rechaza un documento
   */
  async rechazar(id, motivo) {
    const response = await api.post(`/documentos/${id}/rechazar`, null, {
      params: { motivo }
    });
    return response.data;
  },

  /**
   * Elimina un documento
   */
  async eliminar(id) {
    const response = await api.delete(`/documentos/${id}`);
    return response.data;
  },

  /**
   * Obtiene estadísticas generales
   */
  /**
   * Obtiene estadísticas generales
   */
  async estadisticas() {
    const response = await api.get('/documentos/stats/resumen');
    return response.data;
  },

  /**
   * Obtiene items de un documento
   */
  async obtenerItems(id) {
    const response = await api.get(`/documentos/${id}/items`);
    return response.data;
  },
  
  /**
   * Actualiza un item de documento
   */
  async actualizarItem(itemId, data) {
    const response = await api.put(`/documentos/items/${itemId}`, data);
    return response.data;
  },

  /**
   * Valida un documento
   */
  async validar(id) {
    const response = await api.post(`/documentos/${id}/validar`);
    return response.data;
  },

  /**
   * Rechaza un documento
   */
  async rechazar(id, motivo) {
    const response = await api.post(`/documentos/${id}/rechazar`, null, {
      params: { motivo }
    });
    return response.data;
  },
  
  /**
   * Obtiene datos específicos de orden de compra
   */
  async obtenerOrdenCompra(documentoId) {
    const response = await api.get(`/documentos/${documentoId}/orden-compra`);
    return response.data;
  },

  /**
   * Actualiza datos de orden de compra
   */
  async actualizarOrdenCompra(documentoId, data) {
    const response = await api.put(`/documentos/${documentoId}/orden-compra`, data);
    return response.data;
  },

  /**
   * Lista documentos pendientes de validación
   */
  async listarPendientes() {
    const response = await api.get('/documentos/', {
      params: {
        estado: 'pendiente_validacion'
      }
    });
    return response.data;
  },

  
};

// Alias para compatibilidad con código existente
export const facturaService = documentoService;