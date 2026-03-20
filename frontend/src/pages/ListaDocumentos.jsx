import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loading, Input } from '../components/common';
import { documentoService, tipoDocumentoService, notaEntregaService, expedienteService } from '../services';
import documentoIdentidadService from '../services/documentoIdentidadService';
import { formatDate, formatMoney, getEstadoColor, formatEstado } from '../utils/formatters';
import { TIPOS_DOCUMENTO } from '../utils/constants';
import FiltrosFecha from '../components/FiltrosFecha';

export default function ListaDocumentos() {
  const [documentos, setDocumentos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [docsIdentidad, setDocsIdentidad] = useState([]);
  const [confirmacion, setConfirmacion] = useState({ visible: false, mensaje: '', onConfirm: null });
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_DOCUMENTO.ORDEN_COMPRA);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [soloHoy, setSoloHoy] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busquedaOC, setBusquedaOC] = useState('');
  const [buscarGeneral, setBuscarGeneral] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    cargarTiposDocumento();
  }, []);

  useEffect(() => {
    cargarDocumentos();
  }, [tipoSeleccionado, soloHoy, fechaDesde, fechaHasta, busquedaOC, buscarGeneral, filtroEstado]);

  const cargarTiposDocumento = async () => {
    try {
      const tipos = await tipoDocumentoService.listar(false);
      setTiposDocumento(tipos);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
    }
  };

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      
      if (tipoSeleccionado === 4) {
        const notasData = await notaEntregaService.listar();
        setNotas(notasData);
        setDocumentos([]);
        setDocsIdentidad([]);
      } 
      else if (tipoSeleccionado === 5) {
        const allExpedientes = await expedienteService.listar({ limit: 1000, solo_hoy: false });
        const allDocs = [];
        
        for (const exp of allExpedientes) {
          try {
            const docs = await documentoIdentidadService.listarPorExpediente(exp.id);
            allDocs.push(...docs.map(d => ({ ...d, expediente_codigo: exp.codigo_expediente })));
          } catch (err) {
            console.log(`No hay docs identidad para expediente ${exp.id}`);
          }
        }
        
        setDocsIdentidad(allDocs);
        setDocumentos([]);
        setNotas([]);
      }
      else {
        const params = {
          tipo_documento_id: tipoSeleccionado,
          solo_hoy: soloHoy,
        };
        
        if (!soloHoy) {
          if (fechaDesde) params.fecha_desde = fechaDesde;
          if (fechaHasta) params.fecha_hasta = fechaHasta;
        }
        
        if (buscarGeneral) params.buscar = buscarGeneral;
        if (filtroEstado) params.estado = filtroEstado;
        if (busquedaOC) params.numero_orden_compra = busquedaOC;
        
        const data = await documentoService.listar(params);
        setDocumentos(data);
        setNotas([]);
        setDocsIdentidad([]);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setSoloHoy(true);
    setFechaDesde('');
    setFechaHasta('');
    setBusquedaOC('');
    setBuscarGeneral('');
    setFiltroEstado('');
  };

  const handleEliminar = (id) => {
    setConfirmacion({
      visible: true,
      mensaje: '¿Estás seguro de eliminar este documento?',
      onConfirm: async () => {
        try {
          await documentoService.eliminar(id);
          toast.success('Documento eliminado');
          cargarDocumentos();
        } catch (error) {
          console.error('Error eliminando:', error);
          toast.error('Error al eliminar documento');
        } finally {
          setConfirmacion({ visible: false, mensaje: '', onConfirm: null });
        }
      }
    });
  };

  const handleEliminarNota = (id) => {
    setConfirmacion({
      visible: true,
      mensaje: '¿Estás seguro de eliminar esta nota?',
      onConfirm: async () => {
        try {
          await notaEntregaService.eliminar(id);
          toast.success('Nota eliminada');
          cargarDocumentos();
        } catch (error) {
          console.error('Error eliminando:', error);
          toast.error('Error al eliminar nota');
        } finally {
          setConfirmacion({ visible: false, mensaje: '', onConfirm: null });
        }
      }
    });
  };

  const handleEliminarIdentidad = (id) => {
    setConfirmacion({
      visible: true,
      mensaje: '¿Estás seguro de eliminar este documento de identidad?',
      onConfirm: async () => {
        try {
          await documentoIdentidadService.eliminar(id);
          toast.success('Documento de identidad eliminado');
          cargarDocumentos();
        } catch (error) {
          console.error('Error eliminando:', error);
          toast.error('Error al eliminar documento de identidad');
        } finally {
          setConfirmacion({ visible: false, mensaje: '', onConfirm: null });
        }
      }
    });
  };

  const tipoActual = tiposDocumento.find(t => t.id === tipoSeleccionado);

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lista de Documentos</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Todos los documentos procesados por tipo</p>
      </div>

      {/* Pestañas de Tipos de Documento */}
      <Card>
        <div className="border-b border-gray-200 mb-4 sm:mb-6 -mx-4 sm:mx-0">
          <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-0">
            <nav className="flex -mb-px space-x-4 sm:space-x-8 min-w-max">
              {tiposDocumento
                .filter(tipo => tipo.id !== 5)
                .sort((a, b) => {
                  const ordenProceso = {
                    'ORDEN_COMPRA': 1,
                    'FACTURA': 2,
                    'GUIA_REMISION': 3,
                    'NOTA_ENTREGA': 4
                  };
                  return (ordenProceso[a.codigo] || 999) - (ordenProceso[b.codigo] || 999);
                })
                .map((tipo) => {
                const esActivo = tipo.id === tipoSeleccionado;
                const estaHabilitado = tipo.activo;
                
                const nombreCorto = {
                  'Orden de Compra': 'OC',
                  'Factura': 'Factura',
                  'Guía de Remisión': 'Guía',
                  'Nota de Entrega': 'Nota'
                };

                return (
                  <button
                    key={tipo.id}
                    onClick={() => estaHabilitado && setTipoSeleccionado(tipo.id)}
                    disabled={!estaHabilitado}
                    className={`
                      py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                      ${esActivo
                        ? 'border-blue-500 text-blue-600'
                        : estaHabilitado
                          ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          : 'border-transparent text-gray-300 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="sm:hidden">{nombreCorto[tipo.nombre] || tipo.nombre}</span>
                    <span className="hidden sm:inline">{tipo.nombre}</span>
                    {!estaHabilitado && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-1 sm:px-2 py-1 rounded">
                        Próximo
                      </span>
                    )}
                  </button>
                );
              })}
              
              <button
                onClick={() => setTipoSeleccionado(5)}
                className={`
                  py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                  ${tipoSeleccionado === 5
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="sm:hidden">DNI</span>
                <span className="hidden sm:inline">Doc. Identidad</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Información del tipo seleccionado */}
        {tipoActual && tipoSeleccionado !== 5 && (
          <div className="mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-medium">Mostrando:</span> {tipoActual.descripcion}
            </p>
          </div>
        )}

        {tipoSeleccionado === 5 && (
          <div className="mb-4 sm:mb-6 bg-purple-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-purple-900">
              <span className="font-medium">Mostrando:</span> Documentos de identidad de visitantes/entregadores
            </p>
          </div>
        )}
{/* Filtros - Solo para documentos normales */}
        {tipoSeleccionado !== 4 && tipoSeleccionado !== 5 && (
          <>
            <FiltrosFecha
              soloHoy={soloHoy}
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
              onSoloHoyChange={setSoloHoy}
              onFechaDesdeChange={setFechaDesde}
              onFechaHastaChange={setFechaHasta}
              onLimpiar={handleLimpiarFiltros}
            />

            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={buscarGeneral}
                      onChange={(e) => setBuscarGeneral(e.target.value)}
                      placeholder="Número, RUC..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Número de OC
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={busquedaOC}
                      onChange={(e) => setBusquedaOC(e.target.value)}
                      placeholder="Número de OC..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente_validacion">Pendiente Validación</option>
                    <option value="validada">Validada</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="duplicada">Duplicada</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Contenido */}
        {loading ? (
          <Loading />
        ) : tipoSeleccionado === 5 ? (
          // DOCUMENTOS DE IDENTIDAD
          docsIdentidad.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl sm:text-5xl mb-4">🪪</div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">No hay documentos de identidad</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Los documentos de identidad se registran al subir documentos
              </p>
            </div>
          ) : (
            <>
              {/* Cards móvil */}
              <div className="block sm:hidden space-y-3">
                {docsIdentidad.map((doc) => (
                  <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {doc.tipo_documento === 'DNI' ? '🪪 DNI' :
                           doc.tipo_documento === 'CARNET_EXTRANJERIA' ? '🛂 CE' :
                           doc.tipo_documento === 'PASAPORTE' ? '📘 Pasaporte' :
                           doc.tipo_documento === 'CPP' ? '📋 CPP' : '📄 Otro'}
                        </p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{doc.numero_documento}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p><span className="font-medium">Nombre:</span> {doc.nombre_completo || `${doc.nombres || ''} ${doc.apellidos || ''}`.trim()}</p>
                      <p><span className="font-medium">Expediente:</span> {doc.expediente_codigo || 'N/A'}</p>
                      <p><span className="font-medium">Fecha:</span> {formatDate(doc.created_at)}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link to={`/documento-identidad/${doc.id}`} className="flex-1">
                        <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2">
                          <Eye size={16} />
                          Ver
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleEliminarIdentidad(doc.id)}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Documento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expediente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {docsIdentidad.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {doc.tipo_documento === 'DNI' ? '🪪 DNI' :
                           doc.tipo_documento === 'CARNET_EXTRANJERIA' ? '🛂 CE' :
                           doc.tipo_documento === 'PASAPORTE' ? '📘 Pasaporte' :
                           doc.tipo_documento === 'CPP' ? '📋 CPP' : '📄 Otro'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.numero_documento}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {doc.nombre_completo || `${doc.nombres || ''} ${doc.apellidos || ''}`.trim()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{doc.expediente_codigo || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(doc.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Link to={`/documento-identidad/${doc.id}`}>
                              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Eye size={18} />
                              </button>
                            </Link>
                            <button 
                              onClick={() => handleEliminarIdentidad(doc.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : tipoSeleccionado === 4 ? (
          // NOTAS DE ENTREGA
          notas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl sm:text-5xl mb-4">📋</div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">No hay notas de entrega</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Las notas se crean desde "Subir Documentos"
              </p>
            </div>
          ) : (
            <>
              {/* Cards móvil */}
              <div className="block sm:hidden space-y-3">
                {notas.map((nota) => (
                  <div key={nota.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600">N° Nota</p>
                        <p className="text-lg font-bold text-gray-900">{nota.numero_nota}</p>
                      </div>
                      <Badge variant={
                        nota.estado_mercaderia === 'conforme' ? 'success' :
                        nota.estado_mercaderia === 'no_conforme' ? 'danger' : 'warning'
                      }>
                        {nota.estado_mercaderia === 'conforme' ? 'Conforme' :
                         nota.estado_mercaderia === 'no_conforme' ? 'No Conforme' : 'Parcial'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p><span className="font-medium">Fecha:</span> {formatDate(nota.fecha_recepcion)}</p>
                      <p><span className="font-medium">Recibido por:</span> {nota.recibido_por || 'N/A'}</p>
                      <p><span className="font-medium">N° OC:</span> {nota.orden_compra_numero || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link to={`/notas-entrega/${nota.id}`} className="flex-1">
                        <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2">
                          <Eye size={16} />
                          Ver
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleEliminarNota(nota.id)}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Nota</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Recepción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recibido Por</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° OC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notas.map((nota) => (
                      <tr key={nota.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{nota.numero_nota}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(nota.fecha_recepcion)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{nota.recibido_por || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{nota.orden_compra_numero || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            nota.estado_mercaderia === 'conforme' ? 'success' :
                            nota.estado_mercaderia === 'no_conforme' ? 'danger' : 'warning'
                          }>
                            {nota.estado_mercaderia === 'conforme' ? 'Conforme' :
                             nota.estado_mercaderia === 'no_conforme' ? 'No Conforme' : 'Parcial'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Link to={`/notas-entrega/${nota.id}`}>
                              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Eye size={18} />
                              </button>
                            </Link>
                            <button 
                              onClick={() => handleEliminarNota(nota.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
) : documentos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl sm:text-5xl mb-4">📄</div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">
              No hay {tipoActual?.nombre.toLowerCase()} para mostrar
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              {soloHoy 
                ? 'No hay documentos para hoy. Desactiva "Solo hoy" para ver más resultados.'
                : 'Sube documentos desde la página "Subir Documentos"'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Cards móvil - Documentos */}
            <div className="block sm:hidden space-y-3">
              {documentos.map((doc) => (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600">
                        {tipoSeleccionado === 2 ? 'Guía de Remisión' :
                         tipoSeleccionado === 3 ? 'Orden de Compra' : 'Factura'}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {doc.numero_documento}
                      </p>
                    </div>
                    <Badge variant={getEstadoColor(doc.estado)}>
                      {formatEstado(doc.estado)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="truncate">
                      <span className="font-medium">
                        {tipoSeleccionado === 2 ? 'Transportista:' :
                         tipoSeleccionado === 3 ? 'Proveedor:' : 'Emisor:'}
                      </span>{' '}
                      {tipoSeleccionado === 2 
                        ? (doc.datos_guia_remision?.transportista_razon_social || doc.razon_social_emisor)
                        : tipoSeleccionado === 3 
                        ? doc.razon_social_cliente
                        : doc.razon_social_emisor}
                    </p>
                    <p>
                      <span className="font-medium">RUC:</span>{' '}
                      {tipoSeleccionado === 2 
                        ? (doc.datos_guia_remision?.transportista_ruc || doc.ruc_emisor)
                        : tipoSeleccionado === 3 
                        ? doc.ruc_cliente
                        : doc.ruc_emisor}
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span> {formatDate(doc.fecha_emision)}
                    </p>
                    {tipoSeleccionado !== 2 && (
                      <p>
                        <span className="font-medium">Total:</span> {formatMoney(doc.total, doc.moneda)}
                      </p>
                    )}
                    {tipoSeleccionado === 2 && doc.datos_guia_remision?.peso_bruto && (
                      <p>
                        <span className="font-medium">Peso:</span>{' '}
                        {doc.datos_guia_remision.peso_bruto} {doc.datos_guia_remision.unidad_peso}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Link 
                      to={
                        tipoSeleccionado === 2 ? `/validar-guia/${doc.id}` :
                        tipoSeleccionado === 3 ? `/validar-orden/${doc.id}` :
                        `/validar/${doc.id}`
                      }
                      className="flex-1"
                    >
                      <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2">
                        <Eye size={16} />
                        Ver
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleEliminar(doc.id)}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla desktop - Documentos */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {tipoSeleccionado === 2 ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Guía</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transportista</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Traslado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Peso</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </>
                    ) : tipoSeleccionado === 3 ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° OC</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Emisión</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Entrega</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emisor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documentos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      {tipoSeleccionado === 2 ? (
                        <>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {doc.datos_guia_remision?.numero_guia || doc.numero_documento}
                              </p>
                              <p className="text-xs text-gray-500">Doc: {doc.numero_documento}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm text-gray-900 max-w-xs truncate">
                                {doc.datos_guia_remision?.transportista_razon_social || doc.razon_social_emisor}
                              </p>
                              <p className="text-xs text-gray-500">
                                RUC: {doc.datos_guia_remision?.transportista_ruc || doc.ruc_emisor}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {doc.datos_guia_remision?.fecha_traslado 
                              ? formatDate(doc.datos_guia_remision.fecha_traslado)
                              : formatDate(doc.fecha_emision)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-600 max-w-xs">
                              <p className="truncate">
                                📍 {doc.datos_guia_remision?.punto_partida?.substring(0, 30) || 'N/A'}...
                              </p>
                              <p className="truncate">
                                📍 {doc.datos_guia_remision?.punto_llegada?.substring(0, 30) || 'N/A'}...
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {doc.datos_guia_remision?.peso_bruto 
                              ? `${doc.datos_guia_remision.peso_bruto} ${doc.datos_guia_remision.unidad_peso}`
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getEstadoColor(doc.estado)}>
                              {formatEstado(doc.estado)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Link to={`/validar-guia/${doc.id}`}>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Eye size={18} />
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleEliminar(doc.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : tipoSeleccionado === 3 ? (
                        <>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.numero_documento}</p>
                              <p className="text-xs text-gray-500">Serie: {doc.serie}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm text-gray-900 max-w-xs truncate">{doc.razon_social_cliente}</p>
                              <p className="text-xs text-gray-500">RUC: {doc.ruc_cliente}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDate(doc.fecha_emision)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {doc.datos_orden_compra?.fecha_entrega 
                              ? formatDate(doc.datos_orden_compra.fecha_entrega)
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatMoney(doc.total, doc.moneda)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getEstadoColor(doc.estado)}>
                              {formatEstado(doc.estado)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Link to={`/validar-orden/${doc.id}`}>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Eye size={18} />
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleEliminar(doc.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {doc.numero_documento || doc.numero_factura}
                              </p>
                              <p className="text-xs text-gray-500">{doc.ruc_emisor}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900 max-w-xs truncate">{doc.razon_social_emisor}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatDate(doc.fecha_emision)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatMoney(doc.total, doc.moneda)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getEstadoColor(doc.estado)}>
                              {formatEstado(doc.estado)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Link to={`/validar/${doc.id}`}>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Eye size={18} />
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleEliminar(doc.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Estadísticas rápidas */}
      {!loading && (tipoSeleccionado === 5 ? docsIdentidad.length > 0 : tipoSeleccionado === 4 ? notas.length > 0 : documentos.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {tipoSeleccionado === 5 ? (
            <>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{docsIdentidad.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {docsIdentidad.filter(d => d.tipo_documento === 'DNI').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">DNI</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {docsIdentidad.filter(d => d.tipo_documento === 'CARNET_EXTRANJERIA').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">CE</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {docsIdentidad.filter(d => d.tipo_documento === 'PASAPORTE').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Pasaportes</p>
                </div>
              </Card>
            </>
          ) : tipoSeleccionado === 4 ? (
            <>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{notas.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {notas.filter(n => n.estado_mercaderia === 'conforme').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Conformes</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {notas.filter(n => n.estado_mercaderia === 'no_conforme').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">No Conformes</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {notas.filter(n => n.estado_mercaderia === 'parcial').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Parciales</p>
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{documentos.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {documentos.filter(d => d.estado === 'pendiente_validacion').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Pendientes</p>
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {documentos.filter(d => d.estado === 'validada').length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Validadas</p>
                </div>
              </Card>
              {tipoSeleccionado === 2 ? (
                <Card className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">
                      {documentos
                        .filter(d => d.estado === 'validada')
                        .reduce((sum, d) => sum + parseFloat(d.datos_guia_remision?.peso_bruto || 0), 0)
                        .toFixed(2)} KG
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Total Peso</p>
                  </div>
                </Card>
              ) : (
                <Card className="p-3 sm:p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">
                      {formatMoney(
                        documentos
                          .filter(d => d.estado === 'validada')
                          .reduce((sum, d) => sum + parseFloat(d.total || 0), 0),
                        'PEN'
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Total Validado</p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {confirmacion.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmacion.mensaje}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmacion({ visible: false, mensaje: '', onConfirm: null })}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmacion.onConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}