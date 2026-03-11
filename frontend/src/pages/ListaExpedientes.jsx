import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Eye, Calendar, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loading } from '../components/common';
import { expedienteService } from '../services';
import { formatDate } from '../utils/formatters';
import FiltrosFecha from '../components/FiltrosFecha';

export default function ListaExpedientes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [soloHoy, setSoloHoy] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [buscar, setBuscar] = useState('');
  const [soloIncompletos, setSoloIncompletos] = useState(
    searchParams.get('solo_incompletos') === 'true' || false
  );
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    cargarExpedientes();
  }, [soloHoy, fechaDesde, fechaHasta, buscar, soloIncompletos, filtroEstado]);

  const cargarExpedientes = async () => {
    try {
      setLoading(true);
      
      const params = {
        solo_hoy: soloHoy,
        solo_incompletos: soloIncompletos,
      };
      
      if (!soloHoy) {
        if (fechaDesde) params.fecha_desde = fechaDesde;
        if (fechaHasta) params.fecha_hasta = fechaHasta;
      }
      
      if (buscar) params.buscar = buscar;
      if (filtroEstado) params.estado = filtroEstado;
      
      const data = await expedienteService.listar(params);
      setExpedientes(data);
    } catch (error) {
      console.error('Error cargando expedientes:', error);
      toast.error('Error al cargar expedientes');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setSoloHoy(true);
    setFechaDesde('');
    setFechaHasta('');
    setBuscar('');
    setSoloIncompletos(false);
    setFiltroEstado('');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completo':
        return 'success';
      case 'en_proceso':
        return 'warning';
      case 'incompleto':
        return 'danger';
      case 'cerrado_manual':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatEstado = (estado) => {
    switch (estado) {
      case 'completo':
        return 'Completo';
      case 'en_proceso':
        return 'En Proceso';
      case 'incompleto':
        return 'Incompleto';
      case 'cerrado_manual':
        return 'Cerrado Manual';
      default:
        return estado;
    }
  };

  const descargarZip = async (expedienteId, codigoExpediente) => {
    try {
      const response = await fetch(
        `http://192.168.100.24:8001/api/v1/expedientes/${expedienteId}/descargar-zip`,
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
      a.download = `${codigoExpediente}.zip`;
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

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expedientes</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Gestión de expedientes documentales</p>
      </div>

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
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Búsqueda */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Buscar por Código o N° OC
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Código o número de OC..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
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
              <option value="completo">Completo</option>
              <option value="en_proceso">En Proceso</option>
              <option value="incompleto">Incompleto</option>
              <option value="cerrado_manual">Cerrado Manual</option>
            </select>
          </div>

          {/* Toggle Solo Incompletos */}
          <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <input
                type="checkbox"
                id="soloIncompletos"
                checked={soloIncompletos}
                onChange={(e) => setSoloIncompletos(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <label htmlFor="soloIncompletos" className="text-xs sm:text-sm font-medium text-orange-700 cursor-pointer">
                Solo expedientes incompletos
              </label>
            </div>
          </div>
        </div>

        {/* Indicador de filtro activo */}
        {soloIncompletos && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs sm:text-sm text-orange-800">
              📦 Mostrando solo expedientes <strong>incompletos</strong> (en proceso o incompletos)
            </p>
          </div>
        )}
      </Card>

      {/* Lista */}
      <Card>
        {loading ? (
          <Loading />
        ) : expedientes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl sm:text-5xl mb-4">📦</div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">No hay expedientes</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              {soloHoy 
                ? 'No hay expedientes para hoy. Desactiva "Solo hoy" para ver más resultados.'
                : soloIncompletos
                  ? 'No hay expedientes incompletos'
                  : 'Los expedientes aparecerán aquí'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Cards móvil */}
            <div className="block sm:hidden space-y-3">
              {expedientes.map((exp) => (
                <div key={exp.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Package className="text-blue-600 shrink-0" size={18} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {exp.codigo_expediente}
                        </p>
                        <p className="text-xs text-gray-600">N° OC: {exp.numero_orden_compra}</p>
                      </div>
                    </div>
                    <Badge variant={getEstadoColor(exp.estado)}>
                      {formatEstado(exp.estado)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>Creación: {formatDate(exp.fecha_creacion)}</span>
                    </div>
                    {exp.fecha_cierre && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Cierre: {formatDate(exp.fecha_cierre)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => navigate(`/expedientes/${exp.id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => descargarZip(exp.id, exp.codigo_expediente)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800"
                      title="Descargar ZIP"
                    >
                      <Download size={16} />
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° OC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Creación</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Cierre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expedientes.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="text-blue-600" size={18} />
                          <span className="text-sm font-medium text-gray-900">
                            {exp.codigo_expediente}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {exp.numero_orden_compra}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(exp.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {exp.fecha_cierre ? formatDate(exp.fecha_cierre) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getEstadoColor(exp.estado)}>
                          {formatEstado(exp.estado)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/expedientes/${exp.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => descargarZip(exp.id, exp.codigo_expediente)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Descargar expediente completo"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Estadísticas */}
      {!loading && expedientes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{expedientes.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {expedientes.filter(e => e.estado === 'completo').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Completos</p>
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                {expedientes.filter(e => e.estado === 'en_proceso').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">En Proceso</p>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                {expedientes.filter(e => e.estado === 'incompleto').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Incompletos</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}