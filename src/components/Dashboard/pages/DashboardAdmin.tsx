import { useState, useEffect } from 'react';
import { 
  Users, Award, AlertTriangle, Activity, 
  BookOpen, FileText, CheckCircle2, Bookmark
} from 'lucide-react';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

// Fungsi perhitungan expired
const calculateStatus = (dateString: string) => {
  if (!dateString || dateString === '-') return '-';
  const expDate = new Date(dateString);
  if (isNaN(expDate.getTime())) return '-';
  const today = new Date();
  expDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 90) return 'Hampir Expired';
  return 'Aktif';
};

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalAuditor: 0,
    totalSertifikat: 0,
    totalSertifikatExpired: 0,
    totalAdaFile: 0, 
    totalDiklatBasic: 0
  });

  const [jenisProgramRecap, setJenisProgramRecap] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [usersRes, diklatRes] = await Promise.all([
          api.get('/users', config),
          api.get('/diklat', config),
        ]);

        const usersData = usersRes.data;
        const diklatData = diklatRes.data;

        // 1. Hitung Jumlah Auditor (Exclude Magang, PKWT, Outsourcing)
        const excludedStatus = ['Magang', 'Pegawai Kontrak / PKWT', 'Outsourcing'];
        const validUsers = usersData.filter((u: any) => 
          (u.role === 'User' || u.role === 'Manajemen') && !excludedStatus.includes(u.status_kepegawaian)
        );
        const auditorCount = validUsers.length;

        // 2 & 3. Hitung Sertifikat dari Diklat
        let sertifikatCount = diklatData.length; 
        let expiredCount = 0;
        let adaFileCount = 0;
        let diklatBasicCount = 0;
        
        const programMap = new Map();

        diklatData.forEach((d: any) => {
          // Hitung Status
          if (calculateStatus(d.tanggal_expired) === 'Expired') {
            expiredCount++;
          }
          
          if (d.sertifikat_path) {
            adaFileCount++;
          }

          if (d.jenis && d.jenis.toLowerCase() === 'diklat') {
            diklatBasicCount++;
          }

          // Agregasi Jenis Program
          const jenis = d.jenis && d.jenis !== '-' ? d.jenis : 'Lainnya';
          if (programMap.has(jenis)) {
            programMap.set(jenis, programMap.get(jenis) + 1);
          } else {
            programMap.set(jenis, 1);
          }
        });

        const recapArray = Array.from(programMap, ([name, count]) => ({ name, count }))
                                .sort((a, b) => b.count - a.count); 

        setJenisProgramRecap(recapArray);
        
        setStats({
          totalAuditor: auditorCount,
          totalSertifikat: sertifikatCount,
          totalSertifikatExpired: expiredCount,
          totalAdaFile: adaFileCount,
          totalDiklatBasic: diklatBasicCount
        });

      } catch (error) {
        console.error("Gagal memuat data dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Menghimpun Laporan Kompetensi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER GREETING */}
      <div className="bg-gradient-to-r from-[#0b3c5d] to-[#1d5b87] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Selamat Datang, {user?.nama}!</h1>
          <p className="text-blue-100 font-medium max-w-2xl text-sm leading-relaxed">
            Ini adalah ringkasan Eksekutif Sistem Kompetensi Auditor. Pantau ketersediaan SDM Auditor Tetap dan rekapitulasi keikutsertaan program kompetensi secara *real-time*.
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Auditor Tetap</p>
            <h2 className="text-3xl font-black text-gray-900">{stats.totalAuditor} <span className="text-sm font-medium text-gray-500">Personel</span></h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Sertifikat / Program</p>
            <h2 className="text-3xl font-black text-gray-900">{stats.totalSertifikat} <span className="text-sm font-medium text-gray-500">Record</span></h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sertifikat Expired</p>
            <h2 className="text-3xl font-black text-gray-900">{stats.totalSertifikatExpired} <span className="text-sm font-medium text-gray-500">Butuh Perpanjangan</span></h2>
          </div>
        </div>
      </div>

      {/* REKAPITULASI BAWAH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex-1">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Rekapitulasi Fisik & Kategori</h2>
            </div>
            
            <div className="flex bg-blue-50/50 rounded-xl border border-blue-100 p-6 items-center space-x-6 mb-4">
              <FileText className="w-12 h-12 text-blue-500" />
              <div>
                <h3 className="text-4xl font-black text-blue-700">{stats.totalAdaFile}</h3>
                <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mt-1">Total Record Bersertifikat (Upload)</p>
                <p className="text-xs text-blue-600 mt-1">Data yang file sertifikat PDF/Gambarnya sudah dilampirkan.</p>
              </div>
            </div>
            
            <div className="flex bg-emerald-50/50 rounded-xl border border-emerald-100 p-6 items-center space-x-6">
              <BookOpen className="w-12 h-12 text-emerald-500" />
              <div>
                <h3 className="text-4xl font-black text-emerald-700">{stats.totalDiklatBasic}</h3>
                <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider mt-1">Total Khusus "Diklat"</p>
                <p className="text-xs text-emerald-600 mt-1">Program yang di-input dengan jenis spesifik 'Diklat'.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-3">
              <Bookmark className="w-6 h-6 text-[#0b3c5d]" />
              <h2 className="text-lg font-bold text-gray-900">Rekapitulasi Jenis Program Lainnya</h2>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase">Kategori Input</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {jenisProgramRecap.length > 0 ? (
              jenisProgramRecap.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-blue-50/50 transition-colors rounded-xl border border-slate-100">
                  <span className="font-bold text-gray-700 text-sm uppercase">{item.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black text-[#0b3c5d]">{item.count}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Record</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-xl">
                Belum ada rekaman jenis program kompetensi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
