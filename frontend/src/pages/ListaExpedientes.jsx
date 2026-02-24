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
      default:
        return estado;
    }
  };

  const descargarZip = async (expedienteId, codigoExpediente) => {
    try {
      const response = await fetch(
        `http://localhost:8001/api/v1/expedientes/${expedienteId}/descargar-zip`,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expedientes</h1>
          <p className="text-gray-600 mt-1">Gestión de expedientes documentales</p>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Buscar por Código o N° OC
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Código o número de OC..."
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
              <option value="completo">Completo</option>
              <option value="en_proceso">En Proceso</option>
              <option value="incompleto">Incompleto</option>
            </select>
          </div>

          {/* Toggle Solo Incompletos */}
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <input
                type="checkbox"
                id="soloIncompletos"
                checked={soloIncompletos}
                onChange={(e) => setSoloIncompletos(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <label htmlFor="soloIncompletos" className="text-sm font-medium text-orange-700 cursor-pointer">
                Solo expedientes incompletos
              </label>
            </div>
          </div>
        </div>

        {/* Indicador de filtro activo */}
        {soloIncompletos && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
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
            <div className="text-gray-400 text-5xl mb-4">📦</div>
            <p className="text-gray-500 font-medium">No hay expedientes</p>
            <p className="text-sm text-gray-400 mt-2">
              {soloHoy 
                ? 'No hay expedientes para hoy. Desactiva "Solo hoy" para ver más resultados.'
                : soloIncompletos
                  ? 'No hay expedientes incompletos'
                  : 'Los expedientes aparecerán aquí'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                          onClick={() => {
                            console.log('Navegando a expediente:', exp.id);
                            navigate(`/expedientes/${exp.id}`);
                          }}
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
        )}
      </Card>

      {/* Estadísticas */}
      {!loading && expedientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{expedientes.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {expedientes.filter(e => e.estado === 'completo').length}
              </p>
              <p className="text-sm text-gray-600">Completos</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {expedientes.filter(e => e.estado === 'en_proceso').length}
              </p>
              <p className="text-sm text-gray-600">En Proceso</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {expedientes.filter(e => e.estado === 'incompleto').length}
              </p>
              <p className="text-sm text-gray-600">Incompletos</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}