import { useState, useEffect, useMemo } from 'react';
import {
  Users, Award, AlertTriangle, Activity,
  BookOpen, Bookmark, CheckCircle, FileText
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

  const [usersData, setUsersData] = useState<any[]>([]);
  const [diklatData, setDiklatData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('Semua');

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

        setUsersData(usersRes.data);
        setDiklatData(diklatRes.data);

      } catch (error) {
        console.error("Gagal memuat data dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const availableYears = ['Semua', ...Array.from(new Set(diklatData.map(d => d.tahun).filter(Boolean))).sort((a: any, b: any) => b - a)] as string[];

  const stats = useMemo(() => {
    const excludedStatus = ['Magang', 'Pegawai Kontrak / PKWT', 'Outsourcing'];
    const validUsers = usersData.filter((u: any) =>
      (u.role === 'User' || u.role === 'Manajemen') && !excludedStatus.includes(u.status_kepegawaian)
    );
    const auditorCount = validUsers.length;

    const filteredDiklat = selectedYear === 'Semua' 
      ? diklatData 
      : diklatData.filter(d => d.tahun == selectedYear);

    let sertifikatCount = filteredDiklat.length;
    let sertifikatProfesiAktif = 0;
    let sertifikatProfesiExpired = 0;
    let sertifikatKepesertaan = 0;

    let diklatCount = 0;
    let sertifikasiCount = 0;
    let lainnyaCount = 0;

    filteredDiklat.forEach((d: any) => {
      const isProfesi = d.kategori_sertifikat === 'Sertifikat Profesi';
      const status = calculateStatus(d.tanggal_expired);

      if (isProfesi) {
        if (status === 'Expired') {
          sertifikatProfesiExpired++;
        } else {
          sertifikatProfesiAktif++;
        }
      } else {
        sertifikatKepesertaan++;
      }

      const jenisLower = (d.jenis || '').toLowerCase().trim();
      if (jenisLower === 'diklat') {
        diklatCount++;
      } else if (jenisLower === 'sertifikasi') {
        sertifikasiCount++;
      } else {
        lainnyaCount++;
      }
    });

    return {
      totalAuditor: auditorCount, // Auditor count tidak terpengaruh filter tahun
      sertifikatProfesiAktif,
      sertifikatProfesiExpired,
      sertifikatKepesertaan,
      totalDiklat: diklatCount,
      totalSertifikasi: sertifikasiCount,
      totalLainnya: lainnyaCount
    };
  }, [usersData, diklatData, selectedYear]);

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
      {/* HEADER GREETING & FILTER TAHUN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-gradient-to-r from-[#0b3c5d] to-[#1d5b87] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex-1 w-full">
          <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
            <Activity className="w-64 h-64" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black mb-2 tracking-tight">Selamat Datang, {user?.nama}</h1>
              <p className="text-blue-100 font-medium max-w-2xl text-sm leading-relaxed">
                Ini adalah ringkasan Eksekutif Sistem Penugasan Audit dan Kompetensi Auditor.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex items-center gap-3">
              <label className="text-sm font-bold text-blue-100 whitespace-nowrap">Tahun:</label>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white text-[#0b3c5d] font-bold text-sm px-4 py-2 rounded-lg outline-none cursor-pointer border-none focus:ring-2 focus:ring-blue-300"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y === 'Semua' ? 'Semua Tahun' : y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Auditor</p>
            <h2 className="text-3xl font-black text-gray-900">{stats.totalAuditor}</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sertif. Profesi Aktif</p>
            <h2 className="text-3xl font-black text-gray-900">{stats.sertifikatProfesiAktif}</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sertif. Profesi Expired</p>
            <h2 className="text-3xl font-black text-gray-900">{stats.sertifikatProfesiExpired}</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sertif. Kepesertaan</p>
            <h2 className="text-3xl font-black text-gray-900">{stats.sertifikatKepesertaan}</h2>
          </div>
        </div>
      </div>

      {/* REKAPITULASI BAWAH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kotak Diklat */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Rekapitulasi Diklat</h2>
          </div>
          <div className="flex-1 flex bg-emerald-50/50 rounded-xl border border-emerald-100 p-6 items-center">
            <div>
              <h3 className="text-5xl font-black text-emerald-700 mb-2">{stats.totalDiklat}</h3>
              <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Total Record</p>
              <p className="text-xs text-emerald-600 mt-2 leading-relaxed">Program yang di-input dengan jenis 'Diklat'.</p>
            </div>
          </div>
        </div>

        {/* Kotak Sertifikasi */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <Award className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Rekapitulasi Sertifikasi</h2>
          </div>
          <div className="flex-1 flex bg-blue-50/50 rounded-xl border border-blue-100 p-6 items-center">
            <div>
              <h3 className="text-5xl font-black text-blue-700 mb-2">{stats.totalSertifikasi}</h3>
              <p className="text-sm font-bold text-blue-800 uppercase tracking-wider">Total Record</p>
              <p className="text-xs text-blue-600 mt-2 leading-relaxed">Program yang di-input dengan jenis 'Sertifikasi'.</p>
            </div>
          </div>
        </div>

        {/* Kotak Lainnya */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <Bookmark className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Rekapitulasi Lainnya</h2>
          </div>
          <div className="flex-1 flex bg-orange-50/50 rounded-xl border border-orange-100 p-6 items-center">
            <div>
              <h3 className="text-5xl font-black text-orange-700 mb-2">{stats.totalLainnya}</h3>
              <p className="text-sm font-bold text-orange-800 uppercase tracking-wider">Total Record</p>
              <p className="text-xs text-orange-600 mt-2 leading-relaxed">Selain 'Diklat' dan 'Sertifikasi'.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
