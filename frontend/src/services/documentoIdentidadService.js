import api from './api';

const documentoIdentidadService = {
  async procesar(formData) {
    const response = await api.post('/documentos-identidad/procesar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async listarPorExpediente(expedienteId) {
    const response = await api.get(`/documentos-identidad/expediente/${expedienteId}`);
    return response.data;
  },

  async obtener(id) {
    const response = await api.get(`/documentos-identidad/${id}`);
    return response.data;
  },

  async actualizar(id, data) {
    const response = await api.put(`/documentos-identidad/${id}`, data);
    return response.data;
  },

  async eliminar(id) {
    const response = await api.delete(`/documentos-identidad/${id}`);
    return response.data;
  }
};

export default documentoIdentidadService;