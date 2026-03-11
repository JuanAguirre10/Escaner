import { Menu, Bell, User } from 'lucide-react';

export default function Header({ onMenuClick }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg sm:text-xl">S</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-gray-900 text-sm sm:text-base">SUPERVAN</h1>
              <p className="text-xs text-gray-500">Sistema de Documentos</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              <User size={14} className="text-primary-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-xs sm:text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}