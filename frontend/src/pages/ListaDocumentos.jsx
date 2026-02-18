import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loading, Input } from '../components/common';
import { documentoService, tipoDocumentoService } from '../services';
import { formatDate, formatMoney, getEstadoColor, formatEstado } from '../utils/formatters';
import { TIPOS_DOCUMENTO } from '../utils/constants';

export default function ListaDocumentos() {
  const [documentos, setDocumentos] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_DOCUMENTO.FACTURA);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    buscar: '',
    estado: '',
  });

  useEffect(() => {
    cargarTiposDocumento();
  }, []);

  useEffect(() => {
    cargarDocumentos();
  }, [tipoSeleccionado, filtros]);

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
      const params = {
        tipo_documento_id: tipoSeleccionado,
      };
      
      if (filtros.buscar) params.buscar = filtros.buscar;
      if (filtros.estado) params.estado = filtros.estado;
      
      const data = await documentoService.listar(params);
      setDocumentos(data);
    } catch (error) {
      console.error('Error cargando documentos:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
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
          <nav className="flex -mb-px space-x-8">
            {tiposDocumento.map((tipo) => {
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
          </nav>
        </div>

        {/* Información del tipo seleccionado */}
        {tipoActual && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Mostrando:</span> {tipoActual.descripcion}
            </p>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por número o razón social..."
              value={filtros.buscar}
              onChange={(e) => setFiltros(prev => ({ ...prev, buscar: e.target.value }))}
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente_validacion">Pendiente</option>
              <option value="validada">Validada</option>
              <option value="rechazada">Rechazada</option>
              <option value="duplicada">Duplicada</option>
            </select>
          </div>

          <Button variant="primary" onClick={cargarDocumentos}>
            <Filter size={20} />
            Filtrar
          </Button>
        </div>

        {/* Tabla */}
        {loading ? (
          <Loading />
        ) : documentos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📄</div>
            <p className="text-gray-500 font-medium">
              No hay {tipoActual?.nombre.toLowerCase()} para mostrar
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Sube documentos desde la página "Subir Documentos"
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
      {!loading && documentos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>
      )}
    </div>
  );
}