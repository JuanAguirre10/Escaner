import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Loading } from '../components/common';
import { ocrService } from '../services';
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_MB, MENSAJES } from '../utils/constants';

export default function Upload() {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    console.log('Archivo seleccionado:', file.name);
    
    const extension = file.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      toast.error(`Extensión no permitida. Solo: ${EXTENSIONES_PERMITIDAS.join(', ')}`);
      return;
    }

    const tamanoMB = file.size / (1024 * 1024);
    if (tamanoMB > TAMANO_MAXIMO_MB) {
      toast.error(`El archivo excede el tamaño máximo de ${TAMANO_MAXIMO_MB}MB`);
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
      toast.error('Selecciona un archivo primero');
      return;
    }

    try {
      setUploading(true);
      console.log('Iniciando procesamiento OCR...');
      
      const resultado = await ocrService.procesarFactura(archivo);
      console.log('Resultado OCR:', resultado);
      
      toast.success(MENSAJES.UPLOAD_SUCCESS);
      navigate(`/validar/${resultado.factura_id}`);
      
    } catch (error) {
      console.error('Error al procesar:', error);
      toast.error(error.response?.data?.detail || MENSAJES.UPLOAD_ERROR);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subir Factura</h1>
        <p className="text-gray-600 mt-1">Sube una imagen o PDF de la factura para procesarla con OCR</p>
      </div>

      <Card>
        <div className="flex items-start gap-3 text-sm">
          <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <div className="text-gray-600">
            <p className="font-medium text-gray-900 mb-1">Formatos aceptados:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Imágenes: PNG, JPG, JPEG</li>
              <li>Documentos: PDF</li>
              <li>Tamaño máximo: {TAMANO_MAXIMO_MB}MB</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        {!archivo ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
              ${dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UploadIcon className="text-gray-400" size={32} />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arrastra tu archivo aquí
            </h3>
            <p className="text-gray-600 mb-4">o haz click para seleccionar</p>
            
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleChange}
            />
            
            <span className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-block transition-colors">
              Seleccionar Archivo
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {preview ? (
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-h-96 mx-auto rounded-lg shadow-md"
                />
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <FileText className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{archivo.name}</p>
                    <p className="text-sm text-gray-600">
                      {(archivo.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
            <button
                onClick={handleRemove}
                disabled={uploading}
                className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 transition-colors"
            >
                Cancelar
            </button>
            
            <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
                {uploading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                </>
                ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Procesar con OCR
                </>
                )}
            </button>
            </div>
          </div>
        )}
      </Card>

      {uploading && <Loading fullScreen />}
    </div>
  );
}