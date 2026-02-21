import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loading } from '../components/common';
import { expedienteService } from '../services';
import { formatDate } from '../utils/formatters';

export default function ListaExpedientes() {
  const navigate = useNavigate();
  
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('completo');

  useEffect(() => {
    cargarExpedientes();
  }, [filtroEstado]);

  const cargarExpedientes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroEstado) {
        params.estado = filtroEstado;
      }
      const data = await expedienteService.listar(params);
      setExpedientes(data);
    } catch (error) {
      console.error('Error cargando expedientes:', error);
      toast.error('Error al cargar expedientes');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expedientes</h1>
          <p className="text-gray-600 mt-1">Gestión de expedientes documentales</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroEstado('completo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === 'completo'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completos
            </button>
            <button
              onClick={() => setFiltroEstado('en_proceso')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === 'en_proceso'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              En Proceso
            </button>
            <button
              onClick={() => setFiltroEstado('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos
            </button>
          </div>
        </div>
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
              Los expedientes completos aparecerán aquí
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
                          onClick={() => navigate(`/expedientes/${exp.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      )}
    </div>
  );
}