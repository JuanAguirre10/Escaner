import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, X, CheckCircle, AlertCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Loading } from '../components/common';
import { documentoService } from '../services';

export default function ValidarOrdenCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documento, setDocumento] = useState(null);
  const [ordenCompra, setOrdenCompra] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const doc = await documentoService.obtener(id);
      setDocumento(doc);

      // Cargar datos específicos de orden de compra
      const ocData = await documentoService.obtenerOrdenCompra(id);
      setOrdenCompra(ocData);

      // Cargar items
      const itemsData = await documentoService.obtenerItems(id);
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar la orden de compra');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Actualizar documento base
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

      // Actualizar orden de compra específica
      await documentoService.actualizarOrdenCompra(id, {
        fecha_entrega: formData.fecha_entrega,
        direccion_entrega: formData.direccion_entrega,
        modo_pago: formData.modo_pago
      });

      // Actualizar items
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
      
      // Volver a Upload con contexto para seguir subiendo
      navigate('/upload', {
        state: {
          empresaId: documento.empresa_id,
          expedienteId: documento.expediente_id
        }
      });
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
      
      // Volver a Upload con contexto para seguir subiendo
      navigate('/upload', {
        state: {
          empresaId: documento.empresa_id,
          expedienteId: documento.expediente_id
        }
      });
    } catch (error) {
      console.error('Error validando:', error);
      toast.error(error.response?.data?.detail || 'Error al validar la orden de compra');
    } finally {
      setSaving(false);
    }
  };

  const handleRechazar = async () => {
    const motivo = prompt('Ingresa el motivo del rechazo:');
    
    if (!motivo) {
      toast.error('Debes proporcionar un motivo para rechazar');
      return;
    }

    try {
      setSaving(true);
      await documentoService.rechazar(id, motivo);
      toast.success('Orden de compra rechazada');
      
      // Volver a Upload con contexto
      navigate('/upload', {
        state: {
          empresaId: documento.empresa_id,
          expedienteId: documento.expediente_id
        }
      });
    } catch (error) {
      console.error('Error rechazando:', error);
      toast.error(error.response?.data?.detail || 'Error al rechazar la orden de compra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!documento) return <div>Orden de compra no encontrada</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/documentos')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Validar Orden de Compra</h1>
            <p className="text-gray-600 mt-1">
              Revisa y corrige los datos extraídos por OCR
            </p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-lg font-medium ${
          documento.estado === 'validado' 
            ? 'bg-green-100 text-green-800'
            : documento.estado === 'rechazado'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {documento.estado === 'validado' ? 'Validado' : 
           documento.estado === 'rechazado' ? 'Rechazado' : 
           'Pendiente de Validación'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la Orden */}
        <Card title="Información de la Orden">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número de Orden de Compra"
              value={documento.numero_documento || ''}
              onChange={(e) => setDocumento({...documento, numero_documento: e.target.value})}
              required
            />
            <Input
              label="Serie"
              value={documento.serie || ''}
              onChange={(e) => setDocumento({...documento, serie: e.target.value})}
            />
            <Input
              label="Fecha de Emisión"
              type="date"
              value={documento.fecha_emision || ''}
              onChange={(e) => setDocumento({...documento, fecha_emision: e.target.value})}
              required
            />
            <Input
              label="Fecha de Entrega"
              type="date"
              value={ordenCompra?.fecha_entrega || ''}
              onChange={(e) => setOrdenCompra({...ordenCompra, fecha_entrega: e.target.value})}
            />
            <Input
              label="Moneda"
              value={documento.moneda || ''}
              onChange={(e) => setDocumento({...documento, moneda: e.target.value})}
            />
            <Input
              label="Modo de Pago"
              value={ordenCompra?.modo_pago || ''}
              onChange={(e) => setOrdenCompra({...ordenCompra, modo_pago: e.target.value})}
              placeholder="Ej: FACTURA 07 DIAS"
            />
          </div>
        </Card>

        {/* Datos del Comprador (SUPERVAN) */}
        <Card title="Datos del Comprador">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="RUC del Comprador"
              value={documento.ruc_emisor || ''}
              onChange={(e) => setDocumento({...documento, ruc_emisor: e.target.value})}
              maxLength={11}
              required
            />
            <Input
              label="Razón Social del Comprador"
              value={documento.razon_social_emisor || ''}
              onChange={(e) => setDocumento({...documento, razon_social_emisor: e.target.value})}
              required
            />
            <Input
              label="Dirección del Comprador"
              value={documento.direccion_emisor || ''}
              onChange={(e) => setDocumento({...documento, direccion_emisor: e.target.value})}
            />
            <Input
              label="Teléfono del Comprador"
              value={documento.telefono_emisor || ''}
              onChange={(e) => setDocumento({...documento, telefono_emisor: e.target.value})}
            />
          </div>
        </Card>

        {/* Datos del Proveedor */}
        <Card title="Datos del Proveedor">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="RUC del Proveedor"
              value={documento.ruc_cliente || ''}
              onChange={(e) => setDocumento({...documento, ruc_cliente: e.target.value})}
              maxLength={11}
              required
            />
            <Input
              label="Razón Social del Proveedor"
              value={documento.razon_social_cliente || ''}
              onChange={(e) => setDocumento({...documento, razon_social_cliente: e.target.value})}
              required
            />
            <div className="col-span-2">
              <Input
                label="Dirección del Proveedor"
                value={documento.direccion_cliente || ''}
                onChange={(e) => setDocumento({...documento, direccion_cliente: e.target.value})}
              />
            </div>
          </div>
        </Card>

        {/* Dirección de Entrega */}
        <Card title="Dirección de Entrega">
          <Input
            label="Dirección de Entrega de la Mercadería"
            value={ordenCompra?.direccion_entrega || ''}
            onChange={(e) => setOrdenCompra({...ordenCompra, direccion_entrega: e.target.value})}
            placeholder="Ej: Av. Elmer Faucett 5104, Callao"
          />
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Package className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold">Items de la Orden</h3>
          </div>

          <div className="overflow-x-auto">
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
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].codigo_producto = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.descripcion || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].descripcion = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.cantidad || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].cantidad = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.unidad_medida || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].unidad_medida = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.precio_unitario || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].precio_unitario = e.target.value;
                          setItems(newItems);
                        }}
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
                  <td colSpan="6" className="px-4 py-3 text-right font-medium">Total de items:</td>
                  <td className="px-4 py-3 font-bold">{items.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Totales */}
        <Card title="Totales">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Subtotal"
              type="number"
              step="0.01"
              value={documento.subtotal || ''}
              onChange={(e) => setDocumento({...documento, subtotal: e.target.value})}
              required
            />
            <Input
              label="IGV (18%)"
              type="number"
              step="0.01"
              value={documento.igv || ''}
              onChange={(e) => setDocumento({...documento, igv: e.target.value})}
              required
            />
            <Input
              label="Total"
              type="number"
              step="0.01"
              value={documento.total || ''}
              onChange={(e) => setDocumento({...documento, total: e.target.value})}
              required
            />
          </div>
        </Card>

        {/* Observaciones */}
        <Card title="Observaciones">
          <textarea
            value={documento.observaciones || ''}
            onChange={(e) => setDocumento({...documento, observaciones: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Observaciones adicionales..."
          />
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-center gap-4">
          {console.log('=== DEBUG ESTADO ===')}
          {console.log('Estado:', documento.estado)}
          {console.log('Tipo:', typeof documento.estado)}
          {console.log('Comparación:', documento.estado === 'pendiente_validacion')}
          {console.log('Estado completo:', JSON.stringify(documento.estado))}
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/documentos')}
            disabled={saving}
          >
            <X size={20} />
            Cancelar
          </Button>

          {documento.estado === 'pendiente_validacion' && (
            <>
            {console.log('✅ ENTRÓ AL BLOQUE CONDICIONAL')}
              <Button
                type="button"
                variant="danger"
                onClick={handleRechazar}
                disabled={saving}
              >
                <AlertCircle size={20} />
                Rechazar
              </Button>

              <Button
                type="submit"
                variant="secondary"
                disabled={saving}
              >
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>

              <Button
                type="button"
                variant="success"
                onClick={handleValidar}
                disabled={saving}
              >
                <CheckCircle size={20} />
                Validar
              </Button>
            </>
          )}

          {documento.estado === 'validado' && (
            <Button
              type="submit"
              variant="secondary"
              disabled={saving}
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </div>

        {/* Botón para continuar subiendo */}
        {documento.estado === 'validada' && (
          <div className="mt-4">
            <button
              onClick={() => {
                // Pasar contexto del expediente y empresa
                navigate('/upload', {
                  state: {
                    empresaId: documento.empresa_id,
                    expedienteId: documento.expediente_id
                  }
                });
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Subir más documentos a este expediente
            </button>
          </div>
        )}
      </form>

      {saving && <Loading fullScreen />}
    </div>
  );
}