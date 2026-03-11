import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Loading } from '../components/common';
import documentoIdentidadService from '../services/documentoIdentidadService';
import { formatDate } from '../utils/formatters';

export default function VerDocumentoIdentidad() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo_documento: '',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    nombre_completo: '',
    nacionalidad: '',
    fecha_nacimiento: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    sexo: ''
  });

  useEffect(() => {
    cargarDocumento();
  }, [id]);

  const cargarDocumento = async () => {
    try {
      setLoading(true);
      const data = await documentoIdentidadService.obtener(id);
      setDocumento(data);
      
      setFormData({
        tipo_documento: data.tipo_documento || '',
        numero_documento: data.numero_documento || '',
        nombres: data.nombres || '',
        apellidos: data.apellidos || '',
        nombre_completo: data.nombre_completo || '',
        nacionalidad: data.nacionalidad || '',
        fecha_nacimiento: data.fecha_nacimiento || '',
        fecha_emision: data.fecha_emision || '',
        fecha_vencimiento: data.fecha_vencimiento || '',
        sexo: data.sexo || ''
      });
    } catch (error) {
      console.error('Error cargando documento:', error);
      toast.error('Error al cargar el documento de identidad');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      
      const datosLimpios = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key] !== '') {
          datosLimpios[key] = formData[key];
        }
      });
      
      await documentoIdentidadService.actualizar(id, datosLimpios);
      toast.success('✅ Documento actualizado correctamente');
      setModoEdicion(false);
      cargarDocumento();
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setFormData({
      tipo_documento: documento.tipo_documento || '',
      numero_documento: documento.numero_documento || '',
      nombres: documento.nombres || '',
      apellidos: documento.apellidos || '',
      nombre_completo: documento.nombre_completo || '',
      nacionalidad: documento.nacionalidad || '',
      fecha_nacimiento: documento.fecha_nacimiento || '',
      fecha_emision: documento.fecha_emision || '',
      fecha_vencimiento: documento.fecha_vencimiento || '',
      sexo: documento.sexo || ''
    });
    setModoEdicion(false);
  };

  const getTipoDocumento = (tipo) => {
    switch (tipo) {
      case 'DNI': return '🪪 DNI - Documento Nacional de Identidad';
      case 'CARNET_EXTRANJERIA': return '🛂 Carnet de Extranjería';
      case 'PASAPORTE': return '📘 Pasaporte';
      case 'CPP': return '📋 CPP - Carnet de Permiso Provisional';
      default: return '📄 Otro Documento';
    }
  };

  const getTipoDocumentoCorto = (tipo) => {
    switch (tipo) {
      case 'DNI': return '🪪 DNI';
      case 'CARNET_EXTRANJERIA': return '🛂 CE';
      case 'PASAPORTE': return '📘 Pasaporte';
      case 'CPP': return '📋 CPP';
      default: return '📄 Otro';
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!documento) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm sm:text-base text-gray-500">Documento no encontrado</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium text-sm"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      {/* Header */}
      <div className="pt-4 sm:pt-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate(-1)}
          className="self-start p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Documento de Identidad</h1>
          <p className="text-xs sm:text-base text-gray-600 mt-1 truncate">
            <span className="hidden sm:inline">{getTipoDocumento(documento.tipo_documento)}</span>
            <span className="sm:hidden">{getTipoDocumentoCorto(documento.tipo_documento)}</span>
          </p>
        </div>
        
        {!modoEdicion ? (
          <button
            onClick={() => setModoEdicion(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base"
          >
            <Edit2 size={18} />
            Editar
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <Save size={18} />
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={handleCancelar}
              disabled={guardando}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors text-sm sm:text-base"
            >
              <X size={18} />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Información del Documento */}
      <Card title="Datos del Documento">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Tipo de Documento</label>
            {modoEdicion ? (
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="DNI">DNI</option>
                <option value="CARNET_EXTRANJERIA">Carnet de Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="CPP">CPP</option>
                <option value="OTRO">Otro</option>
              </select>
            ) : (
              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                <span className="hidden sm:inline">{getTipoDocumento(documento.tipo_documento)}</span>
                <span className="sm:hidden">{getTipoDocumentoCorto(documento.tipo_documento)}</span>
              </p>
            )}
          </div>
          
          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Número de Documento</label>
            {modoEdicion ? (
              <input
                type="text"
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-semibold text-gray-900 text-lg sm:text-xl">{documento.numero_documento}</p>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Nombres</label>
            {modoEdicion ? (
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">{documento.nombres || '-'}</p>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Apellidos</label>
            {modoEdicion ? (
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">{documento.apellidos || '-'}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Nombre Completo</label>
            {modoEdicion ? (
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">{documento.nombre_completo || '-'}</p>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Sexo</label>
            {modoEdicion ? (
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                {documento.sexo ? (documento.sexo === 'M' ? 'Masculino' : 'Femenino') : '-'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Nacionalidad</label>
            {modoEdicion ? (
              <input
                type="text"
                name="nacionalidad"
                value={formData.nacionalidad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">{documento.nacionalidad || '-'}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Fechas del Documento */}
      <Card title="Fechas">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Fecha de Nacimiento</label>
            {modoEdicion ? (
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                {documento.fecha_nacimiento ? formatDate(documento.fecha_nacimiento) : '-'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Fecha de Emisión</label>
            {modoEdicion ? (
              <input
                type="date"
                name="fecha_emision"
                value={formData.fecha_emision}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                {documento.fecha_emision ? formatDate(documento.fecha_emision) : '-'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs sm:text-sm text-gray-600 mb-1 block">Fecha de Vencimiento</label>
            {modoEdicion ? (
              <input
                type="date"
                name="fecha_vencimiento"
                value={formData.fecha_vencimiento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                {documento.fecha_vencimiento ? formatDate(documento.fecha_vencimiento) : '-'}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Metadata */}
      <Card title="Información del Registro">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Fecha de Registro</p>
            <p className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(documento.created_at)}</p>
          </div>

          <div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Registrado por</p>
            <p className="font-medium text-gray-900 text-sm sm:text-base">{documento.created_by || 'admin'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}