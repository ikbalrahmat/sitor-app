import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ShieldAlert, 
  ClipboardCheck,
  Users,
  Settings,
  X,
  Activity // <-- Tambahan icon untuk Audit Log
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuGroups = [
  {
    group: null, 
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    group: 'MANAJEMEN KOMPETENSI',
    items: [
      { id: 'unit-kompetensi', label: 'Profil Kompetensi', icon: BookOpen },
      { id: 'rencana-kompetensi', label: 'Perencanaan Kompetensi', icon: ClipboardList },
      { id: 'matriks-risiko', label: 'Matriks Risiko', icon: ShieldAlert },
      { id: 'penugasan-audit', label: 'Penugasan Audit', icon: ClipboardCheck },
    ]
  },
  {
    group: 'SISTEM', 
    items: [
      { id: 'user-management', label: 'User Management', icon: Users },
      { id: 'activity-log', label: 'Audit & Log', icon: Activity }, // <-- MENU BARU DITAMBAHKAN DI SINI
      { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
    ]
  }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();

  // FILTERING MENU BERDASARKAN ROLE
  const filteredMenuGroups = menuGroups.map(group => {
    const filteredItems = group.items.filter(item => {
      
      if (user?.role === 'Super Admin') {
        // Super Admin cuma butuh User Management, Audit Log & Pengaturan
        return ['dashboard', 'user-management', 'activity-log', 'pengaturan'].includes(item.id);
      }
      
      if (user?.role === 'Admin') {
        // Admin adalah Eksekutor, buka semua menu
        return true;
      }
      
      if (user?.role === 'Manajemen') {
        // Manajemen (Viewer) -> Lihat Dashboard, Profil, Penilaian, Matriks, dan Penugasan
        return ['dashboard', 'unit-kompetensi', 'matriks-risiko', 'penugasan-audit'].includes(item.id);
      }
      
      if (user?.role === 'User') {
        // User (Auditor) -> Cuma Dashboard, Perencanaan Kompetensi (Kompetensi Saya), dan Pengaturan
        return ['dashboard', 'rencana-kompetensi', 'pengaturan'].includes(item.id);
      }
      
      return false;
    });
    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-72 bg-white border-r border-gray-100
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 mb-2">
            <div className="flex items-center space-x-3">
              {!imageError ? (
                <img 
                  src="/logo-sitor.png" 
                  alt="Logo Si-Tor" 
                  className="w-12 h-12 object-contain drop-shadow-sm"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Si-Tor</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-wider">Sistem Kompetensi Auditor</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-7">
              {filteredMenuGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-2">
                  {group.group && (
                    <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">
                      {group.group}
                    </p>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === `/${item.id}` || (item.id === 'dashboard' && location.pathname === '/');
                      
                      // Khusus untuk User, kita ubah label Rencana Kompetensi jadi "Kompetensi Saya"
                      const labelToDisplay = (user?.role === 'User' && item.id === 'rencana-kompetensi') ? 'Kompetensi Saya' : item.label;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(item.id === 'dashboard' ? '/' : `/${item.id}`);
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`
                            w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                            transition-all duration-200 group
                            ${isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                          <span className="font-medium text-[14px]">{labelToDisplay}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
          <div className="p-4 border-t border-slate-50 bg-slate-50/30">
            <div className="flex items-center space-x-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.nama || 'Pengguna'}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate">{user?.role || 'Akses Terbatas'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
