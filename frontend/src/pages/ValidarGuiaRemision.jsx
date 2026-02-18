import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Truck, MapPin, User, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Loading } from '../components/common';
import { documentoService } from '../services';
import guiaRemisionService from '../services/guiaRemisionService';


export default function ValidarGuiaRemision() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documento, setDocumento] = useState(null);
  const [guia, setGuia] = useState(null);
  const [items, setItems] = useState([]);

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar documento
      const docData = await documentoService.obtener(id);
      setDocumento(docData);

      // 🎯 REDIRIGIR SI NO ES GUÍA
      if (docData.tipo_documento_id !== 2) {
        navigate(`/validar/${id}`, { replace: true });
        return;
      }

      // Cargar items del documento
        try {
        const itemsData = await documentoService.obtenerItems(id);
        setItems(itemsData || []);
        setDocumento(prev => ({ ...prev, items: itemsData }));
        } catch (error) {
        console.log('No hay items para esta guía');
        setItems([]);
}

      // Cargar guía de remisión
      const guiaData = await guiaRemisionService.obtenerPorDocumento(id);
      if (guiaData) {
        setGuia(guiaData);
      } else {
        toast.error('No se encontró información de guía de remisión');
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setGuia(prev => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    try {
      setSaving(true);

      await guiaRemisionService.actualizar(id, {
        fecha_traslado: guia.fecha_traslado,
        motivo_traslado: guia.motivo_traslado,
        punto_partida: guia.punto_partida,
        punto_llegada: guia.punto_llegada,
        transportista_razon_social: guia.transportista_razon_social,
        transportista_ruc: guia.transportista_ruc,
        vehiculo_placa: guia.vehiculo_placa,
        conductor_nombre: guia.conductor_nombre,
        conductor_dni: guia.conductor_dni,
        conductor_licencia: guia.conductor_licencia,
        peso_bruto: guia.peso_bruto,
      });

      toast.success('Guía de remisión actualizada correctamente');
      navigate('/documentos');
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!guia) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontró información de guía de remisión</p>
            <Button onClick={() => navigate('/documentos')} className="mt-4">
              Volver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleValidar = async () => {
    try {
      setSaving(true);
      
      // Primero guardar cambios
      await handleGuardar();
      
      // Luego validar el documento
      await documentoService.validar(id);
      
      toast.success('Guía de remisión validada exitosamente');
      navigate('/facturas');
    } catch (error) {
      console.error('Error validando:', error);
      toast.error('Error al validar la guía de remisión');
    } finally {
      setSaving(false);
    }
  };

  const handleRechazar = async () => {
    const motivo = prompt('¿Por qué rechazas esta guía de remisión?');
    if (!motivo || motivo.trim().length < 10) {
      toast.error('Debes proporcionar un motivo válido (mínimo 10 caracteres)');
      return;
    }

    try {
      setSaving(true);
      await documentoService.rechazar(id, motivo);
      toast.success('Guía de remisión rechazada');
      navigate('/facturas');
    } catch (error) {
      console.error('Error rechazando:', error);
      toast.error('Error al rechazar la guía de remisión');
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Validar Guía de Remisión</h1>
            <p className="text-gray-600 mt-1">
              Documento: {documento?.numero_documento} | Guía: {guia.numero_guia}
            </p>
          </div>
        </div>
      </div>

      {/* Datos del Traslado */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Truck className="text-blue-600" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Datos del Traslado</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Fecha de Traslado"
            type="date"
            value={guia.fecha_traslado || ''}
            onChange={(e) => handleChange('fecha_traslado', e.target.value)}
          />

          <Input
            label="Motivo de Traslado"
            value={guia.motivo_traslado || ''}
            onChange={(e) => handleChange('motivo_traslado', e.target.value)}
            placeholder="VENTA, COMPRA, TRASLADO..."
          />

          <Input
            label="Modalidad de Transporte"
            value={guia.modalidad_transporte || ''}
            onChange={(e) => handleChange('modalidad_transporte', e.target.value)}
            placeholder="Transporte Privado"
            disabled
          />
        </div>
      </Card>

      {/* Puntos de Traslado */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <MapPin className="text-green-600" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Puntos de Traslado</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Punto de Partida
            </label>
            <textarea
              value={guia.punto_partida || ''}
              onChange={(e) => handleChange('punto_partida', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dirección completa de origen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Punto de Llegada
            </label>
            <textarea
              value={guia.punto_llegada || ''}
              onChange={(e) => handleChange('punto_llegada', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dirección completa de destino"
            />
          </div>
        </div>
      </Card>

      {/* Datos del Transportista */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Truck className="text-purple-600" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Transportista</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Razón Social"
            value={guia.transportista_razon_social || ''}
            onChange={(e) => handleChange('transportista_razon_social', e.target.value)}
            disabled
          />

          <Input
            label="RUC"
            value={guia.transportista_ruc || ''}
            onChange={(e) => handleChange('transportista_ruc', e.target.value)}
            disabled
          />

          <Input
            label="Placa del Vehículo"
            value={guia.vehiculo_placa || ''}
            onChange={(e) => handleChange('vehiculo_placa', e.target.value.toUpperCase())}
            placeholder="ABC-123"
            maxLength={8}
          />
        </div>
      </Card>

      {/* Datos del Conductor */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <User className="text-orange-600" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Conductor</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Nombre Completo"
            value={guia.conductor_nombre || ''}
            onChange={(e) => handleChange('conductor_nombre', e.target.value)}
          />

          <Input
            label="DNI"
            value={guia.conductor_dni || ''}
            onChange={(e) => handleChange('conductor_dni', e.target.value)}
            maxLength={8}
          />

          <Input
            label="Licencia de Conducir"
            value={guia.conductor_licencia || ''}
            onChange={(e) => handleChange('conductor_licencia', e.target.value)}
          />
        </div>
      </Card>

      {/* Datos de la Carga */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Package className="text-yellow-600" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Datos de la Carga</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Peso Bruto"
            type="number"
            step="0.01"
            value={guia.peso_bruto || ''}
            onChange={(e) => handleChange('peso_bruto', e.target.value)}
          />

          <Input
            label="Unidad de Peso"
            value={guia.unidad_peso || 'KGM'}
            onChange={(e) => handleChange('unidad_peso', e.target.value)}
            disabled
          />
        </div>
      </Card>
      {/* Items Transportados */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Package className="text-indigo-600" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Items Transportados</h2>
        </div>

        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Peso Bruto (KG)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-900">{item.orden}</td>
                    
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={item.codigo_producto || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].codigo_producto = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Código"
                      />
                    </td>
                    
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].descripcion = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={parseFloat(item.cantidad || 0).toFixed(2)}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].cantidad = parseFloat(e.target.value) || 0;
                          setItems(newItems);
                        }}
                        className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    
                    <td className="px-3 py-3 text-center">
                      <input
                        type="text"
                        value={item.unidad_medida || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].unidad_medida = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="UND"
                      />
                    </td>
                    
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={parseFloat(item.peso_bruto || 0).toFixed(2)}
                        onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].peso_bruto = parseFloat(e.target.value) || 0;
                            setItems(newItems);
                        }}
                        className="w-24 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Total de items:</span> {items.length}
                </p>
                <p className="text-sm text-gray-700 text-right">
                  <span className="font-medium">Peso Total:</span>{' '}
                  {items.reduce((sum, item) => 
                    sum + parseFloat(item.peso_bruto || 0), 0
                  ).toFixed(2)} KG
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay items registrados</p>
        )}
      </Card>

      {/* Botones de acción */}
      <Card>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/facturas')}
            disabled={saving}
          >
            <X size={20} />
            Cancelar
          </Button>

          <Button
            variant="danger"
            fullWidth
            onClick={handleRechazar}
            disabled={saving}
          >
            <X size={20} />
            Rechazar
          </Button>

          <Button
            variant="primary"
            fullWidth
            onClick={handleGuardar}
            disabled={saving}
          >
            <Save size={20} />
            Guardar Cambios
          </Button>

          <Button
            variant="success"
            fullWidth
            onClick={handleValidar}
            disabled={saving}
          >
            <CheckCircle size={20} />
            Validar y Aprobar
          </Button>
        </div>
      </Card>
    </div>
  );
}