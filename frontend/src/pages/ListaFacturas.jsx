import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Edit, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loading, Input } from '../components/common';
import { documentoService as facturaService } from '../services';
import { formatDate, formatMoney, getEstadoColor, formatEstado } from '../utils/formatters';

export default function ListaFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    buscar: '',
    estado: '',
  });

  useEffect(() => {
    cargarFacturas();
  }, [filtros]);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filtros.buscar) params.buscar = filtros.buscar;
      if (filtros.estado) params.estado = filtros.estado;
      
      const data = await facturaService.listar(params);
      setFacturas(data);
    } catch (error) {
      console.error('Error cargando facturas:', error);
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;

    try {
      await facturaService.eliminar(id);
      toast.success('Factura eliminada');
      cargarFacturas();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast.error('Error al eliminar factura');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lista de Facturas</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Todas las facturas procesadas</p>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por número o razón social..."
              value={filtros.buscar}
              onChange={(e) => setFiltros(prev => ({ ...prev, buscar: e.target.value }))}
              className="text-sm"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente_validacion">Pendiente</option>
              <option value="validada">Validada</option>
              <option value="rechazada">Rechazada</option>
              <option value="duplicada">Duplicada</option>
            </select>
          </div>

          <Button 
            variant="primary" 
            onClick={cargarFacturas}
            className="w-full sm:w-auto"
          >
            <Filter size={18} />
            <span className="sm:inline">Filtrar</span>
          </Button>
        </div>
      </Card>

      {/* Contenido */}
      <Card>
        {loading ? (
          <Loading />
        ) : facturas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl sm:text-5xl mb-4">📄</div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">No hay facturas para mostrar</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Ajusta los filtros o sube nuevos documentos
            </p>
          </div>
        ) : (
          <>
            {/* Cards móvil */}
            <div className="block sm:hidden space-y-3">
              {facturas.map((factura) => (
                <div key={factura.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600">Factura</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {factura.numero_documento || factura.numero_factura}
                      </p>
                      <p className="text-xs text-gray-500">RUC: {factura.ruc_emisor}</p>
                    </div>
                    <Badge variant={getEstadoColor(factura.estado)}>
                      {formatEstado(factura.estado)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="truncate">
                      <span className="font-medium">Emisor:</span> {factura.razon_social_emisor}
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span> {formatDate(factura.fecha_emision)}
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {formatMoney(factura.total, factura.moneda)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Link to={`/validar/${factura.id}`} className="flex-1">
                      <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2">
                        <Eye size={16} />
                        Ver
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleEliminar(factura.id)}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emisor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facturas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {factura.numero_documento || factura.numero_factura}
                          </p>
                          <p className="text-xs text-gray-500">{factura.ruc_emisor}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 max-w-xs truncate">
                          {factura.razon_social_emisor}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(factura.fecha_emision)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatMoney(factura.total, factura.moneda)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getEstadoColor(factura.estado)}>
                          {formatEstado(factura.estado)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`/validar/${factura.id}`}>
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye size={18} />
                            </button>
                          </Link>
                          <button 
                            onClick={() => handleEliminar(factura.id)}
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
    </div>
  );
}