import { useState, useEffect } from 'react';
import { Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Input, Button } from './common';
import { notaEntregaService, expedienteService } from '../services';

export default function NotaEntregaForm({ expediente, empresa, onSuccess }) {
  const [formData, setFormData] = useState({
    numero_nota: '',
    fecha_recepcion: new Date().toISOString().split('T')[0],
    recibido_por: '',
    estado_mercaderia: 'conforme',
    observaciones: '',
    orden_compra_numero: expediente.numero_orden_compra,
    factura_numero: '',
    guia_numero: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarDatosExpediente();
  }, [expediente]);

  const cargarDatosExpediente = async () => {
    try {
      // Obtener expediente completo con documentos
      const expCompleto = await expedienteService.obtener(expediente.id);
      
      // Generar número de nota: NE-{numero_orden}
      const numeroNota = `NE-${expCompleto.numero_orden_compra}`;
      
      // Buscar factura (tipo_documento_id = 1)
      const factura = expCompleto.documentos?.find(d => d.tipo_documento_id === 1);
      
      // Buscar guía (tipo_documento_id = 2)
      const guia = expCompleto.documentos?.find(d => d.tipo_documento_id === 2);
      
      setFormData(prev => ({
        ...prev,
        numero_nota: numeroNota,
        factura_numero: factura?.numero_documento || '',
        guia_numero: guia?.numero_documento || ''
      }));
      
      console.log('📋 Datos autocargados:', {
        numeroNota,
        factura: factura?.numero_documento,
        guia: guia?.numero_documento
      });
    } catch (error) {
      console.error('Error cargando datos del expediente:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.numero_nota || !formData.fecha_recepcion) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      
      // Crear nota
      await notaEntregaService.crear({
        ...formData,
        expediente_id: expediente.id
      });

      // Verificar completitud del expediente
      const estadoExpediente = await expedienteService.verificarCompletitud(expediente.id);
      
      if (estadoExpediente.completo) {
        toast.success('🎉 ¡Expediente completo! Se movió a Lista de Expedientes.');
      } else {
        toast.success('✅ Nota de entrega creada correctamente');
      }
      
      // Resetear formulario
      const expCompleto = await expedienteService.obtener(expediente.id);
      const numeroNota = `NE-${expCompleto.numero_orden_compra}`;
      const factura = expCompleto.documentos?.find(d => d.tipo_documento_id === 1);
      const guia = expCompleto.documentos?.find(d => d.tipo_documento_id === 2);
      
      setFormData({
        numero_nota: numeroNota,
        fecha_recepcion: new Date().toISOString().split('T')[0],
        recibido_por: '',
        estado_mercaderia: 'conforme',
        observaciones: '',
        orden_compra_numero: expediente.numero_orden_compra,
        factura_numero: factura?.numero_documento || '',
        guia_numero: guia?.numero_documento || ''
      });

      if (onSuccess) {
        // Recargar expediente para mostrar la nueva nota
        onSuccess(expediente.id);
      }
    } catch (error) {
      console.error('Error creando nota:', error);
      toast.error(error.response?.data?.detail || 'Error al crear la nota de entrega');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerta Informativa */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 shrink-0 mt-0.5" size={24} />
          <div>
            <p className="font-semibold text-blue-900">Nota de Entrega - Registro Manual</p>
            <p className="text-sm text-blue-700 mt-1">
              Este documento se completa manualmente para confirmar la recepción de mercadería.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Expediente:</strong> {expediente.codigo_expediente}
            </p>
          </div>
        </div>
      </div>

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
            disabled
            className="bg-gray-100"
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

      {/* Referencias */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-green-600" size={24} />
          <h3 className="text-lg font-semibold">Referencias del Expediente</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="N° Orden de Compra"
            value={formData.orden_compra_numero}
            disabled
            className="bg-gray-100"
          />
          
          <Input
            label="N° Factura"
            value={formData.factura_numero}
            onChange={(e) => handleChange('factura_numero', e.target.value)}
            placeholder="F001-12345"
            disabled
            className="bg-gray-100"
          />
          
          <Input
            label="N° Guía de Remisión"
            value={formData.guia_numero}
            onChange={(e) => handleChange('guia_numero', e.target.value)}
            placeholder="T001-6789"
            disabled
            className="bg-gray-100"
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
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="success"
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save size={20} />
          {saving ? 'Guardando...' : 'Guardar Nota de Entrega'}
        </Button>
      </div>
    </form>
  );
}