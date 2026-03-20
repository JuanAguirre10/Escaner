import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FileText, Truck, ClipboardCheck, Download, Eye, Upload, Trash2, Lock, Unlock, User, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Loading, Badge } from '../components/common';
import { expedienteService } from '../services/expedienteService';
import { formatDate } from '../utils/formatters';

export default function VerExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState('');
  const [cerrando, setCerrando] = useState(false);
  
  // Estados para visualización de archivos
  const [mostrarModalArchivo, setMostrarModalArchivo] = useState(false);
  const [archivoActual, setArchivoActual] = useState(null);

  useEffect(() => {
    cargarExpediente();
  }, [id]);

  const cargarExpediente = async () => {
    try {
      setLoading(true);
      const data = await expedienteService.obtener(id);
      setExpediente(data);
    } catch (error) {
      console.error('Error cargando expediente:', error);
      toast.error('Error al cargar el expediente');
    } finally {
      setLoading(false);
    }
  };

  const getUrlArchivo = (archivoUrl) => {
    if (!archivoUrl) return null;

    if (archivoUrl.startsWith('http')) return archivoUrl;

    let rutaRelativa = archivoUrl;

    const prefijos = [
      'C:\\Proyectos\\sistema-facturas\\backend',
      'C:/Proyectos/sistema-facturas/backend',
      '/home/claude/backend',
      'backend'
    ];

    for (const prefijo of prefijos) {
      if (rutaRelativa.includes(prefijo)) {
        rutaRelativa = rutaRelativa.replace(prefijo, '');
        break;
      }
    }

    rutaRelativa = rutaRelativa.replace(/\\/g, '/');
    if (!rutaRelativa.startsWith('/')) rutaRelativa = '/' + rutaRelativa;

    return `${import.meta.env.VITE_API_BASE_URL}${rutaRelativa}`;
  };

  const descargarZip = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/expedientes/${id}/descargar-zip`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Error al descargar el ZIP');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${expediente.codigo_expediente}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Expediente descargado correctamente');
    } catch (error) {
      console.error('Error descargando ZIP:', error);
      toast.error('Error al descargar el expediente');
    }
  };

  const descargarDocumento = async (doc) => {
    try {
      const url = getUrlArchivo(doc.archivo_original_url);
      
      if (!url) {
        toast.error('URL del archivo no disponible');
        return;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al descargar');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.archivo_original_nombre || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast.success('Documento descargado');
    } catch (error) {
      console.error('Error descargando documento:', error);
      toast.error('Error al descargar el documento');
    }
  };

  const verArchivo = (doc) => {
    const url = getUrlArchivo(doc.archivo_original_url);
    
    if (!url) {
      toast.error('URL del archivo no disponible');
      return;
    }
    
    setArchivoActual({
      nombre: doc.archivo_original_nombre,
      url: url,
      tipo: getTipoDocumento(doc.tipo_documento_id),
      numero: doc.numero_documento,
      extension: doc.archivo_original_tipo
    });
    setMostrarModalArchivo(true);
  };

  const irAFormulario = (doc) => {
    // Redirigir al formulario según el tipo de documento
    if (doc.tipo_documento_id === 3) {
      navigate(`/validar-orden/${doc.id}`);
    } else if (doc.tipo_documento_id === 2) {
      navigate(`/validar-guia/${doc.id}`);
    } else if (doc.tipo_documento_id === 6) {
      navigate(`/validar/${doc.id}`);
    } else if (doc.tipo_documento_id === 4) {
      // Nota de entrega - buscar en notas_entrega por numero_nota
      const notaEntrega = expediente.notas_entrega?.find(n => n.numero_nota === doc.numero_documento);
      if (notaEntrega) {
        navigate(`/notas-entrega/${notaEntrega.id}`);
      } else {
        toast.error('No se encontró el formulario de la nota');
      }
    } else {
      navigate(`/validar/${doc.id}`);
    }
  };

  const handleEliminar = async () => {
    if (!confirmandoEliminar) {
      setConfirmandoEliminar(true);
      return;
    }

    try {
      await expedienteService.eliminar(expediente.id);
      toast.success('Expediente eliminado correctamente');
      navigate('/expedientes');
    } catch (error) {
      console.error('Error eliminando expediente:', error);
      toast.error('Error al eliminar el expediente');
    } finally {
      setConfirmandoEliminar(false);
    }
  };

  const handleCerrarExpediente = async () => {
    if (!motivoCierre || motivoCierre.length < 10) {
      toast.error('Debes ingresar un motivo (mínimo 10 caracteres)');
      return;
    }

    try {
      setCerrando(true);
      await expedienteService.cerrar(expediente.id, motivoCierre);
      toast.success('✅ Expediente cerrado exitosamente');
      setMostrarModalCerrar(false);
      setMotivoCierre('');
      cargarExpediente();
    } catch (error) {
      toast.error('Error al cerrar expediente');
      console.error(error);
    } finally {
      setCerrando(false);
    }
  };

  const handleReabrirExpediente = async () => {
    try {
      await expedienteService.reabrir(expediente.id);
      toast.success('✅ Expediente reabierto');
      cargarExpediente();
    } catch (error) {
      toast.error('Error al reabrir expediente');
      console.error(error);
    }
  };

  const getTipoDocumento = (tipoId) => {
    switch (tipoId) {
      case 1: return 'Factura';
      case 2: return 'Guía de Remisión';
      case 3: return 'Orden de Compra';
      case 4: return 'Nota de Entrega';
      case 5: return 'Doc. Identidad';
      case 6: return 'Recibo por Honorarios';
      default: return 'Desconocido';
    }
  };

  const getIconoDocumento = (tipoId) => {
    switch (tipoId) {
      case 1: return <FileText className="text-green-600" size={18} />;
      case 2: return <Truck className="text-orange-600" size={18} />;
      case 3: return <Package className="text-blue-600" size={18} />;
      case 4: return <ClipboardCheck className="text-purple-600" size={18} />;
      case 5: return <User className="text-indigo-600" size={18} />;
      case 6: return <FileText className="text-orange-600" size={18} />;
      default: return <FileText className="text-gray-600" size={18} />;
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!expediente) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm sm:text-base text-gray-500">Expediente no encontrado</p>
        <button
          onClick={() => navigate('/expedientes')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium text-sm"
        >
          Volver a Expedientes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0 space-y-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/expedientes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">{expediente.codigo_expediente}</h1>
            <p className="text-xs sm:text-base text-gray-600 mt-1 truncate">OC: {expediente.numero_orden_compra}</p>
          </div>
          <Badge
            variant={
              expediente.estado === 'completo' ? 'success' :
              expediente.estado === 'cerrado_manual' ? 'default' :
              expediente.estado === 'incompleto' ? 'danger' : 'warning'
            }
            className="shrink-0"
          >
            {expediente.estado === 'completo' ? 'Completo' :
             expediente.estado === 'cerrado_manual' ? 'Cerrado' :
             expediente.estado === 'incompleto' ? 'Incompleto' : 'En Proceso'}
          </Badge>
        </div>

        {/* Botones de acción - Desktop */}
        <div className="hidden lg:flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/upload?expediente_id=${expediente.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Upload size={18} />
            Agregar Docs
          </button>

          <button
            onClick={descargarZip}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <Download size={18} />
            Descargar ZIP
          </button>

          {expediente.estado !== 'completo' && !expediente.cerrado_manualmente && (
            <button
              onClick={() => setMostrarModalCerrar(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              <Lock size={18} />
              Cerrar
            </button>
          )}

          {expediente.cerrado_manualmente && (
            <button
              onClick={handleReabrirExpediente}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Unlock size={18} />
              Reabrir
            </button>
          )}

          {!confirmandoEliminar ? (
            <button
              onClick={() => setConfirmandoEliminar(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              <Trash2 size={18} />
              Eliminar
            </button>
          ) : (
            <>
              <button
                onClick={handleEliminar}
                className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium text-sm"
              >
                <Trash2 size={18} />
                Confirmar
              </button>
              <button
                onClick={() => setConfirmandoEliminar(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
            </>
          )}
        </div>

        {/* Botones de acción - Móvil */}
        <div className="lg:hidden grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`/upload?expediente_id=${expediente.id}`)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm"
          >
            <Upload size={16} />
            Agregar
          </button>

          <button
            onClick={descargarZip}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm"
          >
            <Download size={16} />
            ZIP
          </button>

          {expediente.estado !== 'completo' && !expediente.cerrado_manualmente && (
            <button
              onClick={() => setMostrarModalCerrar(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:bg-orange-800 transition-colors text-sm"
            >
              <Lock size={16} />
              Cerrar
            </button>
          )}

          {expediente.cerrado_manualmente && (
            <button
              onClick={handleReabrirExpediente}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm"
            >
              <Unlock size={16} />
              Reabrir
            </button>
          )}

          {!confirmandoEliminar ? (
            <button
              onClick={() => setConfirmandoEliminar(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-sm col-span-2"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          ) : (
            <>
              <button
                onClick={handleEliminar}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 active:bg-red-900 transition-colors text-sm"
              >
                <Trash2 size={16} />
                Confirmar
              </button>
              <button
                onClick={() => setConfirmandoEliminar(false)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors text-sm"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Información General */}
      <Card title="Información General">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Fecha Creación</p>
            <p className="font-medium text-sm sm:text-base">{formatDate(expediente.fecha_creacion)}</p>
          </div>
          {expediente.fecha_cierre && (
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Fecha Cierre</p>
              <p className="font-medium text-sm sm:text-base">{formatDate(expediente.fecha_cierre)}</p>
            </div>
          )}
          {expediente.cerrado_manualmente && expediente.motivo_cierre && (
            <div className="sm:col-span-2">
              <p className="text-xs sm:text-sm text-gray-600">Motivo de Cierre</p>
              <p className="font-medium text-orange-700 text-sm sm:text-base">{expediente.motivo_cierre}</p>
            </div>
          )}
          {expediente.documentos_exentos && expediente.documentos_exentos.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Documentos No Requeridos</p>
              <div className="flex flex-wrap gap-2">
                {expediente.documentos_exentos.map((tipoId) => (
                  <span key={tipoId} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                    ⚠️ {tipoId === 1 ? 'Factura' : tipoId === 2 ? 'Guía de Remisión' : tipoId === 6 ? 'Recibo por Honorarios' : `Tipo ${tipoId}`} — No requerido
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* TODOS LOS DOCUMENTOS (Facturas, Guías, OC, Notas, DNI) */}
      <Card title="Documentos del Expediente">
        <div className="space-y-2 sm:space-y-3">
          {/* Documentos normales */}
          {expediente.documentos && expediente.documentos.length > 0 ? (
            expediente.documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 sm:gap-0"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {getIconoDocumento(doc.tipo_documento_id)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {getTipoDocumento(doc.tipo_documento_id)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{doc.numero_documento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-start sm:justify-end flex-wrap">
                  <Badge variant={doc.estado === 'validada' ? 'success' : 'warning'} className="text-xs">
                    {doc.estado}
                  </Badge>
                  
                  <button
                    onClick={() => verArchivo(doc)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Ver</span>
                  </button>
                  
                  <button
                    onClick={() => descargarDocumento(doc)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <Download size={14} />
                  </button>
                  
                  <button
                    onClick={() => irAFormulario(doc)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : null}

          {/* Documentos de Identidad (en el mismo card) */}
          {expediente.documentos_identidad && expediente.documentos_identidad.length > 0 && (
            expediente.documentos_identidad.map((doc) => (
              <div
                key={`dni-${doc.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors gap-2 sm:gap-0"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <User className="text-purple-600 shrink-0" size={18} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{doc.tipo_documento}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{doc.numero_documento}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {doc.nombre_completo || `${doc.nombres} ${doc.apellidos}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 justify-start sm:justify-end flex-wrap">
                  <Badge variant="info" className="text-xs">Doc. Identidad</Badge>
                  
                  {doc.archivo_url && (
                    <>
                      <button
                        onClick={() => {
                          const url = getUrlArchivo(doc.archivo_url);
                          if (url) {
                            setArchivoActual({
                              nombre: `${doc.tipo_documento}_${doc.numero_documento}`,
                              url: url,
                              tipo: doc.tipo_documento,
                              numero: doc.numero_documento,
                              extension: doc.archivo_tipo || 'pdf'
                            });
                            setMostrarModalArchivo(true);
                          } else {
                            toast.error('URL del archivo no disponible');
                          }
                        }}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-xs sm:text-sm font-medium"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            const url = getUrlArchivo(doc.archivo_url);
                            if (!url) {
                              toast.error('URL no disponible');
                              return;
                            }
                            
                            const response = await fetch(url);
                            if (!response.ok) throw new Error('Error');
                            
                            const blob = await response.blob();
                            const downloadUrl = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = downloadUrl;
                            a.download = `${doc.tipo_documento}_${doc.numero_documento}.${doc.archivo_tipo || 'pdf'}`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(downloadUrl);
                            document.body.removeChild(a);
                            toast.success('Descargado');
                          } catch (error) {
                            toast.error('Error al descargar');
                          }
                        }}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-xs sm:text-sm font-medium"
                      >
                        <Download size={14} />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => navigate(`/documento-identidad/${doc.id}`)}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Mensaje si no hay documentos */}
          {(!expediente.documentos || expediente.documentos.length === 0) && 
           (!expediente.documentos_identidad || expediente.documentos_identidad.length === 0) && (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-sm sm:text-base text-gray-500 mb-4">No hay documentos en este expediente</p>
              <button
                onClick={() => navigate(`/upload?expediente_id=${expediente.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium mx-auto text-sm"
              >
                <Upload size={18} />
                Subir Primer Documento
              </button>
            </div>
          )}
        </div>
      </Card>



      {/* Notas de Entrega con datos de visitante */}
      {expediente.notas_entrega && expediente.notas_entrega.length > 0 && (
        <Card title="Notas de Entrega">
          <div className="space-y-3">
            {expediente.notas_entrega.map((nota) => (
              <div key={nota.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{nota.numero_nota}</p>
                    <p className="text-xs text-gray-600">{formatDate(nota.fecha_recepcion)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded shrink-0 ${
                    nota.estado_mercaderia === 'conforme'
                      ? 'bg-green-100 text-green-800'
                      : nota.estado_mercaderia === 'no_conforme'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {nota.estado_mercaderia === 'conforme' ? 'Conforme' :
                     nota.estado_mercaderia === 'no_conforme' ? 'No Conforme' : 'Parcial'}
                  </span>
                </div>
                {nota.recibido_por && (
                  <p className="text-xs text-gray-600"><span className="font-medium">Recibido por:</span> {nota.recibido_por}</p>
                )}
                {(nota.visitante_nombre || nota.visitante_dni) && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1 mb-1">
                      <User size={12} className="text-purple-600" />
                      <p className="text-xs font-medium text-purple-700">Visitante</p>
                    </div>
                    {nota.visitante_nombre && (
                      <p className="text-xs text-gray-600">{nota.visitante_nombre}</p>
                    )}
                    {nota.visitante_dni && (
                      <p className="text-xs text-gray-600">DNI: {nota.visitante_dni}</p>
                    )}
                    {nota.visitante_empresa && (
                      <p className="text-xs text-gray-600">{nota.visitante_empresa}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Observaciones */}
      {expediente.observaciones && (
        <Card title="Observaciones">
          <p className="text-sm sm:text-base text-gray-700">{expediente.observaciones}</p>
        </Card>
      )}

      {/* Modal Cerrar Expediente */}
      {mostrarModalCerrar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Cerrar Expediente</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Vas a cerrar este expediente sin completar todos los documentos. 
              Explica el motivo:
            </p>
            
            <textarea
              value={motivoCierre}
              onChange={(e) => setMotivoCierre(e.target.value)}
              placeholder="Ej: Cliente canceló pedido, documentos faltantes no son necesarios..."
              className="w-full border rounded-lg p-3 mb-3 sm:mb-4 min-h-32 text-sm"
              maxLength={500}
            />
            
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              {motivoCierre.length}/500 caracteres (mínimo 10)
            </p>
            
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setMostrarModalCerrar(false);
                  setMotivoCierre('');
                }}
                disabled={cerrando}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCerrarExpediente}
                disabled={cerrando || motivoCierre.length < 10}
                className="flex-1 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-sm"
              >
                {cerrando ? 'Cerrando...' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Archivo */}
      {mostrarModalArchivo && archivoActual && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{archivoActual.tipo}</h3>
                <p className="text-sm text-gray-600 truncate">{archivoActual.numero}</p>
              </div>
              <button
                onClick={() => {
                  setMostrarModalArchivo(false);
                  setArchivoActual(null);
                }}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Visor de archivo */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {archivoActual.extension === 'pdf' ? (
                <iframe
                  src={archivoActual.url}
                  className="w-full h-full"
                  title={`Vista de ${archivoActual.nombre}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={archivoActual.url} 
                    alt={archivoActual.nombre}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}