import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, FileText, Truck, ClipboardCheck, Download, Eye, Upload, Trash2, Lock, Unlock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Loading, Badge } from '../components/common';
import { expedienteService } from '../services/expedienteService';
import { formatDate } from '../utils/formatters';

export default function VerExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState('');
  const [cerrando, setCerrando] = useState(false);

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

  const handleEliminar = async () => {
    if (!confirmandoEliminar) {
      setConfirmandoEliminar(true);
      return;
    }

    try {
      await expedienteService.eliminar(expediente.id);
      toast.success('Expediente eliminado correctamente');
      navigate('/expedientes');
    } catch (error) {
      console.error('Error eliminando expediente:', error);
      toast.error('Error al eliminar el expediente');
    } finally {
      setConfirmandoEliminar(false);
    }
  };

  const handleCerrarExpediente = async () => {
    if (!motivoCierre || motivoCierre.length < 10) {
      toast.error('Debes ingresar un motivo (mínimo 10 caracteres)');
      return;
    }

    try {
      setCerrando(true);
      await expedienteService.cerrar(expediente.id, motivoCierre);
      toast.success('✅ Expediente cerrado exitosamente');
      setMostrarModalCerrar(false);
      setMotivoCierre('');
      cargarExpediente();
    } catch (error) {
      toast.error('Error al cerrar expediente');
      console.error(error);
    } finally {
      setCerrando(false);
    }
  };

  const handleReabrirExpediente = async () => {
    try {
      await expedienteService.reabrir(expediente.id);
      toast.success('✅ Expediente reabierto');
      cargarExpediente();
    } catch (error) {
      toast.error('Error al reabrir expediente');
      console.error(error);
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
        <button
          onClick={() => navigate('/expedientes')}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Volver a Expedientes
        </button>
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
          {expediente.estado === 'completo' ? 'Completo' : 
           expediente.estado === 'cerrado_manual' ? 'Cerrado Manual' : 'En Proceso'}
        </Badge>
        
        {/* Botón Agregar Documentos */}
        <button
          onClick={() => navigate(`/upload?expediente_id=${expediente.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Upload size={20} />
          Agregar Documentos
        </button>

        {/* Botón Descargar ZIP */}
        <button
          onClick={descargarZip}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Download size={20} />
          Descargar ZIP
        </button>

        {/* Botón Cerrar Expediente */}
        {expediente.estado !== 'completo' && !expediente.cerrado_manualmente && (
          <button
            onClick={() => setMostrarModalCerrar(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Lock size={20} />
            Cerrar Expediente
          </button>
        )}

        {/* Botón Reabrir Expediente */}
        {expediente.cerrado_manualmente && (
          <button
            onClick={handleReabrirExpediente}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Unlock size={20} />
            Reabrir Expediente
          </button>
        )}

        {/* Botón Eliminar */}
        {!confirmandoEliminar ? (
          <button
            onClick={() => setConfirmandoEliminar(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <Trash2 size={20} />
            Eliminar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleEliminar}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
            >
              <Trash2 size={20} />
              Confirmar Eliminar
            </button>
            <button
              onClick={() => setConfirmandoEliminar(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        )}
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
          {expediente.cerrado_manualmente && expediente.motivo_cierre && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Motivo de Cierre</p>
              <p className="font-medium text-orange-700">{expediente.motivo_cierre}</p>
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
                  <button
                    onClick={() => {
                      if (doc.tipo_documento_id === 3) {
                        navigate(`/validar-orden/${doc.id}`);
                      } else if (doc.tipo_documento_id === 2) {
                        navigate(`/validar-guia/${doc.id}`);
                      } else {
                        navigate(`/validar/${doc.id}`);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500 mb-4">No hay documentos en este expediente</p>
              <button
                onClick={() => navigate(`/upload?expediente_id=${expediente.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mx-auto"
              >
                <Upload size={20} />
                Subir Primer Documento
              </button>
            </div>
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
                  <button
                    onClick={() => navigate(`/notas-entrega/${nota.id}`)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No hay notas de entrega</p>
          )}
        </div>
      </Card>

      {/* Documentos de Identidad */}
      <Card title="Documentos de Identidad">
        <div className="space-y-3">
          {expediente.documentos_identidad && expediente.documentos_identidad.length > 0 ? (
            expediente.documentos_identidad.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="text-purple-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">{doc.tipo_documento}</p>
                    <p className="text-sm text-gray-600">{doc.numero_documento}</p>
                    <p className="text-xs text-gray-500">
                      {doc.nombre_completo || `${doc.nombres} ${doc.apellidos}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/documento-identidad/${doc.id}`)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No hay documentos de identidad registrados</p>
          )}
        </div>
      </Card>

      {/* Observaciones */}
      {expediente.observaciones && (
        <Card title="Observaciones">
          <p className="text-gray-700">{expediente.observaciones}</p>
        </Card>
      )}

      {/* Modal Cerrar Expediente */}
      {mostrarModalCerrar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Cerrar Expediente</h3>
            <p className="text-gray-600 mb-4">
              Vas a cerrar este expediente sin completar todos los documentos. 
              Explica el motivo:
            </p>
            
            <textarea
              value={motivoCierre}
              onChange={(e) => setMotivoCierre(e.target.value)}
              placeholder="Ej: Cliente canceló pedido, documentos faltantes no son necesarios..."
              className="w-full border rounded-lg p-3 mb-4 min-h-32"
              maxLength={500}
            />
            
            <p className="text-sm text-gray-500 mb-4">
              {motivoCierre.length}/500 caracteres (mínimo 10)
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarModalCerrar(false);
                  setMotivoCierre('');
                }}
                disabled={cerrando}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCerrarExpediente}
                disabled={cerrando || motivoCierre.length < 10}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {cerrando ? 'Cerrando...' : 'Cerrar Expediente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}