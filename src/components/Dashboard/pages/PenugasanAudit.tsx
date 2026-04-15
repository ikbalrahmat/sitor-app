import { useState, useEffect } from 'react';
import { X, Award, Download, FileText, Upload } from 'lucide-react';

// Tipe data untuk Status Kelayakan
type StatusKelayakan = 'Layak Ditugaskan' | 'Perlu Penguatan' | 'Tidak Direkomendasikan';

interface Auditor {
  id: string | number;
  name: string;
  unit: string;
  status: StatusKelayakan;
}

interface PenugasanAuditProps {
  onNavigateToProfile?: () => void; 
}

// Data Mock Jenis Audit (Kategori Penugasan)
const auditTypes = [
  { id: 'ops-ti', name: 'Audit Operasional & TI', reqs: ['Audit Operasional', 'IT Audit', 'Data Analytics Audit'] },
  { id: 'keu-fraud', name: 'Audit Keuangan & Fraud', reqs: ['Audit Laporan Keuangan', 'Fraud Investigation', 'Akuntansi Forensik'] },
  { id: 'kepatuhan', name: 'Audit Kepatuhan', reqs: ['Regulasi & Compliance', 'Hukum Bisnis Perusahaan', 'Etika & GCG'] },
];

// Fungsi untuk memuat data auditor riil dari Local Storage
const loadAuditorsData = (): Record<string, Auditor[]> => {
  const rencanaStr = localStorage.getItem('rencanaKompetensiData');
  const userStr = localStorage.getItem('userManagementData');
  let baseAuditors: any[] = [];

  if (rencanaStr && JSON.parse(rencanaStr).length > 0) {
    baseAuditors = JSON.parse(rencanaStr);
  } else if (userStr && JSON.parse(userStr).length > 0) {
    const users = JSON.parse(userStr);
    baseAuditors = users.filter((u: any) => u.role === 'User' || !u.role);
  }

  if (baseAuditors.length === 0) {
    baseAuditors = [
      { id: 1, nama: 'Andi Pratama', unitKerja: 'Biro Audit Operasional & TI' },
      { id: 2, nama: 'Budi Santoso', unitKerja: 'Biro Audit Operasional & TI' },
      { id: 3, name: 'Citra Dewi', unitKerja: 'Biro Perencanaan Audit' },
      { id: 4, name: 'Ika Wulansari', unitKerja: 'Biro Audit Keuangan & Fraud' },
      { id: 5, name: 'Ikbal Rahmat T', unitKerja: 'Biro Aopti', statusKepegawaian: 'Magang', statusKeaktifan: 'Tidak Aktif' },
    ];
  }

  const savedStatusStr = localStorage.getItem('penugasanAuditStatus');
  const savedStatus = savedStatusStr ? JSON.parse(savedStatusStr) : {};

  const formattedData: Record<string, Auditor[]> = {
    'Audit Operasional & TI': [],
    'Audit Keuangan & Fraud': [],
    'Audit Kepatuhan': []
  };

  const auditCategories = ['Audit Operasional & TI', 'Audit Keuangan & Fraud', 'Audit Kepatuhan'];

  baseAuditors.forEach((person: any) => {
    const id = person.id || Math.floor(Math.random() * 10000);
    const name = person.nama || person.name || 'Auditor';
    const unit = person.unitKerja || person.unit || '-';

    auditCategories.forEach(category => {
      const status: StatusKelayakan = savedStatus[category]?.[id] || 'Perlu Penguatan';
      formattedData[category].push({ id, name, unit, status });
    });
  });

  return formattedData;
};

// --- KOMPONEN BANTUAN UNTUK GRAFIK MELINGKAR (DONUT CHART) PERSIS DENGAN PROFIL KOMPETENSI ---
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

