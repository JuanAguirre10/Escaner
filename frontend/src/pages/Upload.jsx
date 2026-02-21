import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload as UploadIcon, FileText, X, AlertCircle, Check, Camera, Image as ImageIcon, FileIcon, Package, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Loading, Input } from '../components/common';
import DocumentPreview from '../components/common/DocumentPreview';
import ProgressToast from '../components/common/ProgressToast';
import { ocrService, empresaService, tipoDocumentoService, expedienteService } from '../services';
import NotaEntregaForm from '../components/NotaEntregaForm';
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_MB, MENSAJES, TIPOS_DOCUMENTO } from '../utils/constants';

export default function Upload() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados para empresa
  const [busquedaEmpresa, setBusquedaEmpresa] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(false);
  
  // Estados para expedientes
  const [expedientesIncompletos, setExpedientesIncompletos] = useState([]);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [mostrandoExpedientes, setMostrandoExpedientes] = useState(false);
  
  // Estados para tipos de documento y pestaña activa
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_DOCUMENTO.ORDEN_COMPRA);
  
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
  
  // Cargar contexto si viene de un documento validado
  useEffect(() => {
    if (location.state?.empresaId && location.state?.expedienteId) {
      cargarContextoDesdeDocumento(location.state.empresaId, location.state.expedienteId);
    }
  }, [location.state]);

  const cargarTiposDocumento = async () => {
    try {
      const tipos = await tipoDocumentoService.listar(false);
      setTiposDocumento(tipos);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
    }
  };

  const cargarContextoDesdeDocumento = async (empresaId, expedienteId) => {
    try {
      console.log('🔄 Cargando contexto automático...');
      console.log('Empresa ID:', empresaId, 'Expediente ID:', expedienteId);
      
      // Cargar empresa
      const emp = await empresaService.obtener(empresaId);
      console.log('Empresa cargada:', emp);
      
      setEmpresa(emp);
      setEmpresaSeleccionada(true);
      
      // Cargar expediente
      const exp = await expedienteService.obtener(expedienteId);
      console.log('Expediente cargado:', exp);
      
      setExpedienteSeleccionado(exp);
      setMostrandoExpedientes(false);
      
      toast.success(`Contexto cargado: ${emp.razon_social} - ${exp.codigo_expediente}`);
    } catch (error) {
      console.error('Error cargando contexto:', error);
      toast.error('Error al cargar el contexto del expediente');
    }
  };

  const buscarEmpresas = async (texto) => {
    if (texto.length < 3) {
      setSugerencias([]);
      return;
    }

    try {
      setBuscando(true);
      const resultados = await empresaService.buscar(texto);
      setSugerencias(resultados);
      setMostrarSugerencias(true);
    } catch (error) {
      console.error('Error buscando empresas:', error);
      setSugerencias([]);
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarEmpresa = async (empresaSelec) => {
    console.log('🔍 Empresa seleccionada:', empresaSelec);
    
    setEmpresa(empresaSelec);
    setEmpresaSeleccionada(true);
    setBusquedaEmpresa('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    
    // Cargar expedientes incompletos
    try {
      console.log('📦 Buscando expedientes incompletos para empresa ID:', empresaSelec.id);
      const incompletos = await expedienteService.obtenerIncompletos(empresaSelec.id);
      console.log('📦 Expedientes incompletos encontrados:', incompletos);
      console.log('📦 Cantidad:', incompletos.length);
      
      setExpedientesIncompletos(incompletos);
      setMostrandoExpedientes(true);
      
      if (incompletos.length > 0) {
        toast.success(`Empresa seleccionada. ${incompletos.length} expediente(s) incompleto(s) encontrado(s).`);
      } else {
        toast.success(`Empresa seleccionada: ${empresaSelec.razon_social}`);
      }
    } catch (error) {
      console.error('Error cargando expedientes:', error);
      setExpedientesIncompletos([]);
      setMostrandoExpedientes(true);
    }
  };

  const crearNuevoExpediente = async () => {
    try {
      const expedienteTemp = await expedienteService.crearTemporal(empresa.id);
      setExpedienteSeleccionado({
        id: expedienteTemp.id,
        codigo_expediente: expedienteTemp.codigo_expediente,
        temporal: true
      });
      setMostrandoExpedientes(false);
      toast.success('Expediente temporal creado. Sube primero la Orden de Compra.');
    } catch (error) {
      console.error('Error creando expediente:', error);
      toast.error('Error al crear expediente temporal');
    }
  };

  const seleccionarExpediente = (expediente) => {
    setExpedienteSeleccionado(expediente);
    setMostrandoExpedientes(false);
  };

  const obtenerDocumentosFaltantes = (expediente) => {
    if (!expediente.documentos) return ['OC', 'Factura', 'Guía', 'Nota'];
    
    const tiene_oc = expediente.documentos.some(d => d.tipo_documento_id === 3);
    const tiene_factura = expediente.documentos.some(d => d.tipo_documento_id === 1);
    const tiene_guia = expediente.documentos.some(d => d.tipo_documento_id === 2);
    const tiene_nota = expediente.notas_entrega && expediente.notas_entrega.length > 0;
    
    const faltantes = [];
    if (!tiene_oc) faltantes.push('OC');
    if (!tiene_factura) faltantes.push('Factura');
    if (!tiene_guia) faltantes.push('Guía');
    if (!tiene_nota) faltantes.push('Nota');
    
    return faltantes;
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
    if (!empresaSeleccionada) {
      toast.error('Debes seleccionar una empresa primero');
      return;
    }

    if (!expedienteSeleccionado) {
      toast.error('Selecciona o crea un expediente');
      return;
    }

    if (!archivo) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    // Validar que si es expediente temporal, debe subir OC primero
    if (expedienteSeleccionado.temporal && tipoSeleccionado !== TIPOS_DOCUMENTO.ORDEN_COMPRA) {
      toast.error('Debes subir primero la Orden de Compra para nombrar el expediente');
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
      
      // Procesar con OCR
      const resultado = await ocrService.procesarDocumento(
        archivo,
        empresa?.id,
        tipoSeleccionado
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Asociar al expediente
      await expedienteService.asociarDocumento(
        expedienteSeleccionado.id,
        resultado.documento_id
      );

      // Si es OC y expediente temporal, actualizar nombre
      if (expedienteSeleccionado.temporal && tipoSeleccionado === TIPOS_DOCUMENTO.ORDEN_COMPRA) {
        await expedienteService.actualizarDesdeOC(
          expedienteSeleccionado.id,
          resultado.numero_documento
        );
        toast.success(`Expediente nombrado: EXP-${resultado.numero_documento}`);
      }

      // Verificar completitud
      const estadoExpediente = await expedienteService.verificarCompletitud(
        expedienteSeleccionado.id
      );

      if (estadoExpediente.completo) {
        toast.success('🎉 ¡Expediente completo! Se movió a Lista de Expedientes.');
      }
      
      setTimeout(() => {
        setShowProgressToast(false);
        toast.success(MENSAJES.UPLOAD_SUCCESS);
        
        // Redirigir según tipo pasando contexto
        if (tipoSeleccionado === TIPOS_DOCUMENTO.FACTURA) {
          navigate(`/validar/${resultado.documento_id}`, {
            state: {
              empresaId: empresa.id,
              expedienteId: expedienteSeleccionado.id
            }
          });
        } else if (tipoSeleccionado === TIPOS_DOCUMENTO.GUIA_REMISION) {
          navigate(`/validar-guia/${resultado.documento_id}`, {
            state: {
              empresaId: empresa.id,
              expedienteId: expedienteSeleccionado.id
            }
          });
        } else if (tipoSeleccionado === TIPOS_DOCUMENTO.ORDEN_COMPRA) {
          navigate(`/validar-orden/${resultado.documento_id}`, {
            state: {
              empresaId: empresa.id,
              expedienteId: expedienteSeleccionado.id
            }
          });
        }
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

  const resetearFormulario = () => {
    setEmpresa(null);
    setEmpresaSeleccionada(false);
    setExpedienteSeleccionado(null);
    setExpedientesIncompletos([]);
    setMostrandoExpedientes(false);
    setArchivo(null);
    setPreview(null);
    setBusquedaEmpresa('');
  };

  const tipoActual = tiposDocumento.find(t => t.id === tipoSeleccionado);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subir Documentos</h1>
        <p className="text-gray-600 mt-1">Valida la empresa, selecciona expediente y sube documentos</p>
      </div>

      {/* PASO 1: VALIDACIÓN DE EMPRESA */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <div className="text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Paso 1: Seleccionar empresa</p>
              <p>Busca y selecciona la empresa emisora del documento</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                label="RUC o Nombre de la Empresa"
                placeholder="Busca por RUC o nombre (mín. 3 caracteres)"
                value={empresaSeleccionada ? empresa?.razon_social : busquedaEmpresa}
                onChange={(e) => {
                  const valor = e.target.value;
                  setBusquedaEmpresa(valor);
                  setEmpresaSeleccionada(false);
                  setEmpresa(null);
                  setExpedienteSeleccionado(null);
                  setMostrandoExpedientes(false);
                  buscarEmpresas(valor);
                }}
                disabled={empresaSeleccionada}
              />

              {/* Sugerencias de autocompletado */}
              {mostrarSugerencias && sugerencias.length > 0 && !empresaSeleccionada && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {sugerencias.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => seleccionarEmpresa(emp)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:shadow-sm"
                    >
                      <p className="font-semibold text-gray-900 text-base">{emp.razon_social}</p>
                      <p className="text-sm text-gray-500 mt-1">RUC: {emp.ruc}</p>
                    </button>
                  ))}
                </div>
              )}

              {buscando && (
                <div className="absolute right-3 top-9">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {!empresaSeleccionada && busquedaEmpresa.length < 3 && (
              <p className="text-sm text-gray-500 italic">
                Escribe al menos 3 caracteres para buscar
              </p>
            )}
            
            {empresaSeleccionada && (
              <button
                onClick={resetearFormulario}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cambiar Empresa
              </button>
            )}
          </div>

          {/* Mostrar empresa validada */}
          {empresaSeleccionada && empresa && (
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

      {/* PASO 2: SELECCIONAR O CREAR EXPEDIENTE */}
      {empresaSeleccionada && mostrandoExpedientes && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <Package className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Paso 2: Seleccionar expediente</p>
                <p>Continúa un expediente incompleto o crea uno nuevo</p>
              </div>
            </div>

            {/* Expedientes incompletos */}
            {expedientesIncompletos.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Expedientes incompletos:</p>
                {expedientesIncompletos.map((exp) => {
                  const faltantes = obtenerDocumentosFaltantes(exp);
                  return (
                    <button
                      key={exp.id}
                      onClick={() => seleccionarExpediente(exp)}
                      className="w-full text-left p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg hover:border-yellow-400 hover:bg-yellow-100 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{exp.codigo_expediente}</p>
                          <p className="text-sm text-gray-600 mt-1">OC: {exp.numero_orden_compra}</p>
                          <p className="text-sm text-yellow-700 mt-2">
                            <strong>Faltan:</strong> {faltantes.join(', ')}
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
                          Incompleto
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Crear nuevo expediente */}
            <button
              onClick={crearNuevoExpediente}
              className="w-full p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg hover:border-blue-500 hover:bg-blue-100 transition-all flex items-center justify-center gap-3"
            >
              <Plus size={24} className="text-blue-600" />
              <span className="font-medium text-blue-900">Crear Nuevo Expediente</span>
            </button>
          </div>
        </Card>
      )}

      {/* Expediente seleccionado */}
      {expedienteSeleccionado && !mostrandoExpedientes && (
        <Card>
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="text-blue-600" size={24} />
              <div>
                <p className="font-medium text-blue-900">
                  {expedienteSeleccionado.codigo_expediente}
                </p>
                {expedienteSeleccionado.temporal && (
                  <p className="text-sm text-blue-700">⚠️ Sube primero la Orden de Compra</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setExpedienteSeleccionado(null);
                setMostrandoExpedientes(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Cambiar
            </button>
          </div>
        </Card>
      )}

      {/* PASO 3: PESTAÑAS DE TIPOS DE DOCUMENTO */}
      {expedienteSeleccionado && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Paso 3: Selecciona el tipo de documento</p>
                <p>Elige qué tipo de documento vas a subir</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                {tiposDocumento
                  .sort((a, b) => {
                    const ordenProceso = {
                      'ORDEN_COMPRA': 1,
                      'FACTURA': 2,
                      'GUIA_REMISION': 3,
                      'NOTA_ENTREGA': 4
                    };
                    return (ordenProceso[a.codigo] || 999) - (ordenProceso[b.codigo] || 999);
                  })
                  .map((tipo) => {
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

      {/* PASO 4: OPCIONES DE CARGA O FORMULARIO NOTA */}
      {expedienteSeleccionado && tipoSeleccionado === 4 && (
        <NotaEntregaForm 
          expediente={expedienteSeleccionado}
          empresa={empresa}
          onSuccess={() => {
            toast.success('Nota de entrega creada correctamente');
            // Recargar expedientes
            seleccionarEmpresa(empresa);
          }}
        />
      )}

      {/* OPCIONES DE CARGA PARA OC, FACTURA, GUÍA */}
      {expedienteSeleccionado && tipoSeleccionado !== 4 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Paso 4: Sube el documento</p>
                <p>Elige cómo deseas cargar el documento</p>
              </div>
            </div>

            {/* TODO EL CONTENIDO ACTUAL DE SUBIR ARCHIVOS SE QUEDA AQUÍ */}

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