import { useState } from 'react';
import { Camera, Image as ImageIcon, FileIcon, User, X, Upload as UploadIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import documentoIdentidadService from '../services/documentoIdentidadService';

export default function SubirDocumentoIdentidad({ expediente, onSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [motivoVisita, setMotivoVisita] = useState('');
  const [empresaVisitante, setEmpresaVisitante] = useState('');
  const [cargo, setCargo] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'pdf'].includes(extension)) {
      toast.error('Solo se permiten archivos PNG, JPG o PDF');
      return;
    }

    const tamanoMB = file.size / (1024 * 1024);
    if (tamanoMB > 10) {
      toast.error('El archivo excede el tamaño máximo de 10MB');
      return;
    }

    setArchivo(file);

    if (['png', 'jpg', 'jpeg'].includes(extension)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleRemove = () => {
    setArchivo(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!archivo) {
      toast.error('Selecciona un documento de identidad primero');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('expediente_id', expediente.id);
      if (motivoVisita) formData.append('motivo_visita', motivoVisita);
      if (empresaVisitante) formData.append('empresa_visitante', empresaVisitante);
      if (cargo) formData.append('cargo', cargo);

      const resultado = await documentoIdentidadService.procesar(formData);
      
      toast.success(`✅ Documento procesado: ${resultado.tipo_documento}`);
      
      setArchivo(null);
      setPreview(null);
      setMotivoVisita('');
      setEmpresaVisitante('');
      setCargo('');
      
      if (onSuccess) {
        onSuccess(resultado);
      }
      
    } catch (error) {
      console.error('Error al procesar:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar documento de identidad');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <User className="text-purple-600 mt-0.5 shrink-0" size={20} />
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Documento de Identidad del Visitante</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Sube DNI, Carnet de Extranjería, Pasaporte o CPP de la persona que entrega
            </p>
          </div>
        </div>

        {/* Datos adicionales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Motivo de la Visita
            </label>
            <input
              type="text"
              placeholder="Ej: Entrega de documentos"
              value={motivoVisita}
              onChange={(e) => setMotivoVisita(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Empresa del Visitante
            </label>
            <input
              type="text"
              placeholder="Ej: Transportes SAC"
              value={empresaVisitante}
              onChange={(e) => setEmpresaVisitante(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Cargo
            </label>
            <input
              type="text"
              placeholder="Ej: Mensajero"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Opciones de carga */}
        {!archivo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => document.getElementById('camera-input-dni').click()}
              className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 active:bg-purple-100 transition-colors"
            >
              <Camera className="text-gray-400 mb-2 sm:mb-3" size={28} />
              <span className="font-medium text-gray-900 text-sm sm:text-base">Cámara</span>
              <span className="text-xs text-gray-500 mt-1">Tomar foto</span>
            </button>
            <input
              id="camera-input-dni"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleChange}
            />

            <button
              onClick={() => document.getElementById('image-input-dni').click()}
              className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 active:bg-purple-100 transition-colors"
            >
              <ImageIcon className="text-gray-400 mb-2 sm:mb-3" size={28} />
              <span className="font-medium text-gray-900 text-sm sm:text-base">Imagen</span>
              <span className="text-xs text-gray-500 mt-1">JPG, PNG</span>
            </button>
            <input
              id="image-input-dni"
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleChange}
            />

            <button
              onClick={() => document.getElementById('pdf-input-dni').click()}
              className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 active:bg-purple-100 transition-colors"
            >
              <FileIcon className="text-gray-400 mb-2 sm:mb-3" size={28} />
              <span className="font-medium text-gray-900 text-sm sm:text-base">PDF</span>
              <span className="text-xs text-gray-500 mt-1">Documento</span>
            </button>
            <input
              id="pdf-input-dni"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        )}

        {!archivo && (
          <>
            <div className="text-center text-gray-500 text-xs sm:text-sm">o</div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors cursor-pointer ${
                dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input-dni').click()}
            >
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                <UploadIcon className="text-gray-400" size={20} />
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                Arrastra el documento de identidad aquí
              </p>
              <p className="text-xs text-gray-500">
                DNI, Carnet de Extranjería, Pasaporte o CPP (Máximo 10MB)
              </p>
              
              <input
                id="file-input-dni"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleChange}
              />
            </div>
          </>
        )}

        {/* Archivo seleccionado */}
        {archivo && (
          <div className="space-y-3 sm:space-y-4">
            {preview ? (
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-h-64 sm:max-h-96 mx-auto rounded-lg shadow-md w-full object-contain"
                />
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 active:bg-red-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg shrink-0">
                    <FileIcon className="text-purple-600" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{archivo.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {(archivo.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="px-4 py-2 sm:py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:bg-gray-400 font-medium disabled:opacity-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Procesar con OCR
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}