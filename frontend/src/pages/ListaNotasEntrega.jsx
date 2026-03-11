import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loading } from '../components/common';
import { notaEntregaService } from '../services';
import { formatDate } from '../utils/formatters';

export default function ListaNotasEntrega() {
  const navigate = useNavigate();
  
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando notas de entrega...');
      const data = await notaEntregaService.listar();
      console.log('📋 Notas recibidas:', data);
      setNotas(data);
    } catch (error) {
      console.error('Error cargando notas:', error);
      toast.error('Error al cargar notas de entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta nota de entrega?')) return;

    try {
      await notaEntregaService.eliminar(id);
      toast.success('Nota eliminada correctamente');
      cargarNotas();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('Error al eliminar la nota');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'conforme':
        return 'success';
      case 'no_conforme':
        return 'danger';
      case 'parcial':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatEstado = (estado) => {
    switch (estado) {
      case 'conforme':
        return 'Conforme';
      case 'no_conforme':
        return 'No Conforme';
      case 'parcial':
        return 'Parcial';
      default:
        return estado;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notas de Entrega</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Registro de recepción de mercadería</p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/upload')}
          className="w-full sm:w-auto"
        >
          <Plus size={18} />
          <span className="sm:inline">Ir a Subir Documentos</span>
        </Button>
      </div>

      {/* Lista */}
      <Card>
        {loading ? (
          <Loading />
        ) : notas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl sm:text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">No hay notas de entrega</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Las notas se crean desde la sección "Subir Documentos"
            </p>
          </div>
        ) : (
          <>
            {/* Cards móvil */}
            <div className="block sm:hidden space-y-3">
              {notas.map((nota) => (
                <div key={nota.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="text-blue-600 shrink-0" size={18} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600">Nota de Entrega</p>
                        <p className="text-lg font-bold text-gray-900">{nota.numero_nota}</p>
                      </div>
                    </div>
                    <Badge variant={getEstadoColor(nota.estado_mercaderia)}>
                      {formatEstado(nota.estado_mercaderia)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>
                      <span className="font-medium">Fecha:</span> {formatDate(nota.fecha_recepcion)}
                    </p>
                    <p>
                      <span className="font-medium">Recibido por:</span> {nota.recibido_por || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">N° OC:</span> {nota.orden_compra_numero || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => navigate(`/notas-entrega/${nota.id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => handleEliminar(nota.id)}
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="text-blue-600" size={18} />
                          <span className="text-sm font-medium text-gray-900">
                            {nota.numero_nota}
                          </span>
                        </div>
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
                        <Badge variant={getEstadoColor(nota.estado_mercaderia)}>
                          {formatEstado(nota.estado_mercaderia)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/notas-entrega/${nota.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminar(nota.id)}
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
        )}
      </Card>

      {/* Estadísticas */}
      {!loading && notas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
        </div>
      )}
    </div>
  );
}