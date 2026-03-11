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
      
      // Si es tipo 4 (Notas), cargar notas
      if (tipoSeleccionado === 4) {
        const notasData = await notaEntregaService.listar();
        setNotas(notasData);
        setDocumentos([]);
        setDocsIdentidad([]);
      } 
      // Si es tipo 5 (Doc Identidad), cargar documentos de identidad
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
        // Cargar documentos normales
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

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await documentoService.eliminar(id);
      toast.success('Documento eliminado');
      cargarDocumentos();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('Error al eliminar documento');
    }
  };

  const handleEliminarNota = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

    try {
      await notaEntregaService.eliminar(id);
      toast.success('Nota eliminada');
      cargarDocumentos();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('Error al eliminar nota');
    }
  };

  const handleEliminarIdentidad = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este documento de identidad?')) return;

    try {
      await documentoIdentidadService.eliminar(id);
      toast.success('Documento de identidad eliminado');
      cargarDocumentos();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('Error al eliminar documento de identidad');
    }
  };

  const tipoActual = tiposDocumento.find(t => t.id === tipoSeleccionado);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lista de Documentos</h1>
        <p className="text-gray-600 mt-1">Todos los documentos procesados por tipo</p>
      </div>

      {/* Pestañas de Tipos de Documento */}
      <Card>
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8 overflow-x-auto">
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

              return (
                <button
                  key={tipo.id}
                  onClick={() => estaHabilitado && setTipoSeleccionado(tipo.id)}
                  disabled={!estaHabilitado}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${esActivo
                      ? 'border-blue-500 text-blue-600'
                      : estaHabilitado
                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  {tipo.nombre}
                  {!estaHabilitado && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                      Próximamente
                    </span>
                  )}
                </button>
              );
            })}
            
            {/* Pestaña Documentos de Identidad */}
            <button
              onClick={() => setTipoSeleccionado(5)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${tipoSeleccionado === 5
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Doc. Identidad
            </button>
          </nav>
        </div>

        {/* Información del tipo seleccionado */}
        {tipoActual && tipoSeleccionado !== 5 && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Mostrando:</span> {tipoActual.descripcion}
            </p>
          </div>
        )}

        {tipoSeleccionado === 5 && (
          <div className="mb-6 bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-900">
              <span className="font-medium">Mostrando:</span> Documentos de identidad de visitantes/entregadores
            </p>
          </div>
        )}

        {/* Filtros - Solo para documentos normales, no para notas ni identidad */}
        {tipoSeleccionado !== 4 && tipoSeleccionado !== 5 && (
          <>
            {/* Filtros de Fecha */}
            <FiltrosFecha
              soloHoy={soloHoy}
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
              onSoloHoyChange={setSoloHoy}
              onFechaDesdeChange={setFechaDesde}
              onFechaHastaChange={setFechaHasta}
              onLimpiar={handleLimpiarFiltros}
            />

            {/* Filtros Adicionales */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Búsqueda General */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={buscarGeneral}
                      onChange={(e) => setBuscarGeneral(e.target.value)}
                      placeholder="Número, RUC o razón social..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Búsqueda por OC */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Número de Orden de Compra
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={busquedaOC}
                      onChange={(e) => setBusquedaOC(e.target.value)}
                      placeholder="Número de OC..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filtro por Estado */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Tabla */}
        {loading ? (
          <Loading />
        ) : tipoSeleccionado === 5 ? (
          // TABLA DE DOCUMENTOS DE IDENTIDAD
          docsIdentidad.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">🪪</div>
              <p className="text-gray-500 font-medium">No hay documentos de identidad</p>
              <p className="text-sm text-gray-400 mt-2">
                Los documentos de identidad se registran al subir documentos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {doc.numero_documento}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {doc.nombre_completo || `${doc.nombres || ''} ${doc.apellidos || ''}`.trim()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {doc.expediente_codigo || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(doc.created_at)}
                      </td>
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
          )
        ) : tipoSeleccionado === 4 ? (
          // TABLA DE NOTAS DE ENTREGA
          notas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📋</div>
              <p className="text-gray-500 font-medium">No hay notas de entrega</p>
              <p className="text-sm text-gray-400 mt-2">
                Las notas se crean desde "Subir Documentos"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {nota.numero_nota}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(nota.fecha_recepcion)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {nota.recibido_por || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {nota.orden_compra_numero || 'N/A'}
                      </td>
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
          )
        ) : documentos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📄</div>
            <p className="text-gray-500 font-medium">
              No hay {tipoActual?.nombre.toLowerCase()} para mostrar
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {soloHoy 
                ? 'No hay documentos para hoy. Desactiva "Solo hoy" para ver más resultados.'
                : 'Sube documentos desde la página "Subir Documentos"'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {tipoSeleccionado === 2 ? (
                    // COLUMNAS GUÍA DE REMISIÓN
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
                    // COLUMNAS ORDEN DE COMPRA
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
                    // COLUMNAS FACTURA / OTROS
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
                      // FILA GUÍA DE REMISIÓN
                      <>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.datos_guia_remision?.numero_guia || doc.numero_documento}
                            </p>
                            <p className="text-xs text-gray-500">
                              Doc: {doc.numero_documento}
                            </p>
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
                            : formatDate(doc.fecha_emision)
                          }
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
                            : 'N/A'
                          }
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
                      // FILA ORDEN DE COMPRA
                      <>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.numero_documento}
                            </p>
                            <p className="text-xs text-gray-500">Serie: {doc.serie}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900 max-w-xs truncate">
                              {doc.razon_social_cliente}
                            </p>
                            <p className="text-xs text-gray-500">RUC: {doc.ruc_cliente}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(doc.fecha_emision)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {doc.datos_orden_compra?.fecha_entrega 
                            ? formatDate(doc.datos_orden_compra.fecha_entrega)
                            : 'N/A'
                          }
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
                      // FILA FACTURA / OTROS
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
                          <p className="text-sm text-gray-900 max-w-xs truncate">
                            {doc.razon_social_emisor}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(doc.fecha_emision)}
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
        )}
      </Card>

      {/* Estadísticas rápidas */}
      {!loading && (tipoSeleccionado === 5 ? docsIdentidad.length > 0 : tipoSeleccionado === 4 ? notas.length > 0 : documentos.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {tipoSeleccionado === 5 ? (
            // Estadísticas para Documentos de Identidad
            <>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{docsIdentidad.length}</p>
                  <p className="text-sm text-gray-600">Total Registrados</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {docsIdentidad.filter(d => d.tipo_documento === 'DNI').length}
                  </p>
                  <p className="text-sm text-gray-600">DNI</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {docsIdentidad.filter(d => d.tipo_documento === 'CARNET_EXTRANJERIA').length}
                  </p>
                  <p className="text-sm text-gray-600">Carnet Extranjería</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {docsIdentidad.filter(d => d.tipo_documento === 'PASAPORTE').length}
                  </p>
                  <p className="text-sm text-gray-600">Pasaportes</p>
                </div>
              </Card>
            </>
          ) : tipoSeleccionado === 4 ? (
            // Estadísticas para Notas
            <>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{notas.length}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {notas.filter(n => n.estado_mercaderia === 'conforme').length}
                  </p>
                  <p className="text-sm text-gray-600">Conformes</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {notas.filter(n => n.estado_mercaderia === 'no_conforme').length}
                  </p>
                  <p className="text-sm text-gray-600">No Conformes</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {notas.filter(n => n.estado_mercaderia === 'parcial').length}
                  </p>
                  <p className="text-sm text-gray-600">Parciales</p>
                </div>
              </Card>
            </>
          ) : (
            // Estadísticas para Documentos
            <>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{documentos.length}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {documentos.filter(d => d.estado === 'pendiente_validacion').length}
                  </p>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {documentos.filter(d => d.estado === 'validada').length}
                  </p>
                  <p className="text-sm text-gray-600">Validadas</p>
                </div>
              </Card>
              
              {tipoSeleccionado === 2 ? (
                <Card>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {documentos
                        .filter(d => d.estado === 'validada')
                        .reduce((sum, d) => sum + parseFloat(d.datos_guia_remision?.peso_bruto || 0), 0)
                        .toFixed(2)} KG
                    </p>
                    <p className="text-sm text-gray-600">Total Peso</p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatMoney(
                        documentos
                          .filter(d => d.estado === 'validada')
                          .reduce((sum, d) => sum + parseFloat(d.total || 0), 0),
                        'PEN'
                      )}
                    </p>
                    <p className="text-sm text-gray-600">Total Validado</p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}