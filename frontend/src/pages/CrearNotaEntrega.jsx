import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Loading } from '../components/common';
import { notaEntregaService, documentoService } from '../services';

export default function CrearNotaEntrega() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [busquedaOC, setBusquedaOC] = useState('');
  const [sugerenciasOC, setSugerenciasOC] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscando, setBuscando] = useState(false);
  
  const [formData, setFormData] = useState({
    numero_nota: '',
    fecha_recepcion: new Date().toISOString().split('T')[0],
    recibido_por: '',
    estado_mercaderia: 'conforme',
    observaciones: '',
    orden_compra_numero: '',
    factura_numero: '',
    guia_numero: ''
  });

  const buscarOrdenesCompra = async (texto) => {
    if (texto.length < 3) {
      setSugerenciasOC([]);
      setMostrarSugerencias(false);
      return;
    }

    try {
      setBuscando(true);
      const docs = await documentoService.listar({
        tipo_documento_id: 3, // Orden de Compra
        buscar: texto,
        estado: 'validada'
      });
      setSugerenciasOC(docs);
      setMostrarSugerencias(docs.length > 0);
    } catch (error) {
      console.error('Error buscando órdenes:', error);
      setSugerenciasOC([]);
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarOrden = (orden) => {
    setFormData({
      ...formData,
      orden_compra_numero: orden.numero_documento
    });
    setBusquedaOC(orden.numero_documento);
    setSugerenciasOC([]);
    setMostrarSugerencias(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.numero_nota || !formData.fecha_recepcion || !formData.orden_compra_numero) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      await notaEntregaService.crear(formData);
      toast.success('Nota de entrega creada correctamente');
      navigate('/notas-entrega');
    } catch (error) {
      console.error('Error creando nota:', error);
      toast.error(error.response?.data?.detail || 'Error al crear la nota de entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/notas-entrega')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Nota de Entrega</h1>
          <p className="text-gray-600 mt-1">Registra la recepción de mercadería</p>
        </div>
      </div>

      {/* Alerta Informativa */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={24} />
          <div>
            <p className="font-semibold text-blue-900">Nota de Entrega - Registro Manual</p>
            <p className="text-sm text-blue-700 mt-1">
              Este documento se crea manualmente para confirmar la recepción de mercadería. 
              Debe estar asociado a una <strong>Orden de Compra validada</strong>.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>No se suben archivos</strong> - toda la información se ingresa directamente en el formulario.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la Nota */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold">Información de la Nota</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número de Nota *"
              value={formData.numero_nota}
              onChange={(e) => handleChange('numero_nota', e.target.value)}
              placeholder="NE-001"
              required
            />
            
            <Input
              label="Fecha de Recepción *"
              type="date"
              value={formData.fecha_recepcion}
              onChange={(e) => handleChange('fecha_recepcion', e.target.value)}
              required
            />
            
            <Input
              label="Recibido Por"
              value={formData.recibido_por}
              onChange={(e) => handleChange('recibido_por', e.target.value)}
              placeholder="Nombre de quien recibe"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Mercadería *
              </label>
              <select
                value={formData.estado_mercaderia}
                onChange={(e) => handleChange('estado_mercaderia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="conforme">Conforme</option>
                <option value="no_conforme">No Conforme</option>
                <option value="parcial">Parcial</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Referencias a Documentos del Expediente */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold">Referencias del Expediente</h3>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="N° Orden de Compra *"
                value={busquedaOC || formData.orden_compra_numero}
                onChange={(e) => {
                  const valor = e.target.value;
                  setBusquedaOC(valor);
                  handleChange('orden_compra_numero', valor);
                  buscarOrdenesCompra(valor);
                }}
                placeholder="Buscar por número de OC (ej: 0001-68688)..."
                required
              />

              {/* Indicador de búsqueda */}
              {buscando && (
                <div className="absolute right-3 top-9">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Sugerencias de OC */}
              {mostrarSugerencias && sugerenciasOC.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                  {sugerenciasOC.map((orden) => (
                    <button
                      key={orden.id}
                      type="button"
                      onClick={() => seleccionarOrden(orden)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base">
                            OC: {orden.numero_documento}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Proveedor: {orden.razon_social_cliente}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            RUC: {orden.ruc_cliente}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {orden.moneda} {parseFloat(orden.total || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(orden.fecha_emision).toLocaleDateString('es-PE')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Sin resultados */}
              {!buscando && mostrarSugerencias && sugerenciasOC.length === 0 && busquedaOC.length >= 3 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
                  <p className="text-sm text-gray-500">
                    No se encontraron órdenes de compra validadas con "{busquedaOC}"
                  </p>
                </div>
              )}
            </div>

            {busquedaOC.length < 3 && (
              <p className="text-sm text-gray-500 italic">
                Escribe al menos 3 caracteres para buscar órdenes de compra
              </p>
            )}
            
            <Input
              label="N° Factura (Opcional)"
              value={formData.factura_numero}
              onChange={(e) => handleChange('factura_numero', e.target.value)}
              placeholder="F001-12345"
            />
            
            <Input
              label="N° Guía de Remisión (Opcional)"
              value={formData.guia_numero}
              onChange={(e) => handleChange('guia_numero', e.target.value)}
              placeholder="T001-6789"
            />
          </div>
        </Card>

        {/* Observaciones */}
        <Card title="Observaciones">
          <textarea
            value={formData.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            rows={4}
            placeholder="Observaciones sobre la recepción de mercadería..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Card>

        {/* Botones */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/notas-entrega')}
            disabled={loading}
          >
            <ArrowLeft size={20} />
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="success"
            disabled={loading || !formData.orden_compra_numero}
          >
            <Save size={20} />
            {loading ? 'Creando...' : 'Crear Nota de Entrega'}
          </Button>
        </div>
      </form>

      {loading && <Loading fullScreen />}
    </div>
  );
}