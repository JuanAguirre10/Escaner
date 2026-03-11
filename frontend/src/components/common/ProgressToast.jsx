import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

export default function ProgressToast({ message, type = 'info', progress = 0, showProgress = false }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (type !== 'loading' && progress >= 100) {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [progress, type]);

  if (!visible) return null;

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    warning: <AlertCircle className="text-yellow-500" size={20} />,
    info: <AlertCircle className="text-blue-500" size={20} />,
    loading: <Loader className="text-blue-500 animate-spin" size={20} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    loading: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
    loading: 'text-blue-900',
  };

  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-md w-full sm:w-auto ${bgColors[type]} border-2 rounded-lg shadow-lg p-3 sm:p-4 animate-slide-in-right`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-medium ${textColors[type]}`}>{message}</p>
          {showProgress && type === 'loading' && (
            <div className="mt-2 sm:mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Procesando documento...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}>
                  <div className="h-full w-full bg-linear-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        {type !== 'loading' && (
          <button onClick={() => setVisible(false)} className={`shrink-0 ${textColors[type]} hover:opacity-70`}>
            <XCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}