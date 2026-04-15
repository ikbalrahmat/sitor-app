import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { ShieldCheck, Users, Lock, Unlock, Activity, UserCog } from 'lucide-react';

export default function DashboardSuperAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSuperAdmin: 0,
    totalManajemen: 0,
    totalUserBiasa: 0,
    totalLocked: 0,
    totalActive: 0,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const allUsers = res.data;
        
        let superAdminCount = 0;
        let manajemenCount = 0;
        let userBiasaCount = 0;
        let lockedCount = 0;
        let activeCount = 0;

        allUsers.forEach((u: any) => {
          if (u.role === 'Super Admin') superAdminCount++;
          if (u.role === 'Manajemen') manajemenCount++;
          if (u.role === 'User') userBiasaCount++;
          
          if (u.is_locked) lockedCount++;
          if (u.status_keaktifan) activeCount++;
        });

        setStats({
          totalUsers: allUsers.length,
          totalSuperAdmin: superAdminCount,
          totalManajemen: manajemenCount,
          totalUserBiasa: userBiasaCount,
          totalLocked: lockedCount,
          totalActive: activeCount,
        });

      } catch (error) {
        console.error('Gagal mengambil data user', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Menghimpun Laporan Sistem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER TERTENTU BUAT SUPER ADMIN */}
      <div className="bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">System Administrator</h1>
            <p className="text-red-100 font-medium max-w-2xl text-sm leading-relaxed">
              Halo, {user?.nama}! Anda memiliki akses penuh ke pengaturan akun dan konfigurasi sistem SITOR. Awasi metrik keamanan secara berkala.
            </p>
          </div>
          <div className="hidden md:flex p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
            <UserCog className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      {/* KPI KARTU KEAMANAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-3">
            <Users className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pengguna</p>
          <h2 className="text-3xl font-black text-gray-900">{stats.totalUsers}</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3">
            <Unlock className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Akun Aktif</p>
          <h2 className="text-3xl font-black text-gray-900">{stats.totalActive}</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-red-500"></div>
          <div className="p-4 bg-red-50 text-red-600 rounded-full mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Terkunci (Locked)</p>
          <h2 className="text-3xl font-black text-red-600">{stats.totalLocked}</h2>
          {stats.totalLocked > 0 && (
            <p className="text-[10px] text-red-500 font-bold mt-1">Butuh penanganan!</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-full mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Super Admin</p>
          <h2 className="text-3xl font-black text-gray-900">{stats.totalSuperAdmin}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DISTRIBUSI ROLE */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Distribusi Hak Akses (Role)</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-700">User (Auditor Biasa)</span>
                <span className="font-bold text-indigo-600">{stats.totalUserBiasa}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(stats.totalUserBiasa / stats.totalUsers) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-700">Manajemen (Eksekutif)</span>
                <span className="font-bold text-indigo-600">{stats.totalManajemen}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: `${(stats.totalManajemen / stats.totalUsers) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-700">Super Admin (IT/Keamanan)</span>
                <span className="font-bold text-indigo-600">{stats.totalSuperAdmin}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${(stats.totalSuperAdmin / stats.totalUsers) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* TINDAKAN CEPAT */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Tindakan Cepat</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/user-management')}
              className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Users className="w-10 h-10 text-slate-400 group-hover:text-blue-600 mb-3" />
              <span className="font-bold text-slate-700 group-hover:text-blue-800">Manajemen User</span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest text-center">Tambah/Edit/Hapus Akun</span>
            </button>

            <button 
              onClick={() => navigate('/activity-log')}
              className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all group"
            >
              <Activity className="w-10 h-10 text-slate-400 group-hover:text-amber-600 mb-3" />
              <span className="font-bold text-slate-700 group-hover:text-amber-800">Log Aktivitas</span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest text-center">Pantau Jejak Audit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
