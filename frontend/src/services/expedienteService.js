import api from './api';

export const expedienteService = {
  /**
   * Lista todos los expedientes con filtros
   */
  async listar(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Agregar todos los parámetros
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/expedientes?${queryString}` : '/expedientes';
    
    const response = await api.get(url);
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
   * Obtiene un expediente por código
   */
  async obtenerPorCodigo(codigo) {
    const response = await api.get(`/expedientes/codigo/${codigo}`);
    return response.data;
  },

  /**
   * Obtiene un expediente por número de orden
   */
  async obtenerPorOrden(numeroOrden) {
    const response = await api.get(`/expedientes/orden/${numeroOrden}`);
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
   * Crea un expediente
   */
  async crear(data) {
    const response = await api.post('/expedientes/', data);
    return response.data;
  },

  /**
   * Actualiza un expediente
   */
  async actualizar(id, data) {
    const response = await api.put(`/expedientes/${id}`, data);
    return response.data;
  },

  /**
   * Actualiza expediente desde OC
   */
  async actualizarDesdeOC(id, numeroOrden) {
    const response = await api.put(`/expedientes/${id}/actualizar-desde-oc`, null, {
      params: { numero_orden: numeroOrden }
    });
    return response.data;
  },

  /**
   * Asocia un documento a un expediente
   */
  async asociarDocumento(expedienteId, documentoId) {
    const response = await api.post(`/expedientes/${expedienteId}/asociar-documento/${documentoId}`);
    return response.data;
  },

  /**
   * Verifica y actualiza estado de completitud
   */
  async verificarCompletitud(id) {
    const response = await api.post(`/expedientes/${id}/verificar-completitud`);
    return response.data;
  },

  /**
   * Obtiene el estado de un expediente
   */
  async obtenerEstado(id) {
    const response = await api.get(`/expedientes/${id}/estado`);
    return response.data;
  },

  /**
   * Elimina un expediente
   */
  async eliminar(id) {
    const response = await api.delete(`/expedientes/${id}`);
    return response.data;
  },

  /**
   * Descarga un expediente como ZIP
   */
  async descargarZip(id) {
    const response = await api.get(`/expedientes/${id}/descargar-zip`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Cierra un expediente manualmente
   */
  async cerrar(id, motivoCierre) {
    const response = await api.post(`/expedientes/${id}/cerrar`, {
      motivo_cierre: motivoCierre
    });
    return response.data;
  },

  /**
   * Reabre un expediente cerrado manualmente
   */
  async reabrir(id) {
    const response = await api.post(`/expedientes/${id}/reabrir`);
    return response.data;
  },

  async verificarOC(numeroOrden) {
    const response = await api.get(`/expedientes/verificar-oc/${numeroOrden}`);
    return response.data;
  },

  /**
   * Marca/desmarca un tipo de documento como no requerido para el expediente
   */
  async exentarDocumento(expedienteId, tipoDocumentoId, exentar) {
    const response = await api.post(`/expedientes/${expedienteId}/exentar`, {
      tipo_documento_id: tipoDocumentoId,
      exentar: exentar
    });
    return response.data;
  },

};
