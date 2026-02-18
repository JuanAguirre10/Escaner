import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, X, AlertCircle, Check, Camera, Image as ImageIcon, FileIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Loading, Input } from '../components/common';
import DocumentPreview from '../components/common/DocumentPreview';
import ProgressToast from '../components/common/ProgressToast';
import { ocrService, empresaService, tipoDocumentoService } from '../services';
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_MB, MENSAJES, TIPOS_DOCUMENTO } from '../utils/constants';

export default function Upload() {
  const navigate = useNavigate();
  
  // Estados para RUC y empresa
  const [ruc, setRuc] = useState('');
  const [empresa, setEmpresa] = useState(null);
  const [validandoRuc, setValidandoRuc] = useState(false);
  const [rucValidado, setRucValidado] = useState(false);
  
  // Estados para tipos de documento y pestaña activa
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_DOCUMENTO.FACTURA);
  
  // Estados para archivo
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressToast, setShowProgressToast] = useState(false);

  // Cargar tipos de documento al montar
  useEffect(() => {
    cargarTiposDocumento();
  }, []);

  const cargarTiposDocumento = async () => {
    try {
      const tipos = await tipoDocumentoService.listar(false);
      setTiposDocumento(tipos);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
    }
  };

  const handleValidarRuc = async () => {
    if (!ruc || ruc.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos');
      return;
    }

    try {
      setValidandoRuc(true);
      const resultado = await empresaService.validarRuc(ruc);
      
      if (resultado.existe) {
        setEmpresa(resultado.empresa);
        setRucValidado(true);
        toast.success(resultado.mensaje);
      } else {
        setEmpresa(null);
        setRucValidado(false);
        toast.error(resultado.mensaje);
      }
    } catch (error) {
      console.error('Error validando RUC:', error);
      toast.error('Error al validar RUC');
      setRucValidado(false);
    } finally {
      setValidandoRuc(false);
    }
  };

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
    if (!rucValidado) {
      toast.error('Debes validar el RUC primero');
      return;
    }

    if (!archivo) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    try {
      setUploading(true);
      setShowProgressToast(true);
      setUploadProgress(0);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
      
      const resultado = await ocrService.procesarDocumento(
        archivo,
        empresa?.id,
        tipoSeleccionado
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setShowProgressToast(false);
        toast.success(MENSAJES.UPLOAD_SUCCESS);
        navigate(`/validar/${resultado.documento_id}`);
      }, 1000);
      
    } catch (error) {
      setShowProgressToast(false);
      console.error('Error al procesar:', error);
      toast.error(error.response?.data?.detail || MENSAJES.UPLOAD_ERROR);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const tipoActual = tiposDocumento.find(t => t.id === tipoSeleccionado);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subir Documentos</h1>
        <p className="text-gray-600 mt-1">Valida el RUC de la empresa y sube el documento para procesarlo con OCR</p>
      </div>

      {/* VALIDACIÓN DE RUC */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <div className="text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Paso 1: Validar empresa emisora</p>
              <p>Ingresa el RUC de la empresa que emitió el documento (proveedor)</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="RUC de la Empresa Emisora"
              placeholder="Ej: 20516185211"
              value={ruc}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
                setRuc(valor);
                setRucValidado(false);
                setEmpresa(null);
              }}
              maxLength={11}
              disabled={rucValidado}
            />
            
            {!rucValidado ? (
              <button
                onClick={handleValidarRuc}
                disabled={validandoRuc || ruc.length !== 11}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {validandoRuc ? 'Validando...' : 'Validar RUC'}
              </button>
            ) : (
              <button
                onClick={() => {
                  setRuc('');
                  setEmpresa(null);
                  setRucValidado(false);
                  setArchivo(null);
                  setPreview(null);
                }}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cambiar RUC
              </button>
            )}
          </div>

          {/* Mostrar empresa validada */}
          {rucValidado && empresa && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="text-white" size={24} />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900">{empresa.razon_social}</p>
                <p className="text-sm text-green-700">RUC: {empresa.ruc}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* PESTAÑAS DE TIPOS DE DOCUMENTO */}
      {rucValidado && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Paso 2: Selecciona el tipo de documento</p>
                <p>Elige qué tipo de documento vas a subir</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                {tiposDocumento.map((tipo) => {
                  const esActivo = tipo.id === tipoSeleccionado;
                  const estaHabilitado = tipo.activo;

                  return (
                    <button
                      key={tipo.id}
                      onClick={() => estaHabilitado && setTipoSeleccionado(tipo.id)}
                      disabled={!estaHabilitado}
                      className={`
                        py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                        ${esActivo
                          ? 'border-blue-500 text-blue-600'
                          : estaHabilitado
                            ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            : 'border-transparent text-gray-300 cursor-not-allowed'
                        }
                      `}
                    >
                      {tipo.nombre}
                      {!estaHabilitado && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                          Próximamente
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Información del tipo seleccionado */}
            {tipoActual && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Seleccionado:</span> {tipoActual.descripcion}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* OPCIONES DE CARGA */}
      {rucValidado && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Paso 3: Sube el documento</p>
                <p>Elige cómo deseas cargar el documento</p>
              </div>
            </div>

            {/* Opciones de carga: Cámara | Imagen | PDF */}
            {!archivo && (
              <div className="grid grid-cols-3 gap-4">
                {/* Cámara */}
                <button
                  onClick={() => {
                    const input = document.getElementById('camera-input');
                    input.click();
                  }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Camera className="text-gray-400 mb-3" size={32} />
                  <span className="font-medium text-gray-900">Cámara</span>
                  <span className="text-xs text-gray-500 mt-1">Tomar foto</span>
                </button>
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleChange}
                />

                {/* Imagen */}
                <button
                  onClick={() => {
                    const input = document.getElementById('image-input');
                    input.click();
                  }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <ImageIcon className="text-gray-400 mb-3" size={32} />
                  <span className="font-medium text-gray-900">Imagen</span>
                  <span className="text-xs text-gray-500 mt-1">JPG, PNG</span>
                </button>
                <input
                  id="image-input"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleChange}
                />

                {/* PDF */}
                <button
                  onClick={() => {
                    const input = document.getElementById('pdf-input');
                    input.click();
                  }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FileIcon className="text-gray-400 mb-3" size={32} />
                  <span className="font-medium text-gray-900">PDF</span>
                  <span className="text-xs text-gray-500 mt-1">Documento</span>
                </button>
                <input
                  id="pdf-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleChange}
                />
              </div>
            )}

            {/* O zona de arrastre */}
            {!archivo && (
              <>
                <div className="text-center text-gray-500 text-sm">o</div>
                
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <UploadIcon className="text-gray-400" size={24} />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Arrastra tu archivo aquí
                  </p>
                  <p className="text-xs text-gray-500">
                    Máximo {TAMANO_MAXIMO_MB}MB
                  </p>
                  
                  <input
                    id="file-input"
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
              <div className="space-y-4">
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
          </div>
        </Card>
      )}

      {uploading && <Loading fullScreen />}
      
      {showProgressToast && (
        <ProgressToast
          message="Procesando documento con OCR..."
          type="loading"
          progress={uploadProgress}
          showProgress={true}
        />
      )}
    </div>
  );
}