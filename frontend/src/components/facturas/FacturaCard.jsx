import { Link } from 'react-router-dom';
import { Eye, AlertCircle } from 'lucide-react';
import { Badge } from '../common';
import { formatDate, formatMoney, getEstadoColor, formatEstado, getConfianzaColor, formatConfianza } from '../../utils/formatters';

export default function FacturaCard({ factura }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {factura.numero_factura}
            </h3>
            <Badge variant={getEstadoColor(factura.estado)}>
              {formatEstado(factura.estado)}
            </Badge>
            <Badge variant={getConfianzaColor(factura.confianza_ocr_promedio)}>
              {formatConfianza(factura.confianza_ocr_promedio)}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-1">
            {factura.razon_social_emisor}
          </p>
          <p className="text-xs text-gray-500">
            RUC: {factura.ruc_emisor}
          </p>
        </div>

        <Link to={`/validar/${factura.id}`}>
          <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <Eye size={20} />
          </button>
        </Link>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Fecha</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(factura.fecha_emision)}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">
            {formatMoney(factura.total, factura.moneda)}
          </p>
        </div>
      </div>

      {factura.es_duplicada && (
        <div className="mt-4 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
          <AlertCircle size={16} />
          <span>Posible duplicado</span>
        </div>
      )}
    </div>
  );
}