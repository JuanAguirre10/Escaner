import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Loading, Badge, Modal } from '../components/common';
import { documentoService as facturaService } from '../services';
import { formatDate, formatMoney, getConfianzaColor, getEstadoColor, formatEstado } from '../utils/formatters';
import { MENSAJES } from '../utils/constants';

export default function ValidarFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [factura, setFactura] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    cargarFactura();
  }, [id]);

  const cargarFactura = async () => {
    try {
        setLoading(true);
        console.log('Cargando documento ID:', id);
        
        const data = await facturaService.obtener(id);
        console.log('Documento cargado:', data);
        setFactura(data);

        if (data.tipo_documento_id === 2) {
          console.log('🔄 Redirigiendo a vista de guía de remisión...');
          navigate(`/validar-guia/${id}`, { replace: true });
          return;
        } else if (data.tipo_documento_id === 3) {
          console.log('🔄 Redirigiendo a vista de orden de compra...');
          navigate(`/validar-orden/${id}`, { replace: true });
          return;
        }
        
        setFormData({
          numero_factura: data.numero_documento || data.numero_factura || '',
          guia_remision: data.guia_remision || '',
          serie: data.serie || '',
          correlativo: data.correlativo || '',
          fecha_emision: data.fecha_emision || '',
          fecha_vencimiento: data.fecha_vencimiento || '',
          ruc_emisor: data.ruc_emisor || '',
          razon_social_emisor: data.razon_social_emisor || '',
          direccion_emisor: data.direccion_emisor || '',
          telefono_emisor: data.telefono_emisor || '',
          email_emisor: data.email_emisor || '',     
          subtotal: data.subtotal || 0,
          igv: data.igv || 0,
          total: data.total || 0,
          moneda: data.moneda || 'PEN',
          orden_compra: data.orden_compra || '',
          forma_pago: data.forma_pago || '',
          condicion_pago: data.condicion_pago || '',
          observaciones: data.observaciones || '',
        });

        try {
          const itemsData = await facturaService.obtenerItems(id);
          console.log('Items cargados:', itemsData);
          setItems(itemsData || []);
        } catch (itemsError) {
          console.error('Error cargando items:', itemsError);
          setItems([]);
        }
        
    } catch (error) {
        console.error('Error cargando documento:', error);
        toast.error('Error al cargar el documento');
        setFactura(null);
    } finally {
        setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);
      await facturaService.actualizar(id, formData);
      toast.success(MENSAJES.ACTUALIZAR_SUCCESS);
      navigate('/facturas');
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error(error.response?.data?.detail || MENSAJES.ACTUALIZAR_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleValidar = async () => {
    try {
      setSaving(true);
      await facturaService.validar(id);
      toast.success(MENSAJES.VALIDAR_SUCCESS);
      navigate('/facturas');
    } catch (error) {
      console.error('Error validando:', error);
      toast.error(error.response?.data?.detail || MENSAJES.VALIDAR_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleRechazar = async () => {
    const motivo = prompt('¿Por qué rechazas este documento?');
    if (!motivo || motivo.trim().length < 10) {
      toast.error('Debes proporcionar un motivo válido (mínimo 10 caracteres)');
      return;
    }

    try {
      setSaving(true);
      await facturaService.rechazar(id, motivo);
      toast.success(MENSAJES.RECHAZAR_SUCCESS);
      navigate('/facturas');
    } catch (error) {
      console.error('Error rechazando:', error);
      toast.error(error.response?.data?.detail || MENSAJES.RECHAZAR_ERROR);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!factura && !loading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <Card>
          <div className="text-center py-12">
            <div className="text-red-500 text-5xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Error al cargar documento
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              No se pudo cargar la información del documento
            </p>
            <Button onClick={() => navigate('/facturas')}>
              Volver a la lista
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!factura) return null;

  const numeroDocumento = factura.numero_documento || factura.numero_factura;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Validar Factura</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-sm sm:text-base text-gray-600">#{numeroDocumento}</p>
            <Badge variant={getEstadoColor(factura.estado)}>
              {formatEstado(factura.estado)}
            </Badge>
            <Badge variant={getConfianzaColor(factura.confianza_ocr_promedio)} className="text-xs">
              OCR: {factura.confianza_ocr_promedio ? parseFloat(factura.confianza_ocr_promedio).toFixed(1) : '0.0'}%
            </Badge>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={() => setShowImage(true)}
          className="w-full sm:w-auto"
        >
          <Eye size={18} />
          Ver Imagen
        </Button>
      </div>

      {/* Alerta de duplicado */}
      {factura.es_duplicada && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
            <div>
              <p className="font-medium text-yellow-900 text-sm sm:text-base">Documento Duplicado</p>
              <p className="text-xs sm:text-sm text-yellow-700">
                Este documento podría ser un duplicado. Revisa cuidadosamente antes de validar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formularios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4 sm:space-y-6">
          <Card title="Datos del Emisor">
            <div className="space-y-3 sm:space-y-4">
              <Input
                label="RUC Emisor"
                value={formData.ruc_emisor}
                onChange={(e) => handleChange('ruc_emisor', e.target.value)}
                required
              />
              
              <Input
                label="Razón Social"
                value={formData.razon_social_emisor}
                onChange={(e) => handleChange('razon_social_emisor', e.target.value)}
                required
              />
              
              <Input
                label="Dirección"
                value={formData.direccion_emisor}
                onChange={(e) => handleChange('direccion_emisor', e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Teléfono"
                  value={formData.telefono_emisor}
                  onChange={(e) => handleChange('telefono_emisor', e.target.value)}
                  placeholder="Ej: 014567890"
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={formData.email_emisor}
                  onChange={(e) => handleChange('email_emisor', e.target.value)}
                  placeholder="ventas@empresa.com"
                />
              </div>
            </div>
          </Card>

          <Card title="Datos del Documento">
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Serie"
                  value={formData.serie}
                  onChange={(e) => handleChange('serie', e.target.value)}
                  required
                />
                
                <Input
                  label="Correlativo"
                  value={formData.correlativo}
                  onChange={(e) => handleChange('correlativo', e.target.value)}
                  required
                />
              </div>

              <Input
                label="Número de Documento"
                value={formData.numero_factura}
                onChange={(e) => handleChange('numero_factura', e.target.value)}
                required
                disabled
              />

              <Input
                label="Guía de Remisión"
                value={formData.guia_remision}
                onChange={(e) => handleChange('guia_remision', e.target.value)}
                placeholder="T001-2642"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Fecha de Emisión"
                  type="date"
                  value={formData.fecha_emision}
                  onChange={(e) => handleChange('fecha_emision', e.target.value)}
                  required
                />
                
                <Input
                  label="Fecha de Vencimiento"
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => handleChange('fecha_vencimiento', e.target.value)}
                />
              </div>

              <Input
                label="Orden de Compra"
                value={formData.orden_compra}
                onChange={(e) => handleChange('orden_compra', e.target.value)}
                placeholder="Opcional"
              />

              <Input
                label="Forma de Pago"
                value={formData.forma_pago}
                onChange={(e) => handleChange('forma_pago', e.target.value)}
                placeholder="Ej: CONTADO, CREDITO"
              />

              <Input
                label="Condición de Pago"
                value={formData.condicion_pago}
                onChange={(e) => handleChange('condicion_pago', e.target.value)}
                placeholder="Ej: PAGO ADELANTADO"
              />
            </div>
          </Card>
        </div>
{/* Columna derecha */}
        <div className="space-y-4 sm:space-y-6">
          <Card title="Montos">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex-1">
                  <Input
                    label="Subtotal"
                    type="number"
                    step="0.01"
                    value={parseFloat(formData.subtotal).toFixed(2)}
                    onChange={(e) => handleChange('subtotal', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="w-20 sm:w-24">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => handleChange('moneda', e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <Input
                label="IGV (18%)"
                type="number"
                step="0.01"
                value={parseFloat(formData.igv).toFixed(2)}
                onChange={(e) => handleChange('igv', parseFloat(e.target.value))}
              />

              <Input
                label="Total"
                type="number"
                step="0.01"
                value={parseFloat(formData.total).toFixed(2)}
                onChange={(e) => handleChange('total', parseFloat(e.target.value))}
                required
              />

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatMoney(formData.subtotal, formData.moneda)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">IGV:</span>
                  <span className="font-medium">{formatMoney(formData.igv, formData.moneda)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary-600">{formatMoney(formData.total, formData.moneda)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Observaciones">
            <textarea
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={4}
              placeholder="Agrega observaciones o notas sobre este documento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </Card>
        </div>
      </div>

      {/* Tabla de Items */}
      {items.length > 0 && (
        <Card title={`Items (${items.length})`}>
          {/* Versión móvil - Cards */}
          <div className="block lg:hidden space-y-3">
            {items.map((item, index) => {
              const cantidad = parseFloat(item.cantidad) || 0;
              const precioUnitario = parseFloat(item.precio_unitario) || 0;
              const descuento = parseFloat(item.descuento_porcentaje) || 0;
              const valorVenta = cantidad * precioUnitario;
              const descuentoMonto = valorVenta * (descuento / 100);
              const total = valorVenta - descuentoMonto;

              return (
                <div key={item.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Item #{item.orden}</span>
                    <button
                      onClick={() => {
                        const newItems = items.filter((_, i) => i !== index);
                        setItems(newItems);
                      }}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Descripción</label>
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].descripcion = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Cantidad</label>
                        <input
                          type="number"
                          step="0.01"
                          value={cantidad.toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].cantidad = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">P. Unitario</label>
                        <input
                          type="number"
                          step="0.01"
                          value={precioUnitario.toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].precio_unitario = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Desc %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={descuento.toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].descuento_porcentaje = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">Total</label>
                        <input
                          type="number"
                          step="0.01"
                          value={parseFloat(item.valor_total || total).toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].valor_total = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-primary-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Versión desktop - Tabla */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">P. Unit.</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Desc %</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Venta</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">P. Venta</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => {
                  const cantidad = parseFloat(item.cantidad) || 0;
                  const precioUnitario = parseFloat(item.precio_unitario) || 0;
                  const descuento = parseFloat(item.descuento_porcentaje) || 0;
                  const valorVenta = cantidad * precioUnitario;
                  const descuentoMonto = valorVenta * (descuento / 100);
                  const total = valorVenta - descuentoMonto;
                  
                  return (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm text-gray-900">{item.orden}</td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].descripcion = e.target.value;
                            setItems(newItems);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={cantidad.toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].cantidad = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={precioUnitario.toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].precio_unitario = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={descuento.toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].descuento_porcentaje = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={parseFloat(item.valor_venta || valorVenta).toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].valor_venta = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-700"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={parseFloat(item.valor_total || total).toFixed(2)}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].valor_total = parseFloat(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-primary-700"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => {
                            const newItems = items.filter((_, i) => i !== index);
                            setItems(newItems);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Subtotal de items */}
          <div className="mt-4 flex justify-end">
            <div className="w-full sm:w-72 p-3 sm:p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base font-bold text-gray-800">Subtotal (Items):</span>
                <span className="text-lg sm:text-xl font-bold text-primary-700">
                  {formatMoney(
                    items.reduce((sum, item) => sum + (parseFloat(item.valor_total) || 0), 0),
                    factura.moneda
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setItems([...items, {
                  orden: items.length + 1,
                  descripcion: '',
                  cantidad: 1,
                  precio_unitario: 0,
                  descuento_porcentaje: 0,
                  valor_venta: 0,
                  valor_total: 0,
                }]);
              }}
              className="w-full sm:w-auto"
            >
              + Agregar Item
            </Button>
          </div>
        </Card>
      )}

      {/* Botones de acción */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="secondary" fullWidth onClick={() => navigate('/facturas')}>
            <X size={18} />
            <span className="hidden sm:inline">Cancelar</span>
            <span className="sm:hidden">Cancelar</span>
          </Button>

          <Button variant="danger" fullWidth onClick={handleRechazar} disabled={saving}>
            <X size={18} />
            Rechazar
          </Button>

          <Button variant="primary" fullWidth onClick={handleGuardar} loading={saving}>
            <Save size={18} />
            <span className="hidden sm:inline">Guardar Cambios</span>
            <span className="sm:hidden">Guardar</span>
          </Button>

          <Button variant="success" fullWidth onClick={handleValidar} loading={saving}>
            <CheckCircle size={18} />
            <span className="hidden sm:inline">Validar y Aprobar</span>
            <span className="sm:hidden">Validar</span>
          </Button>
        </div>
      </Card>

      {/* Modal de imagen */}
      <Modal isOpen={showImage} onClose={() => setShowImage(false)} title="Imagen del Documento" size="xl">
        <div className="max-h-[70vh] overflow-auto">
          <img 
            src={`http://192.168.2.47:8000/${factura.archivo_original_url}`}
            alt="Documento"
            className="w-full"
          />
        </div>
      </Modal>
    </div>
  );
}