import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Building2, Package, ClipboardCheck } from 'lucide-react';
import { Card, Loading, Badge } from '../components/common';
import { documentoService } from '../services';
import { formatMoney, formatConfianza } from '../utils/formatters';
import FiltrosFecha from '../components/FiltrosFecha';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de filtros
  const [soloHoy, setSoloHoy] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    cargarEstadisticas();
  }, [soloHoy, fechaDesde, fechaHasta]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        solo_hoy: soloHoy
      });
      
      if (!soloHoy) {
        if (fechaDesde) params.append('fecha_desde', fechaDesde);
        if (fechaHasta) params.append('fecha_hasta', fechaHasta);
      }
      
      const data = await documentoService.estadisticas(params.toString());
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setSoloHoy(true);
    setFechaDesde('');
    setFechaHasta('');
  };

  if (loading) return <Loading fullScreen />;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Resumen general del sistema SUPERVAN</p>
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

      {/* Stats Cards - Fila 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Documentos */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Documentos</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                {stats?.total_documentos || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg shrink-0">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
        </Card>

        {/* Pendientes */}
        <Link to="/pendientes">
          <Card className="p-4 sm:p-6 hover:shadow-md active:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">
                  {stats?.por_estado?.pendientes || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg shrink-0">
                <Clock className="text-yellow-600" size={20} />
              </div>
            </div>
          </Card>
        </Link>

        {/* Validadas */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Validadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
                {stats?.por_estado?.validadas || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg shrink-0">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </Card>

        {/* Rechazadas */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Rechazadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
                {stats?.por_estado?.rechazadas || 0}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg shrink-0">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Cards - Fila 2: Expedientes y Notas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Total Expedientes */}
        <Link to="/expedientes">
          <Card className="p-4 sm:p-6 hover:shadow-md active:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Expedientes</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">
                  {stats?.expedientes?.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.expedientes?.completos || 0} completos
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg shrink-0">
                <Package className="text-purple-600" size={20} />
              </div>
            </div>
          </Card>
        </Link>

        {/* Expedientes Incompletos */}
        <Link to="/expedientes?solo_incompletos=true">
          <Card className="p-4 sm:p-6 hover:shadow-md active:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Expedientes Incompletos</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1 sm:mt-2">
                  {stats?.expedientes?.incompletos || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg shrink-0">
                <Package className="text-orange-600" size={20} />
              </div>
            </div>
          </Card>
        </Link>

        {/* Notas de Entrega */}
        <Link to="/notas-entrega">
          <Card className="p-4 sm:p-6 hover:shadow-md active:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Notas de Entrega</p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-1 sm:mt-2">
                  {stats?.total_notas || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg shrink-0">
                <ClipboardCheck className="text-indigo-600" size={20} />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Totales y OCR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Totales Monetarios */}
        <Card title="Totales Facturados (Validados)">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-green-100 rounded-lg shrink-0">
                  <TrendingUp className="text-green-600" size={18} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Soles (PEN)</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatMoney(stats?.totales?.soles || 0, 'PEN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <TrendingUp className="text-blue-600" size={18} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Dólares (USD)</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatMoney(stats?.totales?.dolares || 0, 'USD')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Información del Sistema */}
        <Card title="Información del Sistema">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                  <Building2 className="text-purple-600" size={18} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Empresas</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {stats?.total_empresas || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                  <CheckCircle className="text-indigo-600" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Confianza OCR Promedio</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatConfianza(stats?.confianza_ocr_promedio)}
                    </p>
                    <Badge variant={stats?.confianza_ocr_promedio >= 95 ? 'success' : stats?.confianza_ocr_promedio >= 80 ? 'warning' : 'danger'}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/upload"
            className="p-4 sm:p-6 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 active:bg-primary-100 transition-all text-center group"
          >
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-primary-200 transition-colors">
              <FileText className="text-primary-600" size={20} />
            </div>
            <p className="font-medium text-gray-900 text-sm sm:text-base">Subir Documentos</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Procesar con OCR</p>
          </Link>

          <Link
            to="/pendientes"
            className="p-4 sm:p-6 border-2 border-dashed border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 active:bg-yellow-100 transition-all text-center group"
          >
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-yellow-200 transition-colors">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <p className="font-medium text-gray-900 text-sm sm:text-base">Revisar Pendientes</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{stats?.por_estado?.pendientes || 0} items</p>
          </Link>

          <Link
            to="/expedientes"
            className="p-4 sm:p-6 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 active:bg-purple-100 transition-all text-center group"
          >
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-purple-200 transition-colors">
              <Package className="text-purple-600" size={20} />
            </div>
            <p className="font-medium text-gray-900 text-sm sm:text-base">Ver Expedientes</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{stats?.expedientes?.total || 0} expedientes</p>
          </Link>

          <Link
            to="/facturas"
            className="p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-all text-center group"
          >
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-gray-200 transition-colors">
              <FileText className="text-gray-600" size={20} />
            </div>
            <p className="font-medium text-gray-900 text-sm sm:text-base">Ver Todos</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{stats?.total_documentos || 0} documentos</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}