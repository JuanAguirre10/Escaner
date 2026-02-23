import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Package, FileText, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Loading, Badge } from '../components/common';
import { notaEntregaService } from '../services';
import { formatDate } from '../utils/formatters';

export default function VerNotaEntrega() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [nota, setNota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarNota();
  }, [id]);

  const cargarNota = async () => {
    try {
      setLoading(true);
      const data = await notaEntregaService.obtener(id);
      setNota(data);
    } catch (error) {
      console.error('Error cargando nota:', error);
      toast.error('Error al cargar la nota de entrega');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!nota) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nota de entrega no encontrada</p>
        <Button onClick={() => navigate('/notas-entrega')} className="mt-4">
          Volver a Notas
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/notas-entrega')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{nota.numero_nota}</h1>
          <p className="text-gray-600 mt-1">Nota de Entrega</p>
        </div>
        <Badge variant={
          nota.estado_mercaderia === 'conforme' ? 'success' :
          nota.estado_mercaderia === 'no_conforme' ? 'danger' : 'warning'
        }>
          {nota.estado_mercaderia === 'conforme' ? 'Conforme' :
           nota.estado_mercaderia === 'no_conforme' ? 'No Conforme' : 'Parcial'}
        </Badge>
      </div>

      {/* Información General */}
      <Card title="Información de Recepción">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Fecha de Recepción</p>
              <p className="font-medium text-lg">{formatDate(nota.fecha_recepcion)}</p>
            </div>
          </div>

          {nota.recibido_por && (
            <div className="flex items-start gap-3">
              <User className="text-green-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Recibido Por</p>
                <p className="font-medium text-lg">{nota.recibido_por}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <ClipboardCheck className="text-purple-600 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Estado de Mercadería</p>
              <p className="font-medium text-lg">
                {nota.estado_mercaderia === 'conforme' ? 'Conforme' :
                 nota.estado_mercaderia === 'no_conforme' ? 'No Conforme' : 'Parcial'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Referencias */}
      <Card title="Referencias del Expediente">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Package className="text-blue-600 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">N° Orden de Compra</p>
              <p className="font-medium text-lg">{nota.orden_compra_numero || 'N/A'}</p>
            </div>
          </div>

          {nota.factura_numero && (
            <div className="flex items-start gap-3">
              <FileText className="text-green-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">N° Factura</p>
                <p className="font-medium text-lg">{nota.factura_numero}</p>
              </div>
            </div>
          )}

          {nota.guia_numero && (
            <div className="flex items-start gap-3">
              <FileText className="text-orange-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">N° Guía de Remisión</p>
                <p className="font-medium text-lg">{nota.guia_numero}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Observaciones */}
      {nota.observaciones && (
        <Card title="Observaciones">
          <p className="text-gray-700 whitespace-pre-wrap">{nota.observaciones}</p>
        </Card>
      )}

      {/* Información de Registro */}
      <Card title="Información de Registro">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Creado por</p>
            <p className="font-medium">{nota.created_by || 'admin'}</p>
          </div>
          {nota.created_at && (
            <div>
              <p className="text-gray-600">Fecha de creación</p>
              <p className="font-medium">{formatDate(nota.created_at)}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}