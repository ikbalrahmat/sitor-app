import { useAuth } from '../../context/AuthContext';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardUser from './pages/DashboardUser';
import DashboardSuperAdmin from './pages/DashboardSuperAdmin';

export default function DashboardHome() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Memuat...</div>;
  }

  // Merender tampilan dashboard yang berbeda-beda berdasarkan Role
  switch (user.role) {
    case 'Super Admin':
      return <DashboardSuperAdmin />;
    case 'Manajemen':
    case 'Admin':
      return <DashboardAdmin />;
    case 'User':
    default:
      // Sebagai default fallback, asumsikan akun pengguna biasa
      return <DashboardUser />;
  }
}
