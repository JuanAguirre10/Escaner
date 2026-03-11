import { Link } from 'react-router-dom';
import { Eye, AlertCircle } from 'lucide-react';
import { Badge } from '../common';
import { formatDate, formatMoney, getEstadoColor, formatEstado, getConfianzaColor, formatConfianza } from '../../utils/formatters';

export default function FacturaCard({ factura }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {factura.numero_factura}
            </h3>
            <Badge variant={getEstadoColor(factura.estado)} className="text-xs shrink-0">
              {formatEstado(factura.estado)}
            </Badge>
            <Badge variant={getConfianzaColor(factura.confianza_ocr_promedio)} className="text-xs shrink-0">
              {formatConfianza(factura.confianza_ocr_promedio)}
            </Badge>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
            {factura.razon_social_emisor}
          </p>
          <p className="text-xs text-gray-500 truncate">
            RUC: {factura.ruc_emisor}
          </p>
        </div>

        <Link to={`/validar/${factura.id}`}>
          <button className="p-2 text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-lg transition-colors shrink-0">
            <Eye size={18} />
          </button>
        </Link>
      </div>

      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Fecha</p>
          <p className="text-xs sm:text-sm font-medium text-gray-900">
            {formatDate(factura.fecha_emision)}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-base sm:text-lg font-bold text-gray-900">
            {formatMoney(factura.total, factura.moneda)}
          </p>
        </div>
      </div>

      {factura.es_duplicada && (
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
          <AlertCircle size={16} className="shrink-0" />
          <span>Posible duplicado</span>
        </div>
      )}
    </div>
  );
}
