import { 
  Home, 
  Upload, 
  FileText, 
  CheckCircle, 
  Building2, 
  BarChart3,
  X 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Subir Documentos' },
    { path: '/facturas', icon: FileText, label: 'Lista de Documentos' },
    { path: '/pendientes', icon: CheckCircle, label: 'Pendientes' },
    { path: '/proveedores', icon: Building2, label: 'Proveedores' },
    { path: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header del Sidebar (solo mobile) */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${active 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="bg-primary-50 rounded-lg p-2">
            <p className="text-[10px] font-medium text-primary-900 truncate">Sistema de Documentos</p>
            <p className="text-[10px] text-primary-700">v2.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}