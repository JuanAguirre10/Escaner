import api from './api';

export const proveedorService = {
  /**
   * Lista todos los proveedores
   */
  async listar(params = {}) {
    const response = await api.get('/proveedores/', { params });
    return response.data;
  },

  /**
   * Busca un proveedor por RUC
   */
  async buscarPorRuc(ruc) {
    const response = await api.get(`/proveedores/buscar/${ruc}`);
    return response.data;
  },

  /**
   * Obtiene un proveedor por ID
   */
  async obtener(id) {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo proveedor
   */
  async crear(data) {
    const response = await api.post('/proveedores/', data);
    return response.data;
  },

  /**
   * Actualiza un proveedor
   */
  async actualizar(id, data) {
    const response = await api.put(`/proveedores/${id}`, data);
    return response.data;
  },

  /**
   * Obtiene facturas de un proveedor
   */
  async obtenerFacturas(id, params = {}) {
    const response = await api.get(`/proveedores/${id}/facturas`, { params });
    return response.data;
  },

  /**
   * Obtiene estadísticas de un proveedor
   */
  async estadisticas(id) {
    const response = await api.get(`/proveedores/${id}/estadisticas`);
    return response.data;
  },
};