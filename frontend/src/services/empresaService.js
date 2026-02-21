import api from './api';

export const empresaService = {
  /**
   * Valida un RUC y retorna la empresa si existe
   */
  async validarRuc(ruc) {
    const response = await api.post('/empresas/validar-ruc', { ruc });
    return response.data;
  },

  /**
   * Lista todas las empresas
   */
  async listar(params = {}) {
    const response = await api.get('/empresas/', { params });
    return response.data;
  },

  /**
   * Busca empresas por texto
   */
  async buscar(texto) {
    const response = await api.get('/empresas/buscar', { 
      params: { q: texto } 
    });
    return response.data;
  },

  /**
   * Obtiene una empresa por ID
   */
  async obtener(id) {
    const response = await api.get(`/empresas/${id}`);
    return response.data;
  },

  /**
   * Obtiene una empresa por RUC
   */
  async obtenerPorRuc(ruc) {
    const response = await api.get(`/empresas/ruc/${ruc}`);
    return response.data;
  },

  /**
   * Crea una nueva empresa
   */
  async crear(data) {
    const response = await api.post('/empresas/', data);
    return response.data;
  },

  /**
   * Actualiza una empresa
   */
  async actualizar(id, data) {
    const response = await api.put(`/empresas/${id}`, data);
    return response.data;
  },

  /**
   * Elimina una empresa
   */
  async eliminar(id) {
    const response = await api.delete(`/empresas/${id}`);
    return response.data;
  },

  
};

