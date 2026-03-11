import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, X, CheckCircle, AlertCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Loading } from '../components/common';
import { documentoService } from '../services';
import { formatDate, getEstadoColor, formatEstado } from '../utils/formatters';

export default function ValidarOrdenCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documento, setDocumento] = useState(null);
  const [items, setItems] = useState([]);
  
  const [formData, setFormData] = useState({
    numero_documento: '',
    serie: '',
    fecha_emision: '',
    fecha_entrega: '',
    ruc_emisor: '',
    razon_social_emisor: '',
    direccion_emisor: '',
    telefono_emisor: '',
    ruc_cliente: '',
    razon_social_cliente: '',
    direccion_cliente: '',
    direccion_entrega: '',
    modo_pago: '',
    moneda: 'PEN',
    subtotal: 0,
    igv: 0,
    total: 0,
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const doc = await documentoService.obtener(id);
      setDocumento(doc);

      const ocData = doc.datos_orden_compra || await documentoService.obtenerOrdenCompra(id);

      setFormData({
        numero_documento: doc.numero_documento || '',
        serie: doc.serie || '',
        fecha_emision: doc.fecha_emision?.split('T')[0] || '',
        fecha_entrega: ocData?.fecha_entrega?.split('T')[0] || '',
        ruc_emisor: doc.ruc_emisor || '',
        razon_social_emisor: doc.razon_social_emisor || '',
        direccion_emisor: doc.direccion_emisor || '',
        telefono_emisor: doc.telefono_emisor || '',
        ruc_cliente: doc.ruc_cliente || '',
        razon_social_cliente: doc.razon_social_cliente || '',
        direccion_cliente: doc.direccion_cliente || '',
        direccion_entrega: ocData?.direccion_entrega || '',
        modo_pago: ocData?.modo_pago || '',
        moneda: doc.moneda || 'PEN',
        subtotal: doc.subtotal || 0,
        igv: doc.igv || 0,
        total: doc.total || 0,
        observaciones: doc.observaciones || ''
      });

      const itemsData = await documentoService.obtenerItems(id);
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar la orden de compra');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      await documentoService.actualizar(id, {
        numero_documento: formData.numero_documento,
        serie: formData.serie,
        fecha_emision: formData.fecha_emision,
        ruc_emisor: formData.ruc_emisor,
        razon_social_emisor: formData.razon_social_emisor,
        direccion_emisor: formData.direccion_emisor,
        telefono_emisor: formData.telefono_emisor,
        ruc_cliente: formData.ruc_cliente,
        razon_social_cliente: formData.razon_social_cliente,
        direccion_cliente: formData.direccion_cliente,
        moneda: formData.moneda,
        subtotal: formData.subtotal,
        igv: formData.igv,
        total: formData.total,
        observaciones: formData.observaciones
      });

      await documentoService.actualizarOrdenCompra(id, {
        fecha_entrega: formData.fecha_entrega,
        direccion_entrega: formData.direccion_entrega,
        modo_pago: formData.modo_pago
      });

      for (const item of items) {
        await documentoService.actualizarItem(item.id, {
          codigo_producto: item.codigo_producto,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          unidad_medida: item.unidad_medida,
          precio_unitario: item.precio_unitario,
          valor_total: item.valor_total
        });
      }

      toast.success('Orden de compra actualizada correctamente');
      
      if (location.state?.empresaId && location.state?.expedienteId) {
        navigate('/upload', {
          state: {
            empresaId: location.state.empresaId,
            expedienteId: location.state.expedienteId
          }
        });
      } else {
        navigate('/facturas');
      }
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleValidar = async () => {
    try {
      setSaving(true);
      await documentoService.validar(id);
      toast.success('✅ Orden de compra validada correctamente');
      
      if (location.state?.empresaId && location.state?.expedienteId) {
        navigate('/upload', {
          state: {
            empresaId: location.state.empresaId,
            expedienteId: location.state.expedienteId
          }
        });
      } else {
        navigate('/facturas');
      }
    } catch (error) {
      console.error('Error validando:', error);
      toast.error(error.response?.data?.detail || 'Error al validar la orden de compra');
    } finally {
      setSaving(false);
    }
  };

  const handleRechazar = async () => {
    const motivo = prompt('Ingresa el motivo del rechazo:');
    
    if (!motivo || motivo.trim().length < 10) {
      toast.error('Debes proporcionar un motivo válido (mínimo 10 caracteres)');
      return;
    }

    try {
      setSaving(true);
      await documentoService.rechazar(id, motivo);
      toast.success('Orden de compra rechazada');
      
      if (location.state?.empresaId && location.state?.expedienteId) {
        navigate('/upload', {
          state: {
            empresaId: location.state.empresaId,
            expedienteId: location.state.expedienteId
          }
        });
      } else {
        navigate('/facturas');
      }
    } catch (error) {
      console.error('Error rechazando:', error);
      toast.error(error.response?.data?.detail || 'Error al rechazar la orden de compra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!documento) return <div className="text-center py-12 px-4">Orden de compra no encontrada</div>;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pt-4 sm:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Validar Orden de Compra</h1>
            <p className="text-xs sm:text-base text-gray-600 mt-1">
              Revisa y corrige los datos extraídos por OCR
            </p>
          </div>
        </div>

        <div className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base shrink-0 ${
          documento.estado === 'validada' 
            ? 'bg-green-100 text-green-800'
            : documento.estado === 'rechazada'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {formatEstado(documento.estado)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Información de la Orden */}
        <Card title="Información de la Orden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Número de Orden de Compra"
              value={formData.numero_documento}
              onChange={(e) => handleChange('numero_documento', e.target.value)}
              required
            />
            <Input
              label="Serie"
              value={formData.serie}
              onChange={(e) => handleChange('serie', e.target.value)}
            />
            <Input
              label="Fecha de Emisión"
              type="date"
              value={formData.fecha_emision}
              onChange={(e) => handleChange('fecha_emision', e.target.value)}
              required
            />
            <Input
              label="Fecha de Entrega"
              type="date"
              value={formData.fecha_entrega}
              onChange={(e) => handleChange('fecha_entrega', e.target.value)}
            />
            <Input
              label="Moneda"
              value={formData.moneda}
              onChange={(e) => handleChange('moneda', e.target.value)}
            />
            <Input
              label="Modo de Pago"
              value={formData.modo_pago}
              onChange={(e) => handleChange('modo_pago', e.target.value)}
              placeholder="Ej: FACTURA 07 DIAS"
            />
          </div>
        </Card>

        {/* Datos del Comprador */}
        <Card title="Datos del Comprador">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="RUC del Comprador"
              value={formData.ruc_emisor}
              onChange={(e) => handleChange('ruc_emisor', e.target.value)}
              maxLength={11}
              required
            />
            <Input
              label="Razón Social del Comprador"
              value={formData.razon_social_emisor}
              onChange={(e) => handleChange('razon_social_emisor', e.target.value)}
              required
            />
            <Input
              label="Dirección del Comprador"
              value={formData.direccion_emisor}
              onChange={(e) => handleChange('direccion_emisor', e.target.value)}
            />
            <Input
              label="Teléfono del Comprador"
              value={formData.telefono_emisor}
              onChange={(e) => handleChange('telefono_emisor', e.target.value)}
            />
          </div>
        </Card>

        {/* Datos del Proveedor */}
        <Card title="Datos del Proveedor">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="RUC del Proveedor"
              value={formData.ruc_cliente}
              onChange={(e) => handleChange('ruc_cliente', e.target.value)}
              maxLength={11}
              required
            />
            <Input
              label="Razón Social del Proveedor"
              value={formData.razon_social_cliente}
              onChange={(e) => handleChange('razon_social_cliente', e.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Dirección del Proveedor"
                value={formData.direccion_cliente}
                onChange={(e) => handleChange('direccion_cliente', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Dirección de Entrega */}
        <Card title="Dirección de Entrega">
          <Input
            label="Dirección de Entrega de la Mercadería"
            value={formData.direccion_entrega}
            onChange={(e) => handleChange('direccion_entrega', e.target.value)}
            placeholder="Ej: Av. Elmer Faucett 5104, Callao"
          />
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <Package className="text-blue-600" size={20} />
            <h3 className="text-base sm:text-lg font-semibold">Items de la Orden ({items.length})</h3>
          </div>

          {/* Cards móvil */}
          <div className="block lg:hidden space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">Item #{index + 1}</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Código</label>
                    <input
                      type="text"
                      value={item.codigo_producto || ''}
                      onChange={(e) => handleItemChange(index, 'codigo_producto', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-600">Descripción</label>
                    <input
                      type="text"
                      value={item.descripcion || ''}
                      onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Cantidad</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.cantidad || ''}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-600">Unidad</label>
                      <input
                        type="text"
                        value={item.unidad_medida || ''}
                        onChange={(e) => handleItemChange(index, 'unidad_medida', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-600">P. Unit.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.precio_unitario || ''}
                        onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-gray-600">Importe</p>
                    <p className="text-base font-bold text-gray-900">S/ {parseFloat(item.valor_total || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importe</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.codigo_producto || ''}
                        onChange={(e) => handleItemChange(index, 'codigo_producto', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.descripcion || ''}
                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.cantidad || ''}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.unidad_medida || ''}
                        onChange={(e) => handleItemChange(index, 'unidad_medida', e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.precio_unitario || ''}
                        onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      S/ {parseFloat(item.valor_total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="6" className="px-4 py-3 text-right font-medium text-sm">Total de items:</td>
                  <td className="px-4 py-3 font-bold text-sm">{items.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Totales */}
        <Card title="Totales">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Input
              label="Subtotal"
              type="number"
              step="0.01"
              value={formData.subtotal}
              onChange={(e) => handleChange('subtotal', parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="IGV (18%)"
              type="number"
              step="0.01"
              value={formData.igv}
              onChange={(e) => handleChange('igv', parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Total"
              type="number"
              step="0.01"
              value={formData.total}
              onChange={(e) => handleChange('total', parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        </Card>

        {/* Observaciones */}
        <Card title="Observaciones">
          <textarea
            value={formData.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Observaciones adicionales..."
          />
        </Card>

        {/* Botones de Acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            <X size={18} />
            Cancelar
          </Button>

          {documento.estado === 'pendiente_validacion' && (
            <>
              <Button
                type="button"
                variant="danger"
                fullWidth
                onClick={handleRechazar}
                disabled={saving}
              >
                <AlertCircle size={18} />
                Rechazar
              </Button>

              <Button
                type="submit"
                variant="secondary"
                fullWidth
                disabled={saving}
              >
                <Save size={18} />
                <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                <span className="sm:hidden">{saving ? 'Guardando...' : 'Guardar'}</span>
              </Button>

              <Button
                type="button"
                variant="success"
                fullWidth
                onClick={handleValidar}
                disabled={saving}
              >
                <CheckCircle size={18} />
                Validar
              </Button>
            </>
          )}

          {documento.estado === 'validada' && (
            <Button
              type="submit"
              variant="secondary"
              fullWidth
              disabled={saving}
              className="sm:col-span-2 lg:col-span-4"
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </div>
      </form>

      {saving && <Loading fullScreen />}
    </div>
  );
}