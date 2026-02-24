import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Package, FileText, Calendar, User, Upload, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Loading, Badge, Input } from '../components/common';
import { notaEntregaService, expedienteService } from '../services';
import { formatDate } from '../utils/formatters';

export default function VerNotaEntrega() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [nota, setNota] = useState(null);
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // 🆕 Estados para edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formData, setFormData] = useState({
    numero_nota: '',
    fecha_recepcion: '',
    recibido_por: '',
    estado_mercaderia: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarNota();
  }, [id]);

  const cargarNota = async () => {
    try {
      setLoading(true);
      const data = await notaEntregaService.obtener(id);
      setNota(data);
      
      // Inicializar formData con los datos de la nota
      setFormData({
        numero_nota: data.numero_nota || '',
        fecha_recepcion: data.fecha_recepcion?.split('T')[0] || '',
        recibido_por: data.recibido_por || '',
        estado_mercaderia: data.estado_mercaderia || 'conforme',
        observaciones: data.observaciones || ''
      });
      
      // Si tiene expediente_id, cargar el expediente
      if (data.expediente_id) {
        const exp = await expedienteService.obtener(data.expediente_id);
        setExpediente(exp);
      }
    } catch (error) {
      console.error('Error cargando nota:', error);
      toast.error('Error al cargar la nota de entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    setModoEdicion(true);
  };

  const handleCancelar = () => {
    // Restaurar valores originales
    setFormData({
      numero_nota: nota.numero_nota || '',
      fecha_recepcion: nota.fecha_recepcion?.split('T')[0] || '',
      recibido_por: nota.recibido_por || '',
      estado_mercaderia: nota.estado_mercaderia || 'conforme',
      observaciones: nota.observaciones || ''
    });
    setModoEdicion(false);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      
      // Validaciones
      if (!formData.numero_nota.trim()) {
        toast.error('El número de nota es obligatorio');
        return;
      }
      
      if (!formData.fecha_recepcion) {
        toast.error('La fecha de recepción es obligatoria');
        return;
      }

      // Actualizar nota
      await notaEntregaService.actualizar(id, formData);
      
      toast.success('Nota actualizada correctamente');
      setModoEdicion(false);
      
      // Recargar nota
      await cargarNota();
    } catch (error) {
      console.error('Error actualizando nota:', error);
      toast.error('Error al actualizar la nota');
    } finally {
      setGuardando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!nota) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nota de entrega no encontrada</p>
        <button
          onClick={() => navigate('/facturas')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Volver a Documentos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{nota.numero_nota}</h1>
          <p className="text-gray-600 mt-1">Nota de Entrega</p>
          {expediente && (
            <p className="text-sm text-blue-600 mt-1">
              Expediente: {expediente.codigo_expediente}
            </p>
          )}
        </div>
        
        <Badge variant={
          nota.estado_mercaderia === 'conforme' ? 'success' :
          nota.estado_mercaderia === 'no_conforme' ? 'danger' : 'warning'
        }>
          {nota.estado_mercaderia === 'conforme' ? 'Conforme' :
           nota.estado_mercaderia === 'no_conforme' ? 'No Conforme' : 'Parcial'}
        </Badge>

        {/* 🆕 Botones de Edición */}
        {!modoEdicion ? (
          <>
            <button
              onClick={handleEditar}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <Edit2 size={20} />
              Editar
            </button>

            {expediente && (
              <button
                onClick={() => navigate(`/upload?expediente_id=${expediente.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Upload size={20} />
                Agregar Documentos
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleCancelar}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              <X size={20} />
              Cancelar
            </button>
            
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Información General - EDITABLE */}
      <Card title="Información de Recepción">
        <div className="grid grid-cols-2 gap-6">
          {/* Número de Nota */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Número de Nota
            </label>
            {modoEdicion ? (
              <input
                type="text"
                name="numero_nota"
                value={formData.numero_nota}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="N° Nota"
              />
            ) : (
              <p className="font-medium text-lg text-gray-900">{nota.numero_nota}</p>
            )}
          </div>

          {/* Fecha de Recepción */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Fecha de Recepción
            </label>
            {modoEdicion ? (
              <input
                type="date"
                name="fecha_recepcion"
                value={formData.fecha_recepcion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                <p className="font-medium text-lg text-gray-900">
                  {formatDate(nota.fecha_recepcion)}
                </p>
              </div>
            )}
          </div>

          {/* Recibido Por */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Recibido Por
            </label>
            {modoEdicion ? (
              <input
                type="text"
                name="recibido_por"
                value={formData.recibido_por}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre de quien recibió"
              />
            ) : (
              <div className="flex items-center gap-2">
                <User className="text-green-600" size={20} />
                <p className="font-medium text-lg text-gray-900">
                  {nota.recibido_por || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Estado de Mercadería */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Estado de Mercadería
            </label>
            {modoEdicion ? (
              <select
                name="estado_mercaderia"
                value={formData.estado_mercaderia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="conforme">Conforme</option>
                <option value="no_conforme">No Conforme</option>
                <option value="parcial">Parcial</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <ClipboardCheck className="text-purple-600" size={20} />
                <p className="font-medium text-lg text-gray-900">
                  {nota.estado_mercaderia === 'conforme' ? 'Conforme' :
                   nota.estado_mercaderia === 'no_conforme' ? 'No Conforme' : 'Parcial'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Referencias */}
      <Card title="Referencias del Expediente">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Package className="text-blue-600 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">N° Orden de Compra</p>
              <p className="font-medium text-lg">{nota.orden_compra_numero || 'N/A'}</p>
            </div>
          </div>

          {nota.factura_numero && (
            <div className="flex items-start gap-3">
              <FileText className="text-green-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">N° Factura</p>
                <p className="font-medium text-lg">{nota.factura_numero}</p>
              </div>
            </div>
          )}

          {nota.guia_numero && (
            <div className="flex items-start gap-3">
              <FileText className="text-orange-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">N° Guía de Remisión</p>
                <p className="font-medium text-lg">{nota.guia_numero}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Observaciones - EDITABLE */}
      <Card title="Observaciones">
        {modoEdicion ? (
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Observaciones adicionales..."
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {nota.observaciones || 'Sin observaciones'}
          </p>
        )}
      </Card>

      {/* Información del Expediente */}
      {expediente && (
        <Card title="Expediente Asociado">
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="text-blue-600" size={24} />
              <div>
                <p className="font-medium text-blue-900">{expediente.codigo_expediente}</p>
                <p className="text-sm text-blue-700">OC: {expediente.numero_orden_compra}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Estado: {expediente.estado === 'completo' ? '✓ Completo' : 
                           expediente.estado === 'en_proceso' ? '⏳ En Proceso' : '⚠ Incompleto'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/expedientes/${expediente.id}`)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
            >
              Ver expediente completo →
            </button>
          </div>
        </Card>
      )}

      {/* Información de Registro */}
      <Card title="Información de Registro">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Creado por</p>
            <p className="font-medium">{nota.created_by || 'admin'}</p>
          </div>
          {nota.created_at && (
            <div>
              <p className="text-gray-600">Fecha de creación</p>
              <p className="font-medium">{formatDate(nota.created_at)}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}