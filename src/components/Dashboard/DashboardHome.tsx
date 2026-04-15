import { useState, useEffect } from 'react';
import { 
  Users, Award, ShieldAlert, TrendingUp, 
  BookOpen, AlertTriangle, CheckCircle2, Activity 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHome() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalAuditor: 0,
    sertifikatAktif: 0,
    sertifikatWarning: 0,
    avgKompetensi: 0,
    highRiskCount: 0,
    totalPelatihan: 0,
  });

  const [riskDistribution, setRiskDistribution] = useState({
    rendah: 0, sedang: 0, tinggi: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Tarik semua data dari 4 pilar utama aplikasi
        const [usersRes, diklatRes, penilaianRes, risikoRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/users', config),
          axios.get('http://127.0.0.1:8000/api/diklat', config),
          axios.get('http://127.0.0.1:8000/api/penilaian', config),
          axios.get('http://127.0.0.1:8000/api/matriks-risiko', config)
        ]);

        const usersData = usersRes.data;
        const diklatData = diklatRes.data;
        const penilaianData = penilaianRes.data;
        const risikoData = risikoRes.data;

        // 1. Hitung Jumlah Auditor
        const auditorCount = usersData.filter((u: any) => u.role === 'User').length;

        // 2. Hitung Status Sertifikat
        let aktif = 0;
        let warning = 0;
        const today = new Date();
        
        diklatData.forEach((d: any) => {
          if (d.tanggal_expired && d.tanggal_expired !== '-') {
            const expDate = new Date(d.tanggal_expired);
            const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 90) aktif++;
            else warning++; // Expired atau Hampir Expired
          }
        });

        // 3. Hitung Rata-rata Assessment (Daftar Kompetensi)
        let totalNilai = 0;
        let countNilai = 0;
        
        // Filter penilaian hanya untuk user yang datanya ditarik
        const validUserIds = usersData.map((u: any) => u.id);
        penilaianData.forEach((p: any) => {
           if (validUserIds.includes(p.id)) {
             totalNilai += (p.core + p.role + p.soft) / 3;
             countNilai++;
           }
        });
        const avgKomp = countNilai > 0 ? Math.round(totalNilai / countNilai) : 0;

        // 4. Hitung Distribusi Risiko
        let rRendah = 0, rSedang = 0, rTinggi = 0;
        let highRiskUserCount = 0;

        risikoData.forEach((r: any) => {
          if (validUserIds.includes(r.id)) {
            // Cek apakah punya risiko tinggi di salah satu area
            if (r.opsTI === 'Tinggi' || r.keuanganFraud === 'Tinggi' || r.kepatuhan === 'Tinggi') {
              highRiskUserCount++;
            }
            
            // Hitung akumulasi area risiko
            ['opsTI', 'keuanganFraud', 'kepatuhan'].forEach(area => {
              if (r[area] === 'Rendah') rRendah++;
              if (r[area] === 'Sedang') rSedang++;
              if (r[area] === 'Tinggi') rTinggi++;
            });
          }
        });

        setRiskDistribution({ rendah: rRendah, sedang: rSedang, tinggi: rTinggi });
        
        setStats({
          totalAuditor: auditorCount,
          sertifikatAktif: aktif,
          sertifikatWarning: warning,
          avgKompetensi: avgKomp,
          highRiskCount: highRiskUserCount,
          totalPelatihan: diklatData.length,
        });

      } catch (error) {
        console.error("Gagal memuat data dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalRisikoArea = riskDistribution.rendah + riskDistribution.sedang + riskDistribution.tinggi;
  const persenRendah = totalRisikoArea ? Math.round((riskDistribution.rendah / totalRisikoArea) * 100) : 0;
  const persenSedang = totalRisikoArea ? Math.round((riskDistribution.sedang / totalRisikoArea) * 100) : 0;
  const persenTinggi = totalRisikoArea ? Math.round((riskDistribution.tinggi / totalRisikoArea) * 100) : 0;

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
            Ini adalah ringkasan Eksekutif (Dashboard) Sistem Kompetensi Auditor. Pantau kesiapan SDM, sertifikasi, dan peta risiko penugasan tim secara *real-time*.
          </p>
        </div>
      </div>

      {/* KPI CARDS (KEY PERFORMANCE INDICATORS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Auditor</p>
            <h2 className="text-2xl font-black text-gray-900">{stats.totalAuditor} <span className="text-sm font-medium text-gray-500">Personel</span></h2>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rata-Rata Nilai</p>
            <h2 className="text-2xl font-black text-gray-900">{stats.avgKompetensi} <span className="text-sm font-medium text-gray-500">/ 100</span></h2>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sertifikat Aktif</p>
            <h2 className="text-2xl font-black text-gray-900">{stats.sertifikatAktif} <span className="text-sm font-medium text-gray-500">Dokumen</span></h2>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sertifikat Expired</p>
            <h2 className="text-2xl font-black text-gray-900">{stats.sertifikatWarning} <span className="text-sm font-medium text-gray-500">Perlu Perpanjangan</span></h2>
          </div>
        </div>

      </div>

      {/* CHARTS / PROGRESS BARS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PROGRESS BAR: MATRIKS RISIKO */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldAlert className="w-6 h-6 text-[#78231c]" />
            <h2 className="text-lg font-bold text-gray-900">Distribusi Peta Risiko (Keseluruhan)</h2>
          </div>

          <div className="space-y-6">
            {/* Risiko Rendah */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-green-700">Risiko Rendah (Aman)</span>
                <span className="text-gray-600">{persenRendah}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${persenRendah}%` }}></div>
              </div>
            </div>

            {/* Risiko Sedang */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-amber-600">Risiko Sedang (Perlu Perhatian)</span>
                <span className="text-gray-600">{persenSedang}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-amber-400 h-3 rounded-full transition-all duration-1000" style={{ width: `${persenSedang}%` }}></div>
              </div>
            </div>

            {/* Risiko Tinggi */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-red-600">Risiko Tinggi (Kritis)</span>
                <span className="text-gray-600">{persenTinggi}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-red-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${persenTinggi}%` }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium leading-relaxed">
              Terdapat <b className="font-black text-red-900">{stats.highRiskCount} Auditor</b> yang memiliki setidaknya satu area dengan <b>Risiko Tinggi</b>. Hindari penugasan tanpa pendampingan senior.
            </p>
          </div>
        </div>

        {/* STATISTIK DIKLAT / RKT */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Rekapitulasi Diklat & Sertifikasi</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 h-[calc(100%-4rem)]">
            <div className="bg-blue-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center border border-blue-100">
              <CheckCircle2 className="w-10 h-10 text-blue-500 mb-3" />
              <h3 className="text-4xl font-black text-blue-900 mb-1">{stats.totalPelatihan}</h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Total Pelatihan /<br/>Sertifikasi Diikuti</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Assessment</p>
                <div className="flex items-end space-x-2">
                  <span className="text-2xl font-black text-slate-800">{stats.avgKompetensi >= 75 ? 'Tercapai' : 'Kurang'}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Batas kelayakan rata-rata nilai kompetensi adalah 75.</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rasio Kesiapan</p>
                <div className="flex items-end space-x-2">
                  <span className="text-2xl font-black text-slate-800">{stats.totalAuditor > 0 ? Math.round((stats.sertifikatAktif / stats.totalAuditor)) : 0}</span>
                  <span className="text-sm font-bold text-slate-500 mb-1">Sertifikat / Org</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}