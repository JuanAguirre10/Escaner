import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FileText, Truck, ClipboardCheck, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Loading, Badge } from '../components/common';
import { expedienteService } from '../services';
import { formatDate } from '../utils/formatters';

export default function VerExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarExpediente();
  }, [id]);

  const cargarExpediente = async () => {
    try {
      setLoading(true);
      const data = await expedienteService.obtener(id);
      setExpediente(data);
    } catch (error) {
      console.error('Error cargando expediente:', error);
      toast.error('Error al cargar el expediente');
    } finally {
      setLoading(false);
    }
  };

  const descargarZip = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/expedientes/${id}/descargar-zip`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Error al descargar el ZIP');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${expediente.codigo_expediente}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Expediente descargado correctamente');
    } catch (error) {
      console.error('Error descargando ZIP:', error);
      toast.error('Error al descargar el expediente');
    }
  };

  const getTipoDocumento = (tipoId) => {
    switch (tipoId) {
      case 1: return 'Factura';
      case 2: return 'Guía de Remisión';
      case 3: return 'Orden de Compra';
      default: return 'Desconocido';
    }
  };

  const getIconoDocumento = (tipoId) => {
    switch (tipoId) {
      case 1: return <FileText className="text-green-600" size={20} />;
      case 2: return <Truck className="text-orange-600" size={20} />;
      case 3: return <Package className="text-blue-600" size={20} />;
      default: return <FileText className="text-gray-600" size={20} />;
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!expediente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Expediente no encontrado</p>
        <Button onClick={() => navigate('/expedientes')} className="mt-4">
          Volver a Expedientes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/expedientes')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{expediente.codigo_expediente}</h1>
          <p className="text-gray-600 mt-1">Orden de Compra: {expediente.numero_orden_compra}</p>
        </div>
        <Badge variant={expediente.estado === 'completo' ? 'success' : 'warning'}>
          {expediente.estado === 'completo' ? 'Completo' : 'En Proceso'}
        </Badge>
        <Button variant="success" onClick={descargarZip}>
          <Download size={20} />
          Descargar ZIP
        </Button>
      </div>

      {/* Información General */}
      <Card title="Información General">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Fecha Creación</p>
            <p className="font-medium">{formatDate(expediente.fecha_creacion)}</p>
          </div>
          {expediente.fecha_cierre && (
            <div>
              <p className="text-sm text-gray-600">Fecha Cierre</p>
              <p className="font-medium">{formatDate(expediente.fecha_cierre)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Documentos */}
      <Card title="Documentos del Expediente">
        <div className="space-y-3">
          {expediente.documentos && expediente.documentos.length > 0 ? (
            expediente.documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getIconoDocumento(doc.tipo_documento_id)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {getTipoDocumento(doc.tipo_documento_id)}
                    </p>
                    <p className="text-sm text-gray-600">{doc.numero_documento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={doc.estado === 'validada' ? 'success' : 'warning'}>
                    {doc.estado}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (doc.tipo_documento_id === 3) {
                        navigate(`/validar-orden/${doc.id}`);
                      } else if (doc.tipo_documento_id === 2) {
                        navigate(`/validar-guia/${doc.id}`);
                      } else {
                        navigate(`/validar/${doc.id}`);
                      }
                    }}
                  >
                    <Eye size={16} />
                    Ver
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No hay documentos</p>
          )}
        </div>
      </Card>

      {/* Notas de Entrega */}
      <Card title="Notas de Entrega">
        <div className="space-y-3">
          {expediente.notas_entrega && expediente.notas_entrega.length > 0 ? (
            expediente.notas_entrega.map((nota) => (
              <div
                key={nota.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="text-purple-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">{nota.numero_nota}</p>
                    <p className="text-sm text-gray-600">
                      Recepción: {formatDate(nota.fecha_recepcion)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    nota.estado_mercaderia === 'conforme' ? 'success' :
                    nota.estado_mercaderia === 'no_conforme' ? 'danger' : 'warning'
                  }>
                    {nota.estado_mercaderia}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/notas-entrega/${nota.id}`)}
                  >
                    <Eye size={16} />
                    Ver
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No hay notas de entrega</p>
          )}
        </div>
      </Card>

      {/* Observaciones */}
      {expediente.observaciones && (
        <Card title="Observaciones">
          <p className="text-gray-700">{expediente.observaciones}</p>
        </Card>
      )}
    </div>
  );
}