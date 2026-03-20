import { useState, useEffect } from 'react';
import { Save, FileText, User } from 'lucide-react';
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
    guia_numero: '',
    visitante_nombre: '',
    visitante_dni: '',
    visitante_empresa: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarDatosExpediente();
  }, [expediente]);

  const cargarDatosExpediente = async () => {
    try {
      const expCompleto = await expedienteService.obtener(expediente.id);

      const numeroNota = `NE-${expCompleto.numero_orden_compra}`;

      const factura = expCompleto.documentos?.find(d => d.tipo_documento_id === 1 || d.tipo_documento_id === 6);
      const guia = expCompleto.documentos?.find(d => d.tipo_documento_id === 2);

      // Último documento de identidad registrado
      const identidades = expCompleto.documentos_identidad || [];
      const ultimoDoc = identidades[identidades.length - 1] || null;
      const nombreVisitante = ultimoDoc
        ? (ultimoDoc.nombres && ultimoDoc.apellidos
            ? `${ultimoDoc.nombres} ${ultimoDoc.apellidos}`
            : ultimoDoc.nombre_completo || '')
        : '';
      const dniVisitante = ultimoDoc?.numero_documento || '';

      setFormData(prev => ({
        ...prev,
        numero_nota: numeroNota,
        factura_numero: factura?.numero_documento || '',
        guia_numero: guia?.numero_documento || '',
        visitante_nombre: nombreVisitante,
        visitante_dni: dniVisitante,
        visitante_empresa: empresa?.razon_social || '',
      }));

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

    if (!formData.visitante_nombre || !formData.visitante_dni) {
      toast.error('Ingresa el nombre y DNI del visitante');
      return;
    }

    try {
      setSaving(true);
      
      await notaEntregaService.crear({
        ...formData,
        expediente_id: expediente.id
      });

      const estadoExpediente = await expedienteService.verificarCompletitud(expediente.id);
      
      if (estadoExpediente.completo) {
        toast.success('🎉 ¡Expediente completo! Se movió a Lista de Expedientes.');
      } else {
        toast.success('✅ Nota de entrega creada correctamente');
      }
      
      setFormData(prev => ({
        ...prev,
        fecha_recepcion: new Date().toISOString().split('T')[0],
        recibido_por: '',
        estado_mercaderia: 'conforme',
        observaciones: '',
      }));

      if (onSuccess) {
        onSuccess(expediente.id);
      }

      // Recarga datos frescos (incluye nuevo doc de identidad si fue subido)
      await cargarDatosExpediente();
    } catch (error) {
      console.error('Error creando nota:', error);
      toast.error(error.response?.data?.detail || 'Error al crear la nota de entrega');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Alerta Informativa */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <FileText className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-blue-900 text-sm sm:text-base">Nota de Entrega - Registro Manual</p>
            <p className="text-xs sm:text-sm text-blue-700 mt-1">
              Este documento se completa manualmente para confirmar la recepción de mercadería.
            </p>
            <p className="text-xs sm:text-sm text-blue-700 mt-1 truncate">
              <strong>Expediente:</strong> {expediente.codigo_expediente}
            </p>
          </div>
        </div>
      </div>

      {/* Información de la Nota */}
      <Card>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <FileText className="text-blue-600" size={20} />
          <h3 className="text-base sm:text-lg font-semibold">Información de la Nota</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Número de Nota *"
            value={formData.numero_nota}
            onChange={(e) => handleChange('numero_nota', e.target.value)}
            placeholder="NE-001"
            required
            disabled
            className="bg-gray-100 text-sm"
          />
          
          <Input
            label="Fecha de Recepción *"
            type="date"
            value={formData.fecha_recepcion}
            onChange={(e) => handleChange('fecha_recepcion', e.target.value)}
            required
            className="text-sm"
          />
          
          <Input
            label="Recibido Por"
            value={formData.recibido_por}
            onChange={(e) => handleChange('recibido_por', e.target.value)}
            placeholder="Nombre de quien recibe"
            className="text-sm"
          />
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Estado de Mercadería *
            </label>
            <select
              value={formData.estado_mercaderia}
              onChange={(e) => handleChange('estado_mercaderia', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value="conforme">Conforme</option>
              <option value="no_conforme">No Conforme</option>
              <option value="parcial">Parcial</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Datos del Visitante */}
      <Card>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <User className="text-purple-600" size={20} />
          <h3 className="text-base sm:text-lg font-semibold">Datos del Visitante</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">Pre-rellenado desde el documento de identidad registrado. Edita si el visitante es diferente en esta visita.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Nombre del Visitante *"
            value={formData.visitante_nombre}
            onChange={(e) => handleChange('visitante_nombre', e.target.value)}
            placeholder="Nombre completo"
            className="text-sm"
          />
          <Input
            label="DNI del Visitante *"
            value={formData.visitante_dni}
            onChange={(e) => handleChange('visitante_dni', e.target.value)}
            placeholder="12345678"
            maxLength={8}
            className="text-sm"
          />
          <Input
            label="Empresa del Visitante"
            value={formData.visitante_empresa}
            onChange={(e) => handleChange('visitante_empresa', e.target.value)}
            placeholder="Empresa que representa"
            className="text-sm sm:col-span-2"
          />
        </div>
      </Card>

      {/* Referencias */}
      <Card>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <FileText className="text-green-600" size={20} />
          <h3 className="text-base sm:text-lg font-semibold">Referencias del Expediente</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="N° Orden de Compra"
            value={formData.orden_compra_numero}
            disabled
            className="bg-gray-100 text-sm"
          />
          
          <Input
            label="N° Factura"
            value={formData.factura_numero}
            onChange={(e) => handleChange('factura_numero', e.target.value)}
            placeholder="F001-12345"
            disabled
            className="bg-gray-100 text-sm"
          />
          
          <Input
            label="N° Guía de Remisión"
            value={formData.guia_numero}
            onChange={(e) => handleChange('guia_numero', e.target.value)}
            placeholder="T001-6789"
            disabled
            className="bg-gray-100 text-sm"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </Card>

      {/* Botones */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="success"
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar Nota de Entrega'}
        </Button>
      </div>
    </form>
  );
}