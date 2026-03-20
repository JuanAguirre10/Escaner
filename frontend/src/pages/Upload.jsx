import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Upload as UploadIcon, FileText, X, AlertCircle, Check, Camera, Image as ImageIcon, FileIcon, Package, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Loading, Input } from '../components/common';
import DocumentPreview from '../components/common/DocumentPreview';
import ProgressToast from '../components/common/ProgressToast';
import { ocrService, empresaService, tipoDocumentoService, expedienteService } from '../services';
import documentoIdentidadService from '../services/documentoIdentidadService';
import NotaEntregaForm from '../components/NotaEntregaForm';
import { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO_MB, MENSAJES, TIPOS_DOCUMENTO } from '../utils/constants';

export default function Upload() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
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

  // Función helper para verificar si un expediente es temporal
  const esTemporal = (expediente) => {
    if (!expediente) return false;
    return expediente.temporal || 
           expediente.codigo_expediente?.startsWith('TEMP-') ||
           expediente.numero_orden_compra === 'PENDIENTE';
  };

  // Cargar tipos de documento al montar
  useEffect(() => {
    cargarTiposDocumento();
  }, []);
  
  useEffect(() => {
    const expedienteIdParam = searchParams.get('expediente_id');
    const { empresaId, expedienteId } = location.state || {};

    if (empresaId && expedienteId) {
      cargarContextoCompleto(empresaId, expedienteId);
    } else if (expedienteIdParam) {
      cargarContextoDesdeExpediente(expedienteIdParam);
    }
  }, [searchParams, location.state]);

  const cargarTiposDocumento = async () => {
    try {
      const tipos = await tipoDocumentoService.listar(false);
      setTiposDocumento(tipos);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
    }
  };

  const cargarContextoCompleto = async (empresaId, expedienteId) => {
    try {
      
      const emp = await empresaService.obtener(empresaId);
      setEmpresa(emp);
      setEmpresaSeleccionada(true);
      
      const exp = await expedienteService.obtener(expedienteId);
      setExpedienteSeleccionado(exp);
      setMostrandoExpedientes(false);
      
      const incompletos = await expedienteService.obtenerIncompletos(empresaId);
      setExpedientesIncompletos(incompletos);
      
      toast.success(`✅ Contexto cargado: ${exp.codigo_expediente}`);
    } catch (error) {
      console.error('Error cargando contexto:', error);
      toast.error('Error al cargar el contexto');
    }
  };

  const cargarContextoDesdeExpediente = async (expedienteId) => {
    try {
      
      const exp = await expedienteService.obtener(expedienteId);
      setExpedienteSeleccionado(exp);
      setMostrandoExpedientes(false);
      
      const emp = await empresaService.obtener(exp.empresa_id);
      setEmpresa(emp);
      setEmpresaSeleccionada(true);
      
      const incompletos = await expedienteService.obtenerIncompletos(exp.empresa_id);
      setExpedientesIncompletos(incompletos);
      
      toast.success(`✅ Agregando documentos a: ${exp.codigo_expediente}`);
    } catch (error) {
      console.error('Error cargando expediente:', error);
      toast.error('Error al cargar el expediente');
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
    setEmpresa(empresaSelec);
    setEmpresaSeleccionada(true);
    setBusquedaEmpresa('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    
    try {
      const incompletos = await expedienteService.obtenerIncompletos(empresaSelec.id);
      
      setExpedientesIncompletos(incompletos);
      setMostrandoExpedientes(true);
      
      if (incompletos.length > 0) {
        toast.success(`Empresa seleccionada. ${incompletos.length} expediente(s) incompleto(s).`);
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

  const recargarExpediente = async (expedienteId) => {
    try {
      const exp = await expedienteService.obtener(expedienteId || expedienteSeleccionado.id);
      setExpedienteSeleccionado(exp);
      toast.success('Expediente actualizado');
    } catch (error) {
      console.error('Error recargando expediente:', error);
    }
  };

  const obtenerDocumentosFaltantes = (expediente) => {
    if (!expediente.documentos) return ['OC', 'DNI', 'Factura', 'Guía', 'Nota'];
    
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

    // Validar que expediente temporal requiere OC primero
    if (esTemporal(expedienteSeleccionado) && tipoSeleccionado !== TIPOS_DOCUMENTO.ORDEN_COMPRA && tipoSeleccionado !== 5) {
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

      // Si es Documento de Identidad (tipo 5)
      if (tipoSeleccionado === 5) {
        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('expediente_id', expedienteSeleccionado.id);

        const resultado = await documentoIdentidadService.procesar(formData);
        
        clearInterval(progressInterval);
        setUploadProgress(100);

        setTimeout(() => {
          setShowProgressToast(false);
          setArchivo(null);
          setPreview(null);
          
          toast.success(`✅ Documento de identidad procesado: ${resultado.tipo_documento}`);
          recargarExpediente(expedienteSeleccionado.id);
        }, 1000);

        return;
      }
      
      // Procesar con OCR (otros documentos)
      const resultado = await ocrService.procesarDocumento(
        archivo,
        empresa?.id,
        tipoSeleccionado
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Si es OC y expediente temporal, verificar si ya existe ANTES de asociar
      if (esTemporal(expedienteSeleccionado) && tipoSeleccionado === TIPOS_DOCUMENTO.ORDEN_COMPRA) {
        const verificacion = await expedienteService.verificarOC(resultado.numero_documento);
        
        if (verificacion.existe) {
          // Ya existe - Eliminar el documento recién creado y mostrar error
          try {
            await ocrService.eliminarDocumento(resultado.documento_id);
          } catch (e) {
            console.error('Error eliminando documento:', e);
          }
          
          setShowProgressToast(false);
          setArchivo(null);
          setPreview(null);
          setUploading(false);
          
          toast.error(
            `Ya existe el expediente ${verificacion.codigo_expediente} con la OC ${resultado.numero_documento}. Ve a ese expediente o sube una OC diferente.`,
            { duration: 10000 }
          );
          return; // DETENER aquí
        }
      }

      // Asociar al expediente (solo si pasó la verificación)
      await expedienteService.asociarDocumento(
        expedienteSeleccionado.id,
        resultado.documento_id
      );

      // Si es OC y expediente temporal, actualizar nombre
      if (esTemporal(expedienteSeleccionado) && tipoSeleccionado === TIPOS_DOCUMENTO.ORDEN_COMPRA) {
        const expActualizado = await expedienteService.actualizarDesdeOC(
          expedienteSeleccionado.id,
          resultado.numero_documento
        );
        
        const expCompleto = await expedienteService.obtener(expedienteSeleccionado.id);
        setExpedienteSeleccionado(expCompleto);
        
        toast.success(`✅ Expediente nombrado: ${expCompleto.codigo_expediente}`);
      }

      // Verificar completitud
      const estadoExpediente = await expedienteService.verificarCompletitud(
        expedienteSeleccionado.id
      );

      if (estadoExpediente.completo) {
        toast.success('🎉 ¡Expediente completo!');
      }
      
      setTimeout(() => {
        setShowProgressToast(false);
        setArchivo(null);
        setPreview(null);
        
        const tipoNombre =
          tipoSeleccionado === TIPOS_DOCUMENTO.FACTURA ? 'Factura' :
          tipoSeleccionado === TIPOS_DOCUMENTO.GUIA_REMISION ? 'Guía de Remisión' :
          tipoSeleccionado === TIPOS_DOCUMENTO.ORDEN_COMPRA ? 'Orden de Compra' :
          tipoSeleccionado === TIPOS_DOCUMENTO.RECIBO_HONORARIOS ? 'Recibo por Honorarios' : 'Documento';
        
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <p className="font-semibold">✅ {tipoNombre} procesada correctamente</p>
              <p className="text-sm text-gray-600">Puedes seguir agregando más documentos</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    const estadoNavegacion = {
                      empresaId: empresa.id,
                      expedienteId: expedienteSeleccionado.id
                    };
                    
                    if (tipoSeleccionado === TIPOS_DOCUMENTO.FACTURA) {
                      navigate(`/validar/${resultado.documento_id}`, { state: estadoNavegacion });
                    } else if (tipoSeleccionado === TIPOS_DOCUMENTO.RECIBO_HONORARIOS) {
                      navigate(`/validar/${resultado.documento_id}`, { state: estadoNavegacion });
                    } else if (tipoSeleccionado === TIPOS_DOCUMENTO.GUIA_REMISION) {
                      navigate(`/validar-guia/${resultado.documento_id}`, { state: estadoNavegacion });
                    } else if (tipoSeleccionado === TIPOS_DOCUMENTO.ORDEN_COMPRA) {
                      navigate(`/validar-orden/${resultado.documento_id}`, { state: estadoNavegacion });
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  Ir a validar
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300"
                >
                  Continuar aquí
                </button>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
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
    
    navigate('/upload', { replace: true });
  };

  const toggleExencion = async (tipoDocumentoId, exentar) => {
    try {
      await expedienteService.exentarDocumento(expedienteSeleccionado.id, tipoDocumentoId, exentar);
      await recargarExpediente(expedienteSeleccionado.id);
      toast.success(exentar ? 'Marcado como no requerido' : 'Revertido como requerido');
    } catch (error) {
      toast.error('Error al actualizar la exención');
    }
  };

  const TABS_TIPOS = [
    { id: 3, nombre: 'OC', nombreCompleto: 'Orden de Compra', emoji: '📋', activeClass: 'bg-amber-500 text-white border-amber-600 shadow-amber-200', inactiveClass: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' },
    { id: 5, nombre: 'DNI', nombreCompleto: 'Doc. Identidad', emoji: '🪪', activeClass: 'bg-purple-500 text-white border-purple-600 shadow-purple-200', inactiveClass: 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100' },
    { id: 1, nombre: 'Factura', nombreCompleto: 'Factura', emoji: '💳', activeClass: 'bg-blue-500 text-white border-blue-600 shadow-blue-200', inactiveClass: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100' },
    { id: 6, nombre: 'RxH', nombreCompleto: 'Recibo Honorarios', emoji: '🧾', activeClass: 'bg-orange-500 text-white border-orange-600 shadow-orange-200', inactiveClass: 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100' },
    { id: 2, nombre: 'Guía', nombreCompleto: 'Guía de Remisión', emoji: '🚚', activeClass: 'bg-green-500 text-white border-green-600 shadow-green-200', inactiveClass: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' },
    { id: 4, nombre: 'Nota', nombreCompleto: 'Nota de Entrega', emoji: '📦', activeClass: 'bg-rose-500 text-white border-rose-600 shadow-rose-200', inactiveClass: 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100' },
  ];
  const tabActual = TABS_TIPOS.find(t => t.id === tipoSeleccionado);
  const tipoActual = tiposDocumento.find(t => t.id === tipoSeleccionado);
  const esDocumentoIdentidad = tipoSeleccionado === 5;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6">
      <div className="pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subir Documentos</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Valida la empresa, selecciona expediente y sube documentos</p>
      </div>

      {expedienteSeleccionado && !mostrandoExpedientes && (
        <div className="p-3 sm:p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-900">
                📦 Agregando documentos al expediente
              </p>
              <p className="text-base sm:text-lg font-bold text-blue-700 mt-1">
                {expedienteSeleccionado.codigo_expediente}
              </p>
              <p className="text-xs sm:text-sm text-blue-600">
                {empresa?.razon_social} (RUC: {empresa?.ruc})
              </p>
            </div>
            <button
              onClick={resetearFormulario}
              className="w-full sm:w-auto px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
            >
              Cambiar Empresa/Expediente
            </button>
          </div>
        </div>
      )}

      {expedienteSeleccionado && !mostrandoExpedientes && expedienteSeleccionado.documentos && (
        <Card>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Documentos ({expedienteSeleccionado.documentos?.length || 0})
              </h3>
              <button
                onClick={() => navigate(`/expedientes/${expedienteSeleccionado.id}`)}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver expediente completo →
              </button>
            </div>
            
            {expedienteSeleccionado.documentos && expedienteSeleccionado.documentos.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {expedienteSeleccionado.documentos.map((doc) => {
                  const tipoNombre = 
                    doc.tipo_documento_id === 1 ? '📄 Factura' :
                    doc.tipo_documento_id === 2 ? '🚚 Guía de Remisión' :
                    doc.tipo_documento_id === 3 ? '📋 Orden de Compra' : '📁 Documento';
                  
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900 text-xs sm:text-sm">{tipoNombre}</p>
                        <p className="text-xs text-gray-600">{doc.numero_documento}</p>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded shrink-0">
                        ✓ OK
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 text-center py-4">
                Aún no hay documentos. Sube el primero.
              </p>
            )}
            
            {expedienteSeleccionado.notas_entrega && expedienteSeleccionado.notas_entrega.length > 0 && (
              <>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-2">
                    Notas de Entrega ({expedienteSeleccionado.notas_entrega.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  {expedienteSeleccionado.notas_entrega.map((nota) => (
                    <div key={nota.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div>
                        <p className="font-medium text-gray-900 text-xs sm:text-sm">📦 {nota.numero_nota}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(nota.fecha_recepcion).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 text-xs font-medium rounded shrink-0 ${
                        nota.estado_mercaderia === 'conforme' 
                          ? 'bg-green-100 text-green-800'
                          : nota.estado_mercaderia === 'no_conforme'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {nota.estado_mercaderia === 'conforme' ? '✓' :
                        nota.estado_mercaderia === 'no_conforme' ? '✗' : '⚠'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* PASO 1: VALIDACIÓN DE EMPRESA */}
      {!empresaSeleccionada && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Paso 1: Seleccionar empresa</p>
                <p className="text-xs sm:text-sm">Busca y selecciona la empresa emisora del documento</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="RUC o Nombre de la Empresa"
                  placeholder="Busca por RUC o nombre (mín. 3 caracteres)"
                  value={busquedaEmpresa}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setBusquedaEmpresa(valor);
                    buscarEmpresas(valor);
                  }}
                />

                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {sugerencias.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => seleccionarEmpresa(emp)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 active:bg-blue-100"
                      >
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{emp.razon_social}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">RUC: {emp.ruc}</p>
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

              {busquedaEmpresa.length > 0 && busquedaEmpresa.length < 3 && (
                <p className="text-xs sm:text-sm text-gray-500 italic">
                  Escribe al menos 3 caracteres para buscar
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {empresaSeleccionada && empresa && !expedienteSeleccionado && (
        <Card>
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="text-white" size={24} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-900 text-sm sm:text-base truncate">{empresa.razon_social}</p>
              <p className="text-xs sm:text-sm text-green-700">RUC: {empresa.ruc}</p>
            </div>
            <button
              onClick={resetearFormulario}
              className="px-3 py-1.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium shrink-0"
            >
              Cambiar
            </button>
          </div>
        </Card>
      )}

      {/* PASO 2: SELECCIONAR O CREAR EXPEDIENTE */}
      {empresaSeleccionada && mostrandoExpedientes && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <Package className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Paso 2: Seleccionar expediente</p>
                <p className="text-xs sm:text-sm">Continúa un expediente incompleto o crea uno nuevo</p>
              </div>
            </div>

            {expedientesIncompletos.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm font-medium text-gray-700">Expedientes incompletos:</p>
                {expedientesIncompletos.map((exp) => {
                  const faltantes = obtenerDocumentosFaltantes(exp);
                  return (
                    <button
                      key={exp.id}
                      onClick={() => seleccionarExpediente(exp)}
                      className="w-full text-left p-3 sm:p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg hover:border-yellow-400 hover:bg-yellow-100 active:bg-yellow-100 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{exp.codigo_expediente}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">OC: {exp.numero_orden_compra}</p>
                          <p className="text-xs sm:text-sm text-yellow-700 mt-2">
                            <strong>Faltan:</strong> {faltantes.join(', ')}
                          </p>
                        </div>
                        <div className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded shrink-0">
                          Incompleto
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={crearNuevoExpediente}
              className="w-full p-4 sm:p-5 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg hover:border-blue-500 hover:bg-blue-100 active:bg-blue-100 transition-all flex items-center justify-center gap-3"
            >
              <Plus size={24} className="text-blue-600" />
              <span className="font-medium text-blue-900 text-sm sm:text-base">Crear Nuevo Expediente</span>
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
                <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Paso 3: Selecciona el tipo de documento</p>
                <p className="text-xs sm:text-sm">Elige qué tipo de documento vas a subir</p>
              </div>
            </div>

            {/* Tabs - Responsive */}
            <div className="-mx-4 sm:mx-0">
              <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-0 gap-2 sm:gap-3 pb-1">
                {TABS_TIPOS.map((tipo) => {
                  const esActivo = tipo.id === tipoSeleccionado;

                  return (
                    <button
                      key={tipo.id}
                      onClick={() => setTipoSeleccionado(tipo.id)}
                      className={`
                        flex flex-col items-center gap-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0
                        ${esActivo
                          ? `${tipo.activeClass} shadow-md scale-105`
                          : `${tipo.inactiveClass}`
                        }
                      `}
                    >
                      <span className="text-lg sm:text-xl leading-none">{tipo.emoji}</span>
                      <span className="sm:hidden">{tipo.nombre}</span>
                      <span className="hidden sm:inline">{tipo.nombreCompleto}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Información del tipo seleccionado */}
            {tabActual && (
              <div className={`p-3 sm:p-4 rounded-lg border ${
                tipoSeleccionado === 3 ? 'bg-amber-50 border-amber-200 text-amber-800' :
                tipoSeleccionado === 5 ? 'bg-purple-50 border-purple-200 text-purple-800' :
                tipoSeleccionado === 1 ? 'bg-blue-50 border-blue-200 text-blue-800' :
                tipoSeleccionado === 6 ? 'bg-orange-50 border-orange-200 text-orange-800' :
                tipoSeleccionado === 2 ? 'bg-green-50 border-green-200 text-green-800' :
                'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold">Tipo seleccionado:</span> {tabActual.emoji} {tabActual.nombreCompleto}
                </p>
              </div>
            )}

            {/* Botones de exención — solo para Factura (1), RxH (6) y Guía (2) */}
            {expedienteSeleccionado && !esTemporal(expedienteSeleccionado) && [1, 2, 6].includes(tipoSeleccionado) && (() => {
              const exentos = expedienteSeleccionado.documentos_exentos || [];
              const estaExento = exentos.includes(tipoSeleccionado);
              return (
                <div className={`flex items-center justify-between p-3 rounded-lg border ${estaExento ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'}`}>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">
                      {estaExento ? '⚠️ Marcado como NO requerido' : '¿Este documento no aplica para este expediente?'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {estaExento ? 'No se considerará para completitud del expediente' : 'Márcalo si no se necesita para este caso'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleExencion(tipoSeleccionado, !estaExento)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      estaExento
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {estaExento ? 'Revertir' : 'No requerido'}
                  </button>
                </div>
              );
            })()}

            {esDocumentoIdentidad && (
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-purple-900 font-medium">
                  📋 Documento de Identidad del Visitante
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Sube DNI, Carnet de Extranjería, Pasaporte o CPP de la persona que entrega
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* PASO 4: FORMULARIO NOTA ENTREGA */}
      {expedienteSeleccionado && tipoSeleccionado === 4 && (
        <NotaEntregaForm 
          expediente={expedienteSeleccionado}
          empresa={empresa}
          onSuccess={(expId) => {
            toast.success('Nota de entrega creada correctamente');
            recargarExpediente(expId);
          }}
        />
      )}

      {/* OPCIONES DE CARGA PARA OC, DNI, FACTURA, GUÍA */}
      {expedienteSeleccionado && tipoSeleccionado !== 4 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-gray-600">
                <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Paso 4: Sube el documento</p>
                <p className="text-xs sm:text-sm">Elige cómo deseas cargar el documento</p>
              </div>
            </div>

            {!archivo && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => document.getElementById('camera-input').click()}
                  className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-30"
                >
                  <Camera className="text-gray-400 mb-3" size={40} />
                  <span className="font-medium text-gray-900 text-base">Cámara</span>
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

                <button
                  onClick={() => document.getElementById('image-input').click()}
                  className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-30"
                >
                  <ImageIcon className="text-gray-400 mb-3" size={40} />
                  <span className="font-medium text-gray-900 text-base">Imagen</span>
                  <span className="text-xs text-gray-500 mt-1">JPG, PNG</span>
                </button>
                <input
                  id="image-input"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleChange}
                />

                <button
                  onClick={() => document.getElementById('pdf-input').click()}
                  className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-30"
                >
                  <FileIcon className="text-gray-400 mb-3" size={40} />
                  <span className="font-medium text-gray-900 text-base">PDF</span>
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

            {!archivo && (
              <>
                <div className="text-center text-gray-500 text-sm">o</div>
                
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors cursor-pointer
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

            {archivo && (
              <div className="space-y-4">
                {preview ? (
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-80 sm:max-h-96 mx-auto rounded-lg shadow-md w-full object-contain"
                    />
                    <button
                      onClick={handleRemove}
                      className="absolute top-2 right-2 p-2 sm:p-3 bg-red-500 text-white rounded-full hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-3 bg-red-100 rounded-lg shrink-0">
                        <FileText className="text-red-600" size={24} />
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
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={handleRemove}
                    disabled={uploading}
                    className="px-4 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:bg-gray-400 font-medium disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-4 py-3 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Procesar</span>
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