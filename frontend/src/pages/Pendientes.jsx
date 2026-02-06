import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Badge, Loading } from '../components/common';
import { facturaService } from '../services';
import { formatDate, formatMoney, getConfianzaColor, formatConfianza } from '../utils/formatters';

export default function Pendientes() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      const data = await facturaService.listarPendientes();
      setFacturas(data);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      toast.error('Error al cargar facturas pendientes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Facturas Pendientes</h1>
        <p className="text-gray-600 mt-1">Facturas que requieren validación</p>
      </div>

      {/* Alert */}
      {facturas.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600 shrink-0" size={24} />
            <div>
              <p className="font-medium text-yellow-900">
                {facturas.length} factura{facturas.length !== 1 ? 's' : ''} pendiente{facturas.length !== 1 ? 's' : ''} de validación
              </p>
              <p className="text-sm text-yellow-700">
                Revisa y valida las facturas procesadas para completar el registro
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <Loading fullScreen />
      ) : facturas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¡Todo al día!
            </h3>
            <p className="text-gray-600">
              No hay facturas pendientes de validación
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {facturas.map((factura) => (
            <Card key={factura.id} className="p-0">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {factura.numero_factura}
                      </h3>
                      <Badge variant={getConfianzaColor(factura.confianza_ocr_promedio)}>
                        OCR: {formatConfianza(factura.confianza_ocr_promedio)}
                      </Badge>
                      {factura.es_duplicada && (
                        <Badge variant="red">Posible Duplicado</Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">RUC:</span> {factura.ruc_emisor}
                      </p>
                      <p>
                        <span className="font-medium">Emisor:</span> {factura.razon_social_emisor}
                      </p>
                      <p>
                        <span className="font-medium">Fecha:</span> {formatDate(factura.fecha_emision)}
                      </p>
                      <p>
                        <span className="font-medium">Total:</span>{' '}
                        <span className="text-lg font-bold text-gray-900">
                          {formatMoney(factura.total, factura.moneda)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Link to={`/validar/${factura.id}`}>
                    <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
                      <Eye size={20} />
                      Validar
                    </button>
                  </Link>
                </div>
              </div>

              {/* Barra de advertencia si confianza baja */}
              {factura.confianza_ocr_promedio < 80 && (
                <div className="bg-red-50 px-6 py-3 border-t border-red-100">
                  <p className="text-sm text-red-800">
                    ⚠️ Confianza OCR baja - Revisa cuidadosamente los datos extraídos
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}