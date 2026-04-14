import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Fungsi buat nentuin judul berdasarkan URL (path) yang aktif
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/unit-kompetensi':
        return 'Profil Kompetensi';
      case '/rencana-kompetensi':
        return 'Perencanaan Kompetensi';
      case '/daftar-kompetensi':
        return 'Daftar Kompetensi';
      case '/matriks-risiko':
        return 'Matriks Risiko';
      case '/penugasan-audit':
        return 'Penugasan Audit';
      case '/user-management':
        return 'User Management';
      case '/pengaturan':
        return 'Pengaturan';
      default:
        return 'Dashboard'; // Fallback kalau halamannya nggak dikenali
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden mr-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          {/* Judulnya sekarang dipanggil pakai fungsi getPageTitle() */}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {getPageTitle()}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative">
            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.nama || 'Pengguna'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Akses Terbatas'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors group"
            title="Logout"
          >
            <LogOut className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
          </button>
        </div>
      </div>
    </header>
  );
}