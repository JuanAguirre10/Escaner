import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Building2 } from 'lucide-react';
import { Card, Loading, Badge } from '../components/common';
import { facturaService } from '../services';
import { formatMoney, formatConfianza } from '../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await facturaService.estadisticas();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Facturas */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Facturas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_facturas || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        {/* Pendientes */}
        <Link to="/pendientes">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats?.por_estado?.pendientes || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </Card>
        </Link>

        {/* Validadas */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validadas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats?.por_estado?.validadas || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        {/* Rechazadas */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rechazadas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats?.por_estado?.rechazadas || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Totales y OCR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Totales Monetarios */}
        <Card title="Totales Facturados">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Soles (PEN)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatMoney(stats?.totales?.soles || 0, 'PEN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dólares (USD)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatMoney(stats?.totales?.dolares || 0, 'USD')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Información del Sistema */}
        <Card title="Información del Sistema">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Proveedores</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats?.total_proveedores || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <CheckCircle className="text-indigo-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confianza OCR Promedio</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-gray-900">
                      {formatConfianza(stats?.confianza_ocr_promedio)}
                    </p>
                    <Badge variant={stats?.confianza_ocr_promedio >= 95 ? 'green' : stats?.confianza_ocr_promedio >= 80 ? 'yellow' : 'red'}>
                      {stats?.confianza_ocr_promedio >= 95 ? 'Excelente' : stats?.confianza_ocr_promedio >= 80 ? 'Bueno' : 'Regular'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card title="Acciones Rápidas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/upload"
            className="p-6 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
              <FileText className="text-primary-600" size={24} />
            </div>
            <p className="font-medium text-gray-900">Subir Nueva Factura</p>
            <p className="text-sm text-gray-600 mt-1">Procesar con OCR</p>
          </Link>

          <Link
            to="/pendientes"
            className="p-6 border-2 border-dashed border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all text-center group"
          >
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <p className="font-medium text-gray-900">Revisar Pendientes</p>
            <p className="text-sm text-gray-600 mt-1">{stats?.por_estado?.pendientes || 0} facturas</p>
          </Link>

          <Link
            to="/facturas"
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-center group"
          >
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
              <FileText className="text-gray-600" size={24} />
            </div>
            <p className="font-medium text-gray-900">Ver Todas</p>
            <p className="text-sm text-gray-600 mt-1">{stats?.total_facturas || 0} facturas</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}