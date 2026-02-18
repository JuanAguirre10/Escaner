import api from './api';

export const tipoDocumentoService = {
  /**
   * Lista todos los tipos de documento
   */
  async listar(soloActivos = true) {
    const response = await api.get('/tipos-documento/', {
      params: { solo_activos: soloActivos }
    });
    return response.data;
  },

  /**
   * Obtiene un tipo de documento por ID
   */
  async obtener(id) {
    const response = await api.get(`/tipos-documento/${id}`);
    return response.data;
  },

  /**
   * Obtiene un tipo de documento por código
   */
  async obtenerPorCodigo(codigo) {
    const response = await api.get(`/tipos-documento/codigo/${codigo}`);
    return response.data;
  },
};