export default function PenugasanAudit({ onNavigateToProfile: _onNavigateToProfile }: PenugasanAuditProps) {
  const [selectedAudit, setSelectedAudit] = useState<string>('Audit Operasional & TI');
  const [auditorsData, setAuditorsData] = useState<Record<string, Auditor[]>>(loadAuditorsData);

  // State Untuk Modal Profil Personel
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  
  // State Untuk Modal Pratinjau Dokumen (Mockup/Link)
  const [certificateToView, setCertificateToView] = useState<string | null>(null);

  // State Untuk Modal Pratinjau PDF/Gambar (Jika Real File)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileData, setPreviewFileData] = useState<{
    fileName: string;
    fileBase64: string;
    fileType: string;
  } | null>(null);

  useEffect(() => {
    const handleStorageChange = () => setAuditorsData(loadAuditorsData());
    window.addEventListener('userManagementUpdated', handleStorageChange);
    window.addEventListener('rencanaKompetensiUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('userManagementUpdated', handleStorageChange);
      window.removeEventListener('rencanaKompetensiUpdated', handleStorageChange);
    };
  }, []);

  const currentAuditInfo = auditTypes.find(a => a.name === selectedAudit);
  const currentAuditors = auditorsData[selectedAudit] || [];

  const handleStatusChange = (auditorId: string | number, newStatus: StatusKelayakan) => {
    setAuditorsData(prevData => {
      const newData = {
        ...prevData,
        [selectedAudit]: prevData[selectedAudit].map(auditor => 
          auditor.id === auditorId ? { ...auditor, status: newStatus } : auditor
        )
      };

      const savedStatusStr = localStorage.getItem('penugasanAuditStatus');
      const savedStatus = savedStatusStr ? JSON.parse(savedStatusStr) : {};
      if (!savedStatus[selectedAudit]) savedStatus[selectedAudit] = {};
      savedStatus[selectedAudit][auditorId] = newStatus;
      localStorage.setItem('penugasanAuditStatus', JSON.stringify(savedStatus));

      return newData;
    });
  };

  const getDropdownStyle = (status: StatusKelayakan) => {
    switch (status) {
      case 'Layak Ditugaskan': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'Perlu Penguatan': return 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]';
      case 'Tidak Direkomendasikan': return 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // LOGIKA MENYIAPKAN DATA PROFIL SAMA PERSIS DENGAN PROFIL KOMPETENSI
  const handleViewProfile = (auditor: Auditor) => {
    const userStr = localStorage.getItem('userManagementData');
    const compStr = localStorage.getItem('rencanaKompetensiData');
    
    let userInfo: any = {};
    let compInfo: any = {};

    if (userStr) {
      const users = JSON.parse(userStr);
      userInfo = users.find((u: any) => String(u.id) === String(auditor.id) || u.nama === auditor.name) || {};
    }

    if (compStr) {
      const comps = JSON.parse(compStr);
      compInfo = comps.find((c: any) => String(c.id) === String(auditor.id) || c.nama === auditor.name) || {};
    }

    // Mapping list diklat menjadi format baku
    let competencies: any[] = [];
    if (compInfo && compInfo.diklatList) {
      competencies = compInfo.diklatList.map((d: any) => ({
        id: d.id || Math.random(),
        year: d.tahun,
        type: d.jenis,
        name: (d.rencana?.diklat && d.rencana.diklat !== '-') ? d.rencana.diklat : 
              (d.realisasi?.diklat && d.realisasi.diklat !== '-') ? d.realisasi.diklat : '-',
        status: d.statusSertifikat || 'DIRENCANAKAN',
        certNumber: d.nomorSertifikat || '-',
        fileLink: d.sertifikat || '-',
        fileBase64: d.sertifikatFileBase64 || null,
        isPlanned: !!d.rencana?.diklat && d.rencana.diklat !== '-', 
        isRealized: !!d.realisasi?.diklat && d.realisasi.diklat !== '-' 
      }));
    }

    // Mock data untuk mendemonstrasikan UI jika kosong (Persis gambar UI target)
    if (competencies.length === 0) {
      competencies = [
        { id: 1, year: '2026', type: 'Sertifikasi', name: 'Cyber Security', status: '-', fileLink: '-', isPlanned: true, isRealized: false },
        { id: 2, year: '2026', type: 'Diklat', name: 'IT Auditor', status: '-', fileLink: '-', isPlanned: true, isRealized: false }
      ];
    }

    // Kalkulasi KPI
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
      name: auditor.name,
      unit: userInfo.unitKerja || auditor.unit || 'BIRO AOPTI',
      pos: userInfo.jabatan || 'Auditor',
      status: userInfo.statusKeaktifan || 'Aktif',
      statusKepegawaian: userInfo.statusKepegawaian || 'Magang',
      avatar: auditor.name.charAt(0).toUpperCase(),
      photo: userInfo.photo || null,
      validComps: validComps.length > 0 ? validComps : allComps,
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

  // LOGIKA PEMBUKAAN FILE DOKUMEN (DUAL MODE)
  const handleViewDocument = (c: any) => {
    if (c.fileLink && c.fileLink.startsWith('[FILE]')) {
      if (c.fileBase64) {
        setPreviewFileData({
          fileName: c.fileLink.replace('[FILE] ', ''),
          fileBase64: c.fileBase64,
          fileType: c.fileLink.split('.').pop()?.toLowerCase() || 'pdf'
        });
        setIsPreviewModalOpen(true);
      } else {
        alert("File gagal dimuat atau tidak ditemukan di penyimpanan.");
      }
    } 
    else if (c.fileLink && c.fileLink !== '-' && c.fileLink.startsWith('http')) {
      window.open(c.fileLink, '_blank', 'noopener,noreferrer');
    }
    else {
      // Jika tidak ada link atau file, tunjukkan Mockup Sertifikat untuk demo UI
      setCertificateToView(c.name);
    }
  };

  return (
    <div className="bg-[#f4f6f9] min-h-screen -m-6 sm:-m-8 relative font-sans">
      {/* Header Utama */}
      <div className="bg-[#0b3c5d] text-white px-8 py-6">
        <h1 className="text-xl font-bold mb-1">Si-Tor – Penugasan Audit Berbasis Kompetensi</h1>
        <p className="text-xs text-blue-100">Satuan Pengawasan Internal</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Card Pilih Audit */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pilih Penugasan Audit</h2>
          <div className="flex flex-wrap gap-2">
            {auditTypes.map((audit) => (
              <button
                key={audit.id}
                onClick={() => setSelectedAudit(audit.name)}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  selectedAudit === audit.name ? 'bg-[#0b3c5d] text-white' : 'bg-[#0b3c5d] text-white opacity-90 hover:opacity-100'
                }`}
              >
                {audit.name}
              </button>
            ))}
          </div>
        </div>

        {/* Card Kompetensi */}
        {currentAuditInfo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Kompetensi Wajib untuk Audit: {selectedAudit}
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
              {currentAuditInfo.reqs.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabel Evaluasi Penugasan Utama */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Evaluasi Auditor untuk Penugasan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-[#0b3c5d] text-white">
                  <th className="px-4 py-3 font-semibold">Auditor</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold text-center w-56">Status Kelayakan</th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentAuditors.length > 0 ? (
                  currentAuditors.map((auditor) => (
                    <tr key={auditor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-bold">{auditor.name}</td>
                      <td className="px-4 py-3 text-gray-700">{auditor.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={auditor.status}
                          onChange={(e) => handleStatusChange(auditor.id, e.target.value as StatusKelayakan)}
                          className={`w-full text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer text-center appearance-none text-center-last transition-colors ${getDropdownStyle(auditor.status)}`}
                          style={{ textAlignLast: 'center' }}
                        >
                          <option value="Layak Ditugaskan" className="bg-white text-gray-900">Layak Ditugaskan</option>
                          <option value="Perlu Penguatan" className="bg-white text-gray-900">Perlu Penguatan</option>
                          <option value="Tidak Direkomendasikan" className="bg-white text-gray-900">Tidak Direkomendasikan</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {/* TOMBOL KLIK -> BUKA MODAL PROFIL */}
                        <button 
                          onClick={() => handleViewProfile(auditor)}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-bold transition-all"
                        >
                          Klik
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                      Belum ada data Auditor di sistem. Silakan tambahkan personil dengan Role "User" pada menu User Management.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL PROFIL PERSONEL (100% PERSIS PROFIL KOMPETENSI) */}
      {/* ============================================================== */}
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
                    {selectedProfile.kpi.totalValid}
                  </span>
                </div>
                
                <div className="bg-[#f0f4f8] rounded-lg p-3 text-[13px]">
                  <span className="text-gray-500">Status:</span> <span className="font-semibold text-gray-800 ml-1">{selectedProfile.status === 'TETAP' ? 'Aktif' : selectedProfile.status}</span>
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
                  title="Proporsi Sertifikasi" 
                  valueText={`${selectedProfile.kpi.countSertifikasi} dari ${selectedProfile.kpi.totalValid}`} 
                  percentage={selectedProfile.kpi.sertifikasiPercent} 
                />
                <CircularProgress 
                  title="Sertifikat Aktif" 
                  valueText={selectedProfile.kpi.countAktif.toString()} 
                  percentage={selectedProfile.kpi.aktifPercent} 
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

      {/* ============================================================== */}
      {/* MODAL MOCKUP SERTIFIKAT (JIKA BUKAN REAL FILE) */}
      {/* ============================================================== */}
      {certificateToView && (
        <div className="absolute inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[85vh] flex flex-col overflow-hidden relative border border-slate-700">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center space-x-3 text-white">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm">{certificateToView}.pdf</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCertificateToView(null)} 
                  className="text-gray-300 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto flex justify-center items-center">
              <div className="bg-white w-full max-w-3xl aspect-[1.414] p-10 border-[12px] border-double border-[#1e3a8a] outline outline-4 outline-offset-4 outline-[#d97706] text-center shadow-xl relative flex flex-col justify-center items-center">
                <Award className="w-48 h-48 text-[#fef3c7] absolute opacity-40 z-0 pointer-events-none" />
                <div className="z-10 w-full relative">
                  <h1 className="text-3xl md:text-5xl font-serif font-black text-gray-900 mb-3 uppercase tracking-[0.2em]">Sertifikat Kompetensi</h1>
                  <p className="text-gray-500 mb-8 italic text-sm md:text-base">Diberikan sebagai pengakuan resmi kepada:</p>
                  <h2 className="text-2xl md:text-4xl font-bold text-[#1e3a8a] mb-6 border-b-2 border-gray-300 pb-3 inline-block px-12 uppercase tracking-wide">
                    {selectedProfile?.name}
                  </h2>
                  <p className="text-gray-600 mb-3">Atas keberhasilan memenuhi standar kualifikasi pada program:</p>
                  <h3 className="text-xl md:text-3xl font-bold text-gray-800 mb-16 px-8 leading-tight">
                    {certificateToView}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL PREVIEW PDF/GAMBAR (JIKA REAL FILE DARI RKT) */}
      {/* ============================================================== */}
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

            <div className="flex-1 overflow-y-auto flex items-center justify-center bg-gray-50 p-6">
              {previewFileData.fileType === 'pdf' ? (
                <iframe
                  src={previewFileData.fileBase64}
                  className="w-full h-full border-0 rounded-lg shadow-lg"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <img
                  src={previewFileData.fileBase64}
                  alt={previewFileData.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  style={{ maxHeight: 'calc(95vh - 150px)' }}
                />
              )}
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">File:</span> {previewFileData.fileName}
              </div>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewFileData.fileBase64;
                  link.download = previewFileData.fileName;
                  link.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
