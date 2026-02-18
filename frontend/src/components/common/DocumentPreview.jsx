import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, X } from 'lucide-react';

export default function DocumentPreview({ file, preview, onRemove }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = preview;
    link.download = file.name;
    link.click();
  };

  const isPDF = file.type === 'application/pdf';

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{file.name}</span>
          <span className="text-xs text-gray-500">
            ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isPDF && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="Alejar"
              >
                <ZoomOut size={20} />
              </button>

              <span className="text-sm font-medium text-gray-700 min-w-15 text-center">
                {zoom}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="Acercar"
              >
                <ZoomIn size={20} />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-2"></div>

              <button
                onClick={handleRotate}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                title="Rotar 90°"
              >
                <RotateCw size={20} />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-2"></div>
            </>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Descargar"
          >
            <Download size={20} />
          </button>

          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Eliminar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Vista previa */}
      <div className="relative bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center min-h-96 max-h-150 overflow-auto p-4">
          {isPDF ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600 mt-1">Documento PDF listo para procesar</p>
              </div>
            </div>
          ) : (
            <img
              src={preview}
              alt="Vista previa"
              className="transition-transform duration-300 shadow-lg"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                maxWidth: zoom > 100 ? 'none' : '100%',
                maxHeight: zoom > 100 ? 'none' : '100%',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}