import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api, { STORAGE_URL } from '../../../lib/api';
import { Activity } from 'lucide-react';

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

const CircularProgress = ({ title, valueText, percentage }: {title: string, valueText: string | number, percentage: number}) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const validPercentage = isNaN(percentage) ? 0 : percentage;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-[13px] font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-1 flex items-center justify-center relative">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle cx="56" cy="56" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
          <circle 
            cx="56" cy="56" r={radius} 
            stroke="#3b82f6" 
            strokeWidth="8" 
            fill="transparent"
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex items-center justify-center text-lg font-bold text-gray-800">
          {valueText}
        </div>
      </div>
    </div>
  );
};

export default function DashboardUser() {
  const { user } = useAuth();
  const [diklats, setDiklats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiklats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/diklat', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter out only this user's diklat
        // Jika backend sudah memfilter otomatis berdasarkan token, baris ini sebagai double-check
        const myDiklats = res.data.filter((d: any) => d.user_id === user?.id);
        
        const mapped = myDiklats.map((d: any) => ({
          ...d,
          computedStatus: d.tanggal_expired ? calculateStatus(d.tanggal_expired) : 'DIRENCANAKAN',
          isPlanned: !!d.rencana_diklat && d.rencana_diklat !== '-', 
          isRealized: !!d.realisasi_diklat && d.realisasi_diklat !== '-' 
        }));

        setDiklats(mapped);
      } catch (error) {
        console.error('Gagal mengambil riwayat sertifikat', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.id) fetchDiklats();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Memuat Profil Kompetensi Anda...</p>
      </div>
    );
  }

  // Perhitungan Stats
  const realizedComps = diklats.filter(c => c.isRealized);
  const plannedComps = diklats.filter(c => c.isPlanned);
  const totalPlanned = plannedComps.length;
  const totalRealized = realizedComps.length;
  const targetRealizedPercent = totalPlanned > 0 ? Math.min(Math.round((totalRealized / totalPlanned) * 100), 100) : (totalRealized > 0 ? 100 : 0);

  const validComps = diklats.filter(c => c.computedStatus !== 'DIRENCANAKAN');
  const totalValid = validComps.length;

  const countAktif = validComps.filter(c => c.computedStatus === 'Aktif').length;
  const aktifPercent = totalValid > 0 ? Math.round((countAktif / totalValid) * 100) : 0;

  const countHampirExpired = validComps.filter(c => c.computedStatus === 'Hampir Expired').length;
  const hampirExpiredPercent = totalValid > 0 ? Math.round((countHampirExpired / totalValid) * 100) : 0;

  const countExpired = validComps.filter(c => c.computedStatus === 'Expired').length;
  const expiredPercent = totalValid > 0 ? Math.round((countExpired / totalValid) * 100) : 0;

  // Render Status Badge di Tabel
  const renderStatusBadge = (status: string) => {
    if (status === 'Aktif') return <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-[10px] uppercase tracking-wider rounded-lg">AKTIF</span>;
    if (status === 'Hampir Expired') return <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-[10px] uppercase tracking-wider rounded-lg">HAMPIR EXPIRED</span>;
    if (status === 'Expired') return <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-[10px] uppercase tracking-wider rounded-lg">EXPIRED</span>;
    return <span className="px-3 py-1 bg-gray-100 text-gray-500 font-bold text-[10px] uppercase tracking-wider rounded-lg">{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* HEADER TERTENTU BUAT USER */}
      <div className="bg-gradient-to-r from-[#0b3c5d] to-[#1d5b87] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Halo, {user?.nama}!</h1>
          <p className="text-blue-100 font-medium max-w-2xl text-sm leading-relaxed">
            Ini adalah Dashboard Personal Anda. Anda dapat memantau capaian sertifikat, riwayat diklat, serta realisasi kompetensi Anda tahun ini.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* KOLOM KIRI: KARTU PROFIL */}
        <div className="w-full lg:w-[320px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col shrink-0 flex-grow-0 h-fit">
          <div className="flex flex-col items-center text-center mt-2 mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4 border-2 border-slate-100 shadow-md">
              {user?.photo ? (
                <img src={`${STORAGE_URL}/${user.photo}`} alt={user.nama} className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center h-full text-4xl font-bold text-gray-400">
                  {user?.nama?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{user?.nama}</h2>
            <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest">{user?.jabatan || 'Auditor'}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#f8fafc] rounded-xl p-4 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Unit Kerja</span> 
              <span className="font-semibold text-gray-800 text-sm capitalize">{user?.unit_kerja || '-'}</span>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Program (Riwayat)</span> 
              <span className="font-black text-blue-600 text-lg">{diklats.length}</span>
            </div>
            
            <div className="bg-[#f8fafc] rounded-xl p-4 flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status Kepegawaian</span> 
              <span className="font-semibold text-gray-800 text-sm">{user?.status_kepegawaian || '-'}</span>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: STATISTIK & TABEL */}
        <div className="flex-1 space-y-6">
          
          {/* 4 Donut Charts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CircularProgress 
              title="Target vs Realisasi" 
              valueText={`${targetRealizedPercent}%`} 
              percentage={targetRealizedPercent} 
            />
            <CircularProgress 
              title="Sertifikat Aktif" 
              valueText={countAktif.toString()} 
              percentage={aktifPercent} 
            />
            <CircularProgress 
              title="Sertifikat Hampir Expired" 
              valueText={countHampirExpired.toString()} 
              percentage={hampirExpiredPercent} 
            />
            <CircularProgress 
              title="Sertifikat Expired" 
              valueText={countExpired.toString()} 
              percentage={expiredPercent} 
            />
          </div>

          {/* Tabel Riwayat */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Daftar Riwayat Program & Sertifikat</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e3a8a] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Nama Program / Sertifikat</th>
                    <th className="px-6 py-4">Jenis Program</th>
                    <th className="px-6 py-4">Tahun</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {diklats.map(c => {
                    const progName = (c.realisasi_diklat && c.realisasi_diklat !== '-') ? c.realisasi_diklat : 
                                     (c.rencana_diklat && c.rencana_diklat !== '-') ? c.rencana_diklat : '-';
                    return (
                      <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-800">{progName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{c.jenis || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{c.tahun || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(c.computedStatus)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {c.sertifikat_path ? (
                            <a 
                              href={`${STORAGE_URL}/${c.sertifikat_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 font-bold text-xs rounded-xl transition-all"
                            >
                              Lihat
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Tidak ada file</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {diklats.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 italic">
                        Belum ada riwayat diklat atau sertifikasi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
