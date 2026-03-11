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
      
      const docs = await documentoService.listarPendientes();
      setDocumentos(docs);
      
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

  const getTipoDocumentoCorto = (tipoId) => {
    switch (tipoId) {
      case 1: return 'Factura';
      case 2: return 'Guía';
      case 3: return 'OC';
      default: return 'Doc';
    }
  };

  const totalPendientes = documentos.length + expedientes.length;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pendientes</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Documentos y expedientes que requieren atención</p>
      </div>

      {/* Alert */}
      {totalPendientes > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertCircle className="text-yellow-600 shrink-0" size={20} />
            <div>
              <p className="font-medium text-yellow-900 text-sm sm:text-base">
                {totalPendientes} item{totalPendientes !== 1 ? 's' : ''} pendiente{totalPendientes !== 1 ? 's' : ''}
              </p>
              <p className="text-xs sm:text-sm text-yellow-700">
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
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="text-green-600" size={24} />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              ¡Todo al día!
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              No hay documentos ni expedientes pendientes
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Expedientes Incompletos */}
          {expedientes.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Package className="text-yellow-600" size={20} />
                <span>Expedientes Incompletos ({expedientes.length})</span>
              </h2>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {expedientes.map((expediente) => (
                  <Card key={expediente.id} className="p-0">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {expediente.codigo_expediente}
                            </h3>
                            <Badge variant="warning">Incompleto</Badge>
                          </div>

                          <div className="space-y-1 text-xs sm:text-sm text-gray-600">
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
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 active:bg-yellow-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base shrink-0"
                        >
                          <Eye size={18} />
                          <span className="hidden sm:inline">Ver Expediente</span>
                          <span className="sm:hidden">Ver</span>
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
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                <span className="hidden sm:inline">Documentos Pendientes de Validación ({documentos.length})</span>
                <span className="sm:hidden">Docs Pendientes ({documentos.length})</span>
              </h2>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {documentos.map((documento) => (
                  <Card key={documento.id} className="p-0">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                              {documento.numero_documento}
                            </h3>
                            <Badge variant="default" className="text-xs">
                              <span className="hidden sm:inline">{getTipoDocumento(documento.tipo_documento_id)}</span>
                              <span className="sm:hidden">{getTipoDocumentoCorto(documento.tipo_documento_id)}</span>
                            </Badge>
                            {documento.confianza_ocr_promedio && (
                              <Badge variant={getConfianzaColor(documento.confianza_ocr_promedio)} className="text-xs">
                                OCR: {formatConfianza(documento.confianza_ocr_promedio)}
                              </Badge>
                            )}
                            {documento.es_duplicada && (
                              <Badge variant="danger" className="text-xs">Duplicado</Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                            <p className="truncate">
                              <span className="font-medium">RUC:</span> {documento.ruc_emisor}
                            </p>
                            <p className="truncate">
                              <span className="font-medium">Emisor:</span> {documento.razon_social_emisor}
                            </p>
                            <p>
                              <span className="font-medium">Fecha:</span> {formatDate(documento.fecha_emision)}
                            </p>
                            {documento.total && (
                              <p>
                                <span className="font-medium">Total:</span>{' '}
                                <span className="text-base sm:text-lg font-bold text-gray-900">
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
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base shrink-0"
                        >
                          <Eye size={18} />
                          Validar
                        </button>
                      </div>
                    </div>

                    {/* Barra de advertencia si confianza baja */}
                    {documento.confianza_ocr_promedio && documento.confianza_ocr_promedio < 80 && (
                      <div className="bg-red-50 px-4 sm:px-6 py-2 sm:py-3 border-t border-red-100">
                        <p className="text-xs sm:text-sm text-red-800">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{documentos.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">Documentos Pendientes</p>
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{expedientes.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">Expedientes Incompletos</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}