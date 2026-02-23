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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notas de Entrega</h1>
          <p className="text-gray-600 mt-1">Registro de recepción de mercadería</p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/upload')}
        >
          <Plus size={20} />
          Ir a Subir Documentos
        </Button>
      </div>

      {/* Lista */}
      <Card>
        {loading ? (
          <Loading />
        ) : notas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium">No hay notas de entrega</p>
            <p className="text-sm text-gray-400 mt-2">
              Las notas se crean desde la sección "Subir Documentos"
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
        )}
      </Card>

      {/* Estadísticas */}
      {!loading && notas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>
      )}
    </div>
  );
}
