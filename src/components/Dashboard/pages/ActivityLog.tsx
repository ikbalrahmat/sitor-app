import { useState, useEffect } from 'react';
import { Activity, Search, ShieldAlert, Monitor, Clock, AlertCircle, Download, RefreshCw, X, Calendar } from 'lucide-react';
import api from '../../../lib/api';
import * as XLSX from 'xlsx';

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportPreset, setExportPreset] = useState('semua_waktu');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Gagal mengambil data log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memberi warna badge berdasarkan tipe event
  const getBadgeStyle = (eventType: string) => {
    if (eventType.includes('SUCCESS')) return 'bg-green-100 text-green-700 border-green-200';
    if (eventType.includes('FAILED') || eventType.includes('LOCKED') || eventType.includes('BLOCKED')) return 'bg-red-100 text-red-700 border-red-200';
    if (eventType.includes('PASSWORD')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Filter pencarian teks untuk tabel di layar
  const filteredLogs = logs.filter(log => 
    (log.email?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (log.event_type?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (log.description?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
  );

  // Export ke Excel
  const handleExportExcel = async () => {
    let finalLogs = [...filteredLogs]; // ekspor mengikuti filter pencarian di layar
    
    // Terapkan filter tanggal dari modal
    const now = new Date();
    let startD: number | null = null;
    let endD: number | null = null;

    if (exportPreset === 'hari_ini') {
        startD = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        endD = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    } else if (exportPreset === '7_hari') {
        startD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        endD = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    } else if (exportPreset === 'bulan_ini') {
        startD = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        endD = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    } else if (exportPreset === 'manual') {
        if (exportStartDate) startD = new Date(exportStartDate).setHours(0, 0, 0, 0);
        if (exportEndDate) endD = new Date(exportEndDate).setHours(23, 59, 59, 999);
    }

    if (startD !== null || endD !== null) {
        finalLogs = finalLogs.filter(log => {
            const logD = new Date(log.created_at).getTime();
            if (startD !== null && logD < startD) return false;
            if (endD !== null && logD > endD) return false;
            return true;
        });
    }

    if (finalLogs.length === 0) {
      alert("Tidak ada data untuk diekspor pada rentang waktu ini.");
      return;
    }

    setIsExporting(true);
    
    // Memberikan jeda waktu (animasi) sedikit agar user melihat indikator loading
    await new Promise(resolve => setTimeout(resolve, 800));

    const dataToExport = finalLogs.map(log => {
      const logDate = new Date(log.created_at);
      return {
        'Waktu Akses': `${logDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${logDate.toLocaleTimeString('id-ID')}`,
        'Pengguna / Email': `${log.user ? log.user.nama : 'Unknown User'} (${log.email})`,
        'Status Event': log.event_type.replace(/_/g, ' '),
        'Deskripsi': log.description,
        'Network & Perangkat': `IP: ${log.ip_address} | Perangkat: ${log.user_agent}`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Mengatur lebar kolom agar rapi di Excel
    worksheet['!cols'] = [
      { wch: 25 }, // Waktu Akses
      { wch: 45 }, // Pengguna / Email
      { wch: 25 }, // Status Event
      { wch: 60 }, // Deskripsi
      { wch: 70 }  // Network & Perangkat
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    
    // Menyusun nama file
    let fileSuffix = 'Semua_Waktu';
    if (exportPreset === 'hari_ini') fileSuffix = 'Hari_Ini';
    else if (exportPreset === '7_hari') fileSuffix = '7_Hari_Terakhir';
    else if (exportPreset === 'bulan_ini') fileSuffix = 'Bulan_Ini';
    else if (exportPreset === 'manual' && (exportStartDate || exportEndDate)) {
      fileSuffix = `${exportStartDate || 'Awal'}_sd_${exportEndDate || 'Akhir'}`;
    }
      
    XLSX.writeFile(workbook, `Audit_Logs_${fileSuffix}.xlsx`);

    setIsExporting(false);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-blue-600" />
            Audit & Keamanan
          </h1>
          <p className="text-slate-500 font-medium mt-1">Pemantauan aktivitas log pengguna dan keamanan sistem.</p>
        </div>
      </div>

      {/* Konten Tabel */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center bg-slate-50/30 gap-4">
          <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari email, event, atau deskripsi..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center justify-center gap-2 text-xs font-bold text-white px-5 py-3 rounded-2xl border border-green-800 bg-[#107c41] hover:bg-green-700 hover:scale-105 transition-all shadow-sm"
              title="Unduh Laporan Log"
            >
              <Download className="w-4 h-4 drop-shadow-sm" />
              <span>Export Excel</span>
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Log Sistem Aktif</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="px-8 py-5">Waktu Akses</th>
                <th className="px-8 py-5">Pengguna / Email</th>
                <th className="px-8 py-5">Status Event</th>
                <th className="px-8 py-5">Deskripsi</th>
                <th className="px-8 py-5">Network & Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium">Memuat data log aktivitas...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-slate-300" />
                      <p className="text-slate-500 font-medium">Tidak ada data log yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const logDate = new Date(log.created_at);
                  return (
                    <tr key={log.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">
                              {logDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              {logDate.toLocaleTimeString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{log.user ? log.user.nama : 'Unknown User'}</span>
                          <span className="text-[11px] font-medium text-slate-500">{log.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-widest ${getBadgeStyle(log.event_type)}`}>
                          {log.event_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-sm text-slate-600 font-medium max-w-xs truncate" title={log.description}>
                          {log.description}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-start space-x-2">
                          <Monitor className="w-4 h-4 text-slate-400 mt-0.5" />
                          <div className="flex flex-col max-w-[200px]">
                            <span className="text-xs font-bold text-slate-700">{log.ip_address}</span>
                            <span className="text-[10px] text-slate-400 truncate" title={log.user_agent}>{log.user_agent}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                <Download className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Unduh Log Aktivitas</h2>
            </div>

            <div className="space-y-6">
              {/* Preset Rentang Otomatis */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Pilih Rentang Otomatis</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'hari_ini', label: 'Hari Ini' },
                    { id: '7_hari', label: '7 Hari Terakhir' },
                    { id: 'bulan_ini', label: 'Bulan Ini' },
                    { id: 'semua_waktu', label: 'Semua Waktu' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setExportPreset(preset.id);
                        setExportStartDate('');
                        setExportEndDate('');
                      }}
                      className={`py-2.5 px-2 text-[11px] font-bold rounded-2xl border transition-all ${
                        exportPreset === preset.id 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ATAU Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="border-t border-slate-100 flex-1"></div>
                <span className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">ATAU</span>
                <div className="border-t border-slate-100 flex-1"></div>
              </div>

              {/* Tanggal Manual */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Tentukan Tanggal Manual</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mb-2">
                      <Calendar className="w-3.5 h-3.5" /> Mulai Tanggal
                    </label>
                    <input 
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => {
                        setExportStartDate(e.target.value);
                        setExportPreset('manual');
                      }}
                      className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm font-medium outline-none transition-all ${
                        exportPreset === 'manual' && exportStartDate ? 'border-blue-500 ring-2 ring-blue-50 text-slate-800' : 'border-slate-200 focus:border-blue-500 text-slate-500 focus:ring-2 focus:ring-blue-50'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mb-2">
                      <Calendar className="w-3.5 h-3.5" /> Sampai Tanggal
                    </label>
                    <input 
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => {
                        setExportEndDate(e.target.value);
                        setExportPreset('manual');
                      }}
                      className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm font-medium outline-none transition-all ${
                        exportPreset === 'manual' && exportEndDate ? 'border-blue-500 ring-2 ring-blue-50 text-slate-800' : 'border-slate-200 focus:border-blue-500 text-slate-500 focus:ring-2 focus:ring-blue-50'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="pt-6">
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className={`w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-3 transition-all shadow-lg ${
                    isExporting 
                      ? 'bg-green-800 cursor-not-allowed opacity-90 scale-[0.98]' 
                      : 'bg-[#107c41] hover:bg-green-700 hover:shadow-green-700/20 hover:scale-[1.02]'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-green-200" />
                      <span className="text-green-50">Mengekspor...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      UNDUH EXCEL (.XLSX)
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-medium mt-4 px-4">
                  Format berjenis XLSX: Data dapat dibuka dan difilter pada Microsoft Excel dengan mudah.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
