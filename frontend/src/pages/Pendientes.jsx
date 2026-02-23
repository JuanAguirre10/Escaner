import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Eye, AlertCircle, Package, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Badge, Loading } from '../components/common';
import { documentoService, expedienteService } from '../services';
import { formatDate, formatMoney, getConfianzaColor, formatConfianza } from '../utils/formatters';

export default function Pendientes() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      
      // Cargar documentos pendientes
      const docs = await documentoService.listarPendientes();
      setDocumentos(docs);
      
      // Cargar expedientes incompletos
      const exps = await expedienteService.listar({ estado: 'en_proceso' });
      setExpedientes(exps);
      
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      toast.error('Error al cargar pendientes');
    } finally {
      setLoading(false);
    }
  };

  const getTipoDocumento = (tipoId) => {
    switch (tipoId) {
      case 1: return 'Factura';
      case 2: return 'Guía de Remisión';
      case 3: return 'Orden de Compra';
      default: return 'Documento';
    }
  };

  const totalPendientes = documentos.length + expedientes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pendientes</h1>
        <p className="text-gray-600 mt-1">Documentos y expedientes que requieren atención</p>
      </div>

      {/* Alert */}
      {totalPendientes > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600 shrink-0" size={24} />
            <div>
              <p className="font-medium text-yellow-900">
                {totalPendientes} item{totalPendientes !== 1 ? 's' : ''} pendiente{totalPendientes !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-700">
                {documentos.length} documento{documentos.length !== 1 ? 's' : ''} sin validar
                {expedientes.length > 0 && ` y ${expedientes.length} expediente${expedientes.length !== 1 ? 's' : ''} incompleto${expedientes.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Todo al día */}
      {loading ? (
        <Loading fullScreen />
      ) : totalPendientes === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¡Todo al día!
            </h3>
            <p className="text-gray-600">
              No hay documentos ni expedientes pendientes
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Expedientes Incompletos */}
          {expedientes.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="text-yellow-600" size={24} />
                Expedientes Incompletos ({expedientes.length})
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {expedientes.map((expediente) => (
                  <Card key={expediente.id} className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {expediente.codigo_expediente}
                            </h3>
                            <Badge variant="warning">Incompleto</Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">N° Orden:</span> {expediente.numero_orden_compra}
                            </p>
                            <p>
                              <span className="font-medium">Fecha Creación:</span> {formatDate(expediente.fecha_creacion)}
                            </p>
                            <p className="text-yellow-700 font-medium mt-2">
                              ⚠️ Faltan documentos por subir
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/expedientes/${expediente.id}`)}
                          className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                        >
                          <Eye size={20} />
                          Ver Expediente
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Documentos Pendientes */}
          {documentos.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="text-blue-600" size={24} />
                Documentos Pendientes de Validación ({documentos.length})
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {documentos.map((documento) => (
                  <Card key={documento.id} className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {documento.numero_documento}
                            </h3>
                            <Badge variant="default">
                              {getTipoDocumento(documento.tipo_documento_id)}
                            </Badge>
                            {documento.confianza_ocr_promedio && (
                              <Badge variant={getConfianzaColor(documento.confianza_ocr_promedio)}>
                                OCR: {formatConfianza(documento.confianza_ocr_promedio)}
                              </Badge>
                            )}
                            {documento.es_duplicada && (
                              <Badge variant="danger">Posible Duplicado</Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">RUC:</span> {documento.ruc_emisor}
                            </p>
                            <p>
                              <span className="font-medium">Emisor:</span> {documento.razon_social_emisor}
                            </p>
                            <p>
                              <span className="font-medium">Fecha:</span> {formatDate(documento.fecha_emision)}
                            </p>
                            {documento.total && (
                              <p>
                                <span className="font-medium">Total:</span>{' '}
                                <span className="text-lg font-bold text-gray-900">
                                  {formatMoney(documento.total, documento.moneda)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (documento.tipo_documento_id === 3) {
                              navigate(`/validar-orden/${documento.id}`);
                            } else if (documento.tipo_documento_id === 2) {
                              navigate(`/validar-guia/${documento.id}`);
                            } else {
                              navigate(`/validar/${documento.id}`);
                            }
                          }}
                          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                        >
                          <Eye size={20} />
                          Validar
                        </button>
                      </div>
                    </div>

                    {/* Barra de advertencia si confianza baja */}
                    {documento.confianza_ocr_promedio && documento.confianza_ocr_promedio < 80 && (
                      <div className="bg-red-50 px-6 py-3 border-t border-red-100">
                        <p className="text-sm text-red-800">
                          ⚠️ Confianza OCR baja - Revisa cuidadosamente los datos extraídos
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas */}
      {!loading && totalPendientes > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{documentos.length}</p>
              <p className="text-sm text-gray-600">Documentos Pendientes</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{expedientes.length}</p>
              <p className="text-sm text-gray-600">Expedientes Incompletos</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}