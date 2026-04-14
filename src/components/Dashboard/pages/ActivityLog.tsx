import { useState, useEffect } from 'react';
import { Activity, Search, ShieldAlert, Monitor, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  // Filter pencarian
  const filteredLogs = logs.filter(log => 
    (log.email?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (log.event_type?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (log.description?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
  );

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
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari email, event, atau deskripsi..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-3 rounded-2xl border border-slate-200">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Menampilkan 100 Log Terbaru</span>
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
    </div>
  );
}