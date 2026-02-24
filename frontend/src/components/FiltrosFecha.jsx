import React from 'react';
import { Calendar, X, Filter } from 'lucide-react';

const FiltrosFecha = ({ 
  fechaDesde, 
  fechaHasta, 
  soloHoy,
  onFechaDesdeChange, 
  onFechaHastaChange,
  onSoloHoyChange,
  onLimpiar,
  mostrarSoloHoy = true
}) => {
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-700">Filtros de Fecha</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Solo Hoy Toggle */}
        {mostrarSoloHoy && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="soloHoy"
              checked={soloHoy}
              onChange={(e) => onSoloHoyChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="soloHoy" className="text-sm font-medium text-gray-700 cursor-pointer">
              Solo hoy
            </label>
          </div>
        )}

        {/* Fecha Desde */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => onFechaDesdeChange(e.target.value)}
              max={fechaHasta || hoy}
              disabled={soloHoy}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Fecha Hasta */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => onFechaHastaChange(e.target.value)}
              min={fechaDesde}
              max={hoy}
              disabled={soloHoy}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Botón Limpiar */}
        <div className="flex items-end">
          <button
            onClick={onLimpiar}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Indicador de filtros activos */}
      {!soloHoy && (fechaDesde || fechaHasta) && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            📅 Mostrando del{' '}
            <strong>{fechaDesde || 'inicio'}</strong> al{' '}
            <strong>{fechaHasta || 'hoy'}</strong>
          </p>
        </div>
      )}

      {soloHoy && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
            📅 Mostrando solo documentos <strong>subidos hoy</strong>
            </p>
        </div>
        )}
    </div>
  );
};

export default FiltrosFecha;