import { useState, useEffect } from 'react';
import { X, Download, Upload, Edit, Plus, Trash2 } from 'lucide-react';
import api, { STORAGE_URL } from '../../../lib/api';

// Tipe data untuk Status Kelayakan
type StatusKelayakan = 'Layak Ditugaskan' | 'Perlu Penguatan' | 'Tidak Direkomendasikan';



// --- FUNGSI BANTUAN UNTUK STATUS SERTIFIKAT ---
const calculateStatus = (dateString: string) => {
  if (!dateString || dateString === '-') return '-';
  
  const expDate = new Date(dateString);
  if (isNaN(expDate.getTime())) return '-';
  
  const today = new Date();
  expDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 90) return 'Hampir Expired';
  return 'Aktif';
};

// --- KOMPONEN BANTUAN UNTUK GRAFIK MELINGKAR (DONUT CHART) ---
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

export default function PenugasanAudit() {
  const [loading, setLoading] = useState(true);
  
  // Data Master dari API
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allDiklat, setAllDiklat] = useState<any[]>([]);
  
  // State untuk Tab / Unit Kerja
  const [unitKerjas, setUnitKerjas] = useState<string[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<string>(''); // Merupakan Unit Kerja

  // Data Evaluasi Per Unit Kerja dan User (Disimpan di localStorage sementara)
  const [evaluationStatuses, setEvaluationStatuses] = useState<Record<string, Record<string | number, StatusKelayakan>>>({});

  // Data Kompetensi Wajib Per Unit Kerja (Disimpan di localStorage sementara)
  const [kompetensiWajibMap, setKompetensiWajibMap] = useState<Record<string, string[]>>({});
  
  // State untuk Edit Kompetensi Wajib Modal
  const [showEditReqModal, setShowEditReqModal] = useState(false);
  const [tempReqs, setTempReqs] = useState<string[]>([]);
  const [newReq, setNewReq] = useState('');

  // State Untuk Modal Profil Personel (Persis Profil Kompetensi)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // State Untuk Pratinjau Dokumen
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileData, setPreviewFileData] = useState<{ fileName: string; fileUrl: string; fileType: string; } | null>(null);

  useEffect(() => {
    fetchData();
    
    // Load local storage statuses
    const savedStatusStr = localStorage.getItem('penugasanAuditStatus');
    if (savedStatusStr) setEvaluationStatuses(JSON.parse(savedStatusStr));

    // Load kompetensi wajib map from local storage
    const savedReqsStr = localStorage.getItem('kompetensiWajibMap');
    if (savedReqsStr) setKompetensiWajibMap(JSON.parse(savedReqsStr));
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, diklatRes] = await Promise.all([
        api.get('/users'),
        api.get('/diklat')
      ]);

      const users = usersRes.data.filter((u: any) => u.role === 'User' || u.role === 'Manajemen');
      setAllUsers(users);
      setAllDiklat(diklatRes.data);

      const uniqueUnits: string[] = Array.from(new Set(users.map((u: any) => u.unit_kerja).filter(Boolean)));
      setUnitKerjas(uniqueUnits);
      
      if (uniqueUnits.length > 0 && !selectedAudit) {
        setSelectedAudit(uniqueUnits[0]);
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (auditorId: string | number, newStatus: StatusKelayakan) => {
    const updatedStatuses = { ...evaluationStatuses };
    if (!updatedStatuses[selectedAudit]) {
      updatedStatuses[selectedAudit] = {};
    }
    updatedStatuses[selectedAudit][auditorId] = newStatus;
    
    setEvaluationStatuses(updatedStatuses);
    localStorage.setItem('penugasanAuditStatus', JSON.stringify(updatedStatuses));
  };

  const openReqModal = () => {
    setTempReqs(kompetensiWajibMap[selectedAudit] || []);
    setNewReq('');
    setShowEditReqModal(true);
  };

  const addReq = () => {
    if (newReq.trim()) {
      setTempReqs([...tempReqs, newReq.trim()]);
      setNewReq('');
    }
  };

  const removeReq = (index: number) => {
    const arr = [...tempReqs];
    arr.splice(index, 1);
    setTempReqs(arr);
  };

  const saveReqs = () => {
    const updatedMap = { ...kompetensiWajibMap, [selectedAudit]: tempReqs };
    setKompetensiWajibMap(updatedMap);
    localStorage.setItem('kompetensiWajibMap', JSON.stringify(updatedMap));
    setShowEditReqModal(false);
  };

  const handleViewProfile = (auditor: typeof allUsers[0]) => {
    const userDiklats = allDiklat.filter(d => d.user_id === auditor.id);
    
    const competencies = userDiklats.map(d => ({
      id: d.id,
      year: d.tahun,
      type: d.jenis,
      name: (d.realisasi_diklat && d.realisasi_diklat !== '-') ? d.realisasi_diklat : 
            (d.rencana_diklat && d.rencana_diklat !== '-') ? d.rencana_diklat : '-',
      status: d.tanggal_expired ? calculateStatus(d.tanggal_expired) : 'DIRENCANAKAN',
      certNumber: d.nomor_sertifikat || '-',
      fileLink: d.sertifikat_path ? `${STORAGE_URL}/${d.sertifikat_path}` : null,
      isPlanned: !!d.rencana_diklat && d.rencana_diklat !== '-', 
      isRealized: !!d.realisasi_diklat && d.realisasi_diklat !== '-' 
    }));

    const allComps = competencies;
    const realizedComps = allComps.filter((c: any) => c.isRealized);
    const plannedComps = allComps.filter((c: any) => c.isPlanned);
    
    const totalPlanned = plannedComps.length;
    const totalRealized = realizedComps.length;
    const targetRealizedPercent = totalPlanned > 0 ? Math.min(Math.round((totalRealized / totalPlanned) * 100), 100) : (totalRealized > 0 ? 100 : 0);

    const validComps = allComps.filter((c: any) => c.status !== 'DIRENCANAKAN');
    const countSertifikasi = validComps.filter((c: any) => c.type === 'Sertifikasi').length;
    const totalValid = validComps.length > 0 ? validComps.length : allComps.length;
    const sertifikasiPercent = totalValid > 0 ? Math.round((countSertifikasi / totalValid) * 100) : 0;

    const countAktif = validComps.filter((c: any) => c.status === 'Aktif').length;
    const aktifPercent = totalValid > 0 ? Math.round((countAktif / totalValid) * 100) : 0;

    const countWarning = validComps.filter((c: any) => c.status === 'Hampir Expired' || c.status === 'Expired').length;
    const warningPercent = totalValid > 0 ? Math.round((countWarning / totalValid) * 100) : 0;

    setSelectedProfile({
      name: auditor.nama,
      unit: auditor.unit_kerja || 'BELUM DIATUR',
      pos: auditor.jabatan || 'AUDITOR',
      status: auditor.status_keaktifan ? 'Aktif' : 'Tidak Aktif',
      statusKepegawaian: auditor.status_kepegawaian || 'TIDAK DIKETAHUI',
      avatar: auditor.nama.charAt(0).toUpperCase(),
      photo: auditor.photo ? `${STORAGE_URL}/${auditor.photo}` : null,
      np: auditor.np,
      validComps: validComps.length > 0 ? validComps : allComps,
      allComps: allComps, // Pass all competencies for "Total Program"
      kpi: {
        targetRealizedPercent,
        countSertifikasi,
        totalValid,
        sertifikasiPercent,
        countAktif,
        aktifPercent,
        countWarning,
        warningPercent
      }
    });

    setIsProfileModalOpen(true);
  };

  const getDropdownStyle = (status: StatusKelayakan) => {
    switch (status) {
      case 'Layak Ditugaskan': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'Perlu Penguatan': return 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]';
      case 'Tidak Direkomendasikan': return 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewDocument = (c: any) => {
    if (!c.fileLink || c.fileLink === '-') return;

    const ext = c.fileLink.split('.').pop()?.toLowerCase();
    setPreviewFileData({
      fileName: c.fileLink.split('/').pop() || 'Sertifikat',
      fileUrl: c.fileLink,
      fileType: (ext === 'pdf') ? 'pdf' : 'image'
    });
    setIsPreviewModalOpen(true);
  };

  const currentAuditors = allUsers.filter(u => u.unit_kerja === selectedAudit);
  const currentReqs = kompetensiWajibMap[selectedAudit] || [];

  return (
    <div className="bg-[#f4f6f9] min-h-screen -m-6 sm:-m-8 relative font-sans">
      <div className="bg-[#0b3c5d] text-white px-8 py-6">
        <h1 className="text-xl font-bold mb-1">Si-Tor – Penugasan Audit Berbasis Kompetensi</h1>
        <p className="text-xs text-blue-100">Pemetaan dan Rekomendasi Personel Berdasarkan Unit Kerja</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Card Pilih Unit Kerja Penugasan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pilih Penugasan Audit (Berdasarkan Unit Kerja)</h2>
          <div className="flex flex-wrap gap-2">
            {unitKerjas.length > 0 ? unitKerjas.map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedAudit(unit)}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  selectedAudit === unit ? 'bg-[#0b3c5d] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {unit}
              </button>
            )) : (
              <p className="text-sm text-gray-500 italic">Mencari data Unit Kerja...</p>
            )}
          </div>
        </div>

        {/* Card Kompetensi Wajib */}
        {selectedAudit && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-start relative">
            <div className="flex justify-between items-center w-full mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Kompetensi Wajib untuk Penugasan: <span className="text-[#0b3c5d]">{selectedAudit}</span>
              </h2>
              <button 
                onClick={openReqModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit Kompetensi
              </button>
            </div>
            
            {currentReqs.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                {currentReqs.map((req, index) => (
                  <li key={index} className="font-medium">{req}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Belum ada kompetensi wajib yang didaftarkan untuk unit kerja ini.</p>
            )}
          </div>
        )}

        {/* Tabel Evaluasi Penugasan Utama */}
        {selectedAudit && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Evaluasi Personel Unit Kerja {selectedAudit}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-[#0b3c5d] text-white">
                    <th className="px-4 py-3 font-semibold">Auditor</th>
                    <th className="px-4 py-3 font-semibold">Jabatan</th>
                    <th className="px-4 py-3 font-semibold text-center w-56">Status Kelayakan</th>
                    <th className="px-4 py-3 font-semibold text-center w-24">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentAuditors.length > 0 ? (
                    currentAuditors.map((auditor) => {
                      const status = evaluationStatuses[selectedAudit]?.[auditor.id] || 'Perlu Penguatan';

                      return (
                        <tr key={auditor.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-bold">{auditor.nama}</span>
                              <span className="text-xs text-gray-400 font-semibold">{auditor.np || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{auditor.jabatan || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={status}
                              onChange={(e) => handleStatusChange(auditor.id, e.target.value as StatusKelayakan)}
                              className={`w-full text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer text-center appearance-none text-center-last transition-colors ${getDropdownStyle(status)}`}
                              style={{ textAlignLast: 'center' }}
                            >
                              <option value="Layak Ditugaskan" className="bg-white text-gray-900">Layak Ditugaskan</option>
                              <option value="Perlu Penguatan" className="bg-white text-gray-900">Perlu Penguatan</option>
                              <option value="Tidak Direkomendasikan" className="bg-white text-gray-900">Tidak Direkomendasikan</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => handleViewProfile(auditor)}
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-bold transition-all"
                            >
                              Klik
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                        {loading ? 'Memuat data personel...' : `Tidak ada auditor yang terdaftar di Unit Kerja ${selectedAudit}.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT KOMPETENSI WAJIB */}
      {showEditReqModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Manajemen Kompetensi Wajib</h2>
              <button onClick={() => setShowEditReqModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Edit kompetensi yang dibutuhkan untuk unit kerja <strong>{selectedAudit}</strong>.</p>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newReq} 
                  onChange={(e) => setNewReq(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addReq()}
                  className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Ketik kompetensi baru..."
                />
                <button 
                  onClick={addReq}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2 bg-gray-50">
                {tempReqs.map((req, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-sm font-medium text-gray-800">{req}</span>
                    <button onClick={() => removeReq(index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {tempReqs.length === 0 && (
                  <p className="text-center text-gray-400 text-sm italic py-4">Belum ada kompetensi terdaftar.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowEditReqModal(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Batal
              </button>
              <button 
                onClick={saveReqs}
                className="px-6 py-2 bg-[#0b3c5d] hover:bg-blue-800 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROFIL PERSONEL (100% PERSIS PROFIL KOMPETENSI) */}
      {isProfileModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#f8fafc] w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsProfileModalOpen(false)} 
              className="absolute top-5 right-5 z-20 p-2 bg-white hover:bg-gray-100 text-gray-500 rounded-full shadow-sm transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* SIDEBAR KIRI */}
            <div className="w-[300px] bg-white border-r border-gray-200 p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-col items-center text-center mt-6 mb-8">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4 border border-gray-200 flex items-center justify-center">
                  {selectedProfile.photo ? (
                    <img src={selectedProfile.photo} alt={selectedProfile.name} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-[56px] font-bold text-gray-400">{selectedProfile.avatar}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProfile.name}</h2>
                <p className="text-sm text-gray-500 mt-1 capitalize">{selectedProfile.statusKepegawaian.toLowerCase()}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#f0f4f8] rounded-lg p-3 text-[13px]">
                  <span className="text-gray-500">Unit:</span> <span className="font-semibold text-gray-800 ml-1">{selectedProfile.unit}</span>
                </div>
                
                <div className="bg-[#f0f4f8] rounded-lg p-3 text-[13px]">
                  <span className="text-gray-500">Total Program:</span> 
                  <span className="font-semibold text-gray-800 ml-1">
                    {selectedProfile.allComps?.length || 0}
                  </span>
                </div>
                
                <div className="bg-[#f0f4f8] rounded-lg p-3 text-[13px]">
                  <span className="text-gray-500">Status:</span> <span className="font-semibold text-gray-800 ml-1">{selectedProfile.status}</span>
                </div>
              </div>
            </div>

            {/* AREA KANAN */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CircularProgress 
                  title="Target vs Realisasi Kompetensi" 
                  valueText={`${selectedProfile.kpi.targetRealizedPercent}%`} 
                  percentage={selectedProfile.kpi.targetRealizedPercent} 
                />
                <CircularProgress 
                  title="Sertifikat Aktif" 
                  valueText={selectedProfile.kpi.countAktif.toString()} 
                  percentage={selectedProfile.kpi.aktifPercent} 
                />
                <CircularProgress 
                  title="Sertifikat Hampir Expired" 
                  valueText={selectedProfile.kpi.countWarning.toString() /* this is actually warning+expired, should adjust */} 
                  percentage={selectedProfile.kpi.warningPercent} 
                />
                <CircularProgress 
                  title="Sertifikat Expired" 
                  valueText={selectedProfile.kpi.countWarning.toString()} 
                  percentage={selectedProfile.kpi.warningPercent} 
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900">Daftar Sertifikat Auditor</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#1e3a8a] text-white">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-center w-1/3">Sertifikat</th>
                        <th className="px-6 py-4 font-semibold text-center">Jenis Program</th>
                        <th className="px-6 py-4 font-semibold text-center">Tahun</th>
                        <th className="px-6 py-4 font-semibold text-center">Status</th>
                        <th className="px-6 py-4 font-semibold text-center">File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedProfile.validComps.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{c.type}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{c.year}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              c.status === 'Aktif' ? 'bg-green-100 text-green-700' : 
                              c.status === 'Hampir Expired' ? 'bg-amber-100 text-amber-700' : 
                              c.status === 'Expired' ? 'bg-red-100 text-red-700' : 
                              'bg-rose-50 text-rose-500' // Untuk "-" atau "DIRENCANAKAN"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {(c.fileLink && c.fileLink !== '-') || c.isRealized ? (
                              <button 
                                onClick={() => handleViewDocument(c)}
                                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-colors"
                              >
                                Lihat
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {selectedProfile.validComps.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                            Tidak ada sertifikat/program terverifikasi.
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
      )}

      {/* MODAL PREVIEW PDF/GAMBAR */}
      {isPreviewModalOpen && previewFileData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Preview: {previewFileData.fileName}</span>
              </h2>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex items-center justify-center bg-gray-50 p-6 min-h-[500px]">
              {previewFileData.fileType === 'pdf' ? (
                <iframe
                  src={previewFileData.fileUrl}
                  className="w-full h-full border-0 rounded-lg shadow-lg"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewFileData.fileUrl}
                  alt={previewFileData.fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Sistem Penyimpanan Terpadu Si-Tor</span>
              </div>
              <button
                onClick={() => window.open(previewFileData.fileUrl, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Buka di Tab Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
