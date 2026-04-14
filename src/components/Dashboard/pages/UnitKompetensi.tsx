import { useState, useEffect, useMemo } from 'react';
import { 
  Search, X, CheckCircle2, 
  Building2, UserCircle2, 
  Briefcase, Save,
  ArrowRightCircle, Filter, Edit3, Edit, Trash2, Camera,
  Download, Upload
} from 'lucide-react';
import axios from 'axios';

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

export default function UnitKompetensi() {
  const [selectedCompany, setSelectedCompany] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  
  // State untuk Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [posValue, setPosValue] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [addPhotoPreview, setAddPhotoPreview] = useState<string | null>(null);
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);

  // State untuk Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);

  // State untuk Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<any>(null);

  // State untuk Modal Preview File Sertifikat
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileData, setPreviewFileData] = useState<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  } | null>(null);

  const [personels, setPersonels] = useState<any[]>([]);

  // ==========================================
  // FETCH DATA DARI LARAVEL (USERS + DIKLAT)
  // ==========================================
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [usersRes, diklatRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/users', config),
        axios.get('http://127.0.0.1:8000/api/diklat', config)
      ]);

      const targetUsers = usersRes.data.filter((u: any) => u.role === 'User' || u.role === 'Manajemen');

      const mergedPersonels = targetUsers.map((user: any) => {
        const userDiklats = diklatRes.data.filter((d: any) => d.user_id === user.id);
        
        const competencies = userDiklats.map((d: any) => ({
          id: d.id,
          year: d.tahun,
          type: d.jenis,
          name: (d.realisasi_diklat && d.realisasi_diklat !== '-') ? d.realisasi_diklat : 
                (d.rencana_diklat && d.rencana_diklat !== '-') ? d.rencana_diklat : '-',
          status: d.tanggal_expired ? calculateStatus(d.tanggal_expired) : 'DIRENCANAKAN',
          certNumber: d.nomor_sertifikat || '-',
          fileLink: d.sertifikat_path ? `http://127.0.0.1:8000/storage/${d.sertifikat_path}` : null,
          isPlanned: !!d.rencana_diklat && d.rencana_diklat !== '-', 
          isRealized: !!d.realisasi_diklat && d.realisasi_diklat !== '-' 
        }));

        return {
          id: user.id,
          company: user.instansi || 'Belum Diatur',
          name: user.nama,
          pos: user.jabatan?.toUpperCase() || 'AUDITOR',
          unit: user.unit_kerja?.toUpperCase() || 'UNIT KERJA',
          status: user.status_keaktifan ? 'TETAP' : 'TIDAK AKTIF',
          np: user.np || '-',
          avatar: user.nama?.charAt(0).toUpperCase() || 'A',
          photo: user.photo ? `http://127.0.0.1:8000/storage/${user.photo}` : null,
          investasi: 'Rp 0',
          email: user.email || '-',
          competencies: competencies
        };
      });

      setPersonels(mergedPersonels);
    } catch (error) {
      console.error('Gagal mengambil data dari server', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const companies = useMemo(() => {
    const uniqueCompanies = new Set(personels.map(p => p.company));
    return ['Semua', ...Array.from(uniqueCompanies)].map(name => ({ 
      id: name, 
      name: name === 'Semua' ? 'SEMUA PERUSAHAAN' : name.toUpperCase()
    }));
  }, [personels]);

  const filtered = personels.filter(p => 
    (selectedCompany === 'Semua' || p.company === selectedCompany) && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setPreviewState: (val: string | null) => void,
    setFileState: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileState(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPersonel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const finalPos = posValue === 'LAINNYA' ? (formData.get('customPos') as string) : posValue;
    const finalUnit = unitValue === 'LAINNYA' ? (formData.get('customUnit') as string) : unitValue;

    const payload = new FormData();
    payload.append('nama', formData.get('name') as string);
    payload.append('email', formData.get('email') as string);
    payload.append('np', formData.get('np') as string || '-');
    payload.append('jabatan', finalPos);
    payload.append('unit_kerja', finalUnit);
    payload.append('instansi', selectedCompany === 'Semua' ? 'Kantor Pusat' : selectedCompany);
    payload.append('status_kepegawaian', formData.get('status') as string);
    payload.append('status_keaktifan', 'Aktif');
    payload.append('role', 'User');

    if (addPhotoFile) {
      payload.append('photo', addPhotoFile);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/users', payload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      fetchData();
      closeAddModal();
    } catch (error) {
      console.error('Gagal menambah personel:', error);
      alert('Gagal menyimpan data.');
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setPosValue('');
    setUnitValue('');
    setAddPhotoPreview(null); 
    setAddPhotoFile(null);
  };

  const handleDeletePersonel = (person: any) => {
    setPersonToDelete(person);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (personToDelete) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://127.0.0.1:8000/api/users/${personToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
        setShowDeleteModal(false);
        setPersonToDelete(null);
      } catch (error) {
        console.error('Gagal menghapus:', error);
      }
    }
  };

  const openPreviewModal = (competency: any) => {
    if (!competency.fileLink || competency.fileLink === '-') return;

    const ext = competency.fileLink.split('.').pop()?.toLowerCase();
    setPreviewFileData({
      fileName: competency.fileLink.split('/').pop() || 'Sertifikat',
      fileUrl: competency.fileLink,
      fileType: (ext === 'pdf') ? 'pdf' : 'image'
    });
    setIsPreviewModalOpen(true);
  };

  const openEditModal = (person: any) => {
    setEditingPerson(person);
    setEditPhotoPreview(person.photo || null);
    setEditPhotoFile(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPerson(null);
    setEditPhotoPreview(null);
    setEditPhotoFile(null);
  };

  const handleEditPersonel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = new FormData();
    payload.append('nama', formData.get('name') as string);
    payload.append('email', formData.get('email') as string);
    payload.append('np', formData.get('np') as string || '-');
    payload.append('jabatan', editingPerson.pos); 
    payload.append('unit_kerja', editingPerson.unit); 
    payload.append('instansi', editingPerson.company);
    payload.append('status_kepegawaian', editingPerson.status);
    payload.append('status_keaktifan', 'Aktif');
    payload.append('role', 'User');

    if (editPhotoFile) {
      payload.append('photo', editPhotoFile);
    }
    
    payload.append('_method', 'PUT');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/users/${editingPerson.id}`, payload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      fetchData();
      closeEditModal();
    } catch (error) {
      console.error('Gagal update personel:', error);
      alert('Gagal update data.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profil Kompetensi</h1>
          <p className="text-slate-500 font-medium mt-1">Manajemen database personel dan integrasi rencana diklat (RKT).</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none min-w-[240px]"
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-2xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700 uppercase tracking-widest whitespace-nowrap">
              {personels.length} Personel Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center bg-slate-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama auditor..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="px-8 py-5">Identitas Auditor</th>
                <th className="px-8 py-5">Penempatan & Jabatan</th>
                <th className="px-8 py-5 text-center">Status Rencana</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => {
                const realizedCount = p.competencies.filter((c: any) => c.isRealized).length;
                const plannedCount = p.competencies.filter((c: any) => c.isPlanned).length;
                
                return (
                  <tr key={p.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div 
                        className="flex items-center space-x-5 cursor-pointer"
                        onClick={() => setSelectedPerson(p)}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform overflow-hidden relative">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="relative z-10">{p.avatar}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{p.np} • {p.status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">{p.unit}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Briefcase className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{p.pos}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-slate-900">{realizedCount}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Realisasi</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-100"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-blue-600">{plannedCount}</span>
                          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Rencana</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
                          title="Edit Personel"
                          className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeletePersonel(p); }}
                          title="Hapus Personel"
                          className="p-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedPerson(p)} 
                          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-xs font-black transition-all shadow-md shadow-slate-200"
                        >
                          <span>PROFIL</span>
                          <ArrowRightCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <UserCircle2 className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 italic">Tidak ada personel ditemukan di {companies.find(c => c.id === selectedCompany)?.name}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH PERSONEL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 bg-slate-50/50 shrink-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                  <UserCircle2 className="w-6 h-6 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Registrasi Personel</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Master Data Auditor</p>
                </div>
              </div>
              <button onClick={closeAddModal} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddPersonel} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-10 space-y-8">
                
                <div className="flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-xl bg-slate-50 transition-all ${addPhotoPreview ? '' : 'group-hover:border-blue-100 border-dashed border-slate-200'}`}>
                      {addPhotoPreview ? (
                        <img src={addPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Unggah Foto</span>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setAddPhotoPreview, setAddPhotoFile)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    {addPhotoPreview && (
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddPhotoPreview(null); setAddPhotoFile(null); }} className="absolute -top-3 -right-3 z-20 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all" >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap Auditor</label>
                  <input name="name" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all" placeholder="Contoh: Muhammad Rafli" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Perusahaan</label>
                    <input name="email" type="email" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all" placeholder="auditor@peruri.co.id" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nomor Pegawai (NP)</label>
                    <input name="np" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all" placeholder="NP-98765" />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Jabatan Fungsional</label>
                    <select name="pos" required value={posValue} onChange={(e) => setPosValue(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all cursor-pointer">
                      <option value="">PILIH JABATAN</option>
                      <option value="KSPI">KSPI</option>
                      <option value="SEKRETARIS">SEKRETARIS</option>
                      <option value="AUDITOR">AUDITOR</option>
                      <option value="LAINNYA">LAINNYA...</option>
                    </select>
                    {posValue === 'LAINNYA' && (
                      <div className="relative animate-in slide-in-from-top-2 duration-200">
                        <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input name="customPos" required className="w-full pl-12 pr-6 py-4 bg-blue-50/30 border border-blue-100 rounded-2xl font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-blue-300 placeholder:font-medium" placeholder="Ketik Jabatan Manual" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Unit Kerja / Biro</label>
                    <select name="unit" required value={unitValue} onChange={(e) => setUnitValue(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all cursor-pointer">
                      <option value="">PILIH UNIT</option>
                      <option value="BIRO AOPTI">BIRO AOPTI</option>
                      <option value="BIRO AKFR">BIRO AKFR</option>
                      <option value="BIRO CANDIT">BIRO CANDIT</option>
                      <option value="LAINNYA">LAINNYA...</option>
                    </select>
                    {unitValue === 'LAINNYA' && (
                      <div className="relative animate-in slide-in-from-top-2 duration-200">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input name="customUnit" required className="w-full pl-12 pr-6 py-4 bg-blue-50/30 border border-blue-100 rounded-2xl font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-blue-300 placeholder:font-medium" placeholder="Ketik Unit Kerja Manual" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Status Kepegawaian</label>
                    <div className="flex gap-4">
                      {['Pegawai Tetap', 'PKWT', 'Magang'].map((status) => (
                        <label key={status} className="flex-1 cursor-pointer group">
                          <input type="radio" name="status" value={status} defaultChecked={status === 'Pegawai Tetap'} className="hidden peer" />
                          <div className="w-full py-4 text-center rounded-2xl bg-slate-50 border border-slate-100 font-black text-xs text-slate-400 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all uppercase tracking-widest group-hover:bg-slate-100 peer-checked:group-hover:bg-blue-700 shadow-sm">
                            {status}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4 shrink-0">
                <button type="button" onClick={closeAddModal} className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">
                  BATALKAN
                </button>
                <button type="submit" className="px-10 py-4 bg-slate-900 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center space-x-3">
                  <Save className="w-4 h-4" /><span>SIMPAN DATA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PERSONEL */}
      {showEditModal && editingPerson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 bg-amber-50/50 shrink-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200">
                  <Edit className="w-6 h-6 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Edit Personel</h2>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">Ubah Data Auditor</p>
                </div>
              </div>
              <button onClick={closeEditModal} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditPersonel} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-10 space-y-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-xl bg-slate-50 transition-all group-hover:border-amber-100">
                      {editPhotoPreview ? (
                        <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-amber-500 transition-colors">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Unggah Foto</span>
                        </div>
                      )}
                      {editPhotoPreview && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditPhotoPreview, setEditPhotoFile)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    {editPhotoPreview && (
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditPhotoPreview(null); setEditPhotoFile(null); }} className="absolute -top-3 -right-3 z-20 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all" title="Hapus Foto">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap Auditor</label>
                  <input name="name" defaultValue={editingPerson.name} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-amber-100 focus:bg-white transition-all" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Perusahaan</label>
                    <input name="email" type="email" defaultValue={editingPerson.email} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-amber-100 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nomor Pegawai (NP)</label>
                    <input name="np" defaultValue={editingPerson.np} required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-amber-100 focus:bg-white transition-all" />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Jabatan Fungsional</label>
                    <div className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 opacity-60 cursor-not-allowed">
                      {editingPerson.pos}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Unit Kerja / Biro</label>
                    <div className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 opacity-60 cursor-not-allowed">
                      {editingPerson.unit}
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Status Kepegawaian</label>
                    <div className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 opacity-60 cursor-not-allowed">
                      {editingPerson.status}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Data jabatan dan status diambil otomatis dari User Management. Untuk mengubahnya, silakan edit melalui halaman Sistem / User Management.</p>
                  </div>
                </div>
              </div>
              
              <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4 shrink-0">
                <button type="button" onClick={closeEditModal} className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors">
                  BATALKAN
                </button>
                <button type="submit" className="px-10 py-4 bg-amber-500 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 flex items-center space-x-3">
                  <Save className="w-4 h-4" /><span>SIMPAN PERUBAHAN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteModal && personToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-[8px] border-white relative overflow-hidden">
                {personToDelete.photo ? (
                  <>
                    <img src={personToDelete.photo} className="w-full h-full object-cover absolute inset-0 opacity-40 grayscale" />
                    <Trash2 className="w-10 h-10 relative z-10 text-red-600 drop-shadow-md" />
                  </>
                ) : (
                  <Trash2 className="w-10 h-10" />
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Hapus Personel?</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                Apakah Anda yakin ingin menghapus data <span className="font-bold text-slate-800">{personToDelete.name}</span>? Data yang sudah dihapus tidak dapat dikembalikan.
              </p>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest">
                  BATAL
                </button>
                <button onClick={executeDelete} className="flex-1 px-6 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 text-xs uppercase tracking-widest">
                  YA, HAPUS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PROFIL */}
      {selectedPerson && (() => {
        // PERUBAHAN: Menampilkan semua program, bukan hanya yang "validComps"
        const allComps = selectedPerson.competencies || []; 
        const realizedComps = allComps.filter((c: any) => c.isRealized);
        const plannedComps = allComps.filter((c: any) => c.isPlanned);
        
        const totalPlanned = plannedComps.length;
        const totalRealized = realizedComps.length;
        const targetRealizedPercent = totalPlanned > 0 ? Math.min(Math.round((totalRealized / totalPlanned) * 100), 100) : (totalRealized > 0 ? 100 : 0);

        // Untuk chart tetap menggunakan validComps (yang ada sertifikat) agar perhitungannya akurat
        const validComps = allComps.filter((c: any) => c.status !== 'DIRENCANAKAN');
        const totalValid = validComps.length;

        const countAktif = validComps.filter((c: any) => c.status === 'Aktif').length;
        const aktifPercent = totalValid > 0 ? Math.round((countAktif / totalValid) * 100) : 0;

        const countHampirExpired = validComps.filter((c: any) => c.status === 'Hampir Expired').length;
        const hampirExpiredPercent = totalValid > 0 ? Math.round((countHampirExpired / totalValid) * 100) : 0;

        const countExpired = validComps.filter((c: any) => c.status === 'Expired').length;
        const expiredPercent = totalValid > 0 ? Math.round((countExpired / totalValid) * 100) : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div 
              className="bg-[#f8fafc] w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedPerson(null)} 
                className="absolute top-5 right-5 z-20 p-2 bg-white hover:bg-gray-100 text-gray-500 rounded-full shadow-sm transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-[300px] bg-white border-r border-gray-200 p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                
                <div className="flex flex-col items-center text-center mt-6 mb-8">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4 border border-gray-200">
                    {selectedPerson.photo ? (
                      <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-full h-full object-cover grayscale" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-4xl font-bold text-gray-400">{selectedPerson.avatar}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPerson.name}</h2>
                  <p className="text-sm text-gray-500 mt-1 capitalize">{selectedPerson.pos.toLowerCase()}</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#f0f4f8] rounded-lg p-3 text-[13px]">
                    <span className="text-gray-500">Unit:</span> <span className="font-semibold text-gray-800 ml-1">{selectedPerson.unit}</span>
                  </div>
                  
                  <div className="bg-[#f0f4f8] rounded-lg p-3 text-[13px]">
                    <span className="text-gray-500">Total Program:</span> 
                    <span className="font-semibold text-gray-800 ml-1">
                      {allComps.length}
                    </span>
                  </div>
                  
                  <div className="bg-[#f0f4f8] rounded-lg p-3 text-[13px]">
                    <span className="text-gray-500">Status:</span> <span className="font-semibold text-gray-800 ml-1">{selectedPerson.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  
                  <CircularProgress 
                    title="Target vs Realisasi Kompetensi" 
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

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900">Daftar Riwayat Program & Sertifikat</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#1e3a8a] text-white">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-center w-1/3">Nama Program / Sertifikat</th>
                          <th className="px-6 py-4 font-semibold text-center">Jenis Program</th>
                          <th className="px-6 py-4 font-semibold text-center">Tahun</th>
                          <th className="px-6 py-4 font-semibold text-center">Status</th>
                          <th className="px-6 py-4 font-semibold text-center">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {/* PERUBAHAN: Tabel diubah untuk melakukan loop (map) ke allComps */}
                        {allComps.map((c: any) => {
                          
                          // Menentukan text dan warna yang tepat untuk status "Belum Ada Sertifikat/Direncanakan"
                          let badgeText = c.status;
                          let badgeStyle = "bg-slate-100 text-slate-700"; // default style

                          if (c.status === 'Aktif') {
                            badgeStyle = "bg-green-100 text-green-700";
                          } else if (c.status === 'Hampir Expired') {
                            badgeStyle = "bg-amber-100 text-amber-700";
                          } else if (c.status === 'Expired') {
                            badgeStyle = "bg-red-100 text-red-700";
                          } else if (c.status === 'DIRENCANAKAN') {
                            if (c.isRealized) {
                              badgeText = "Menunggu Sertifikat";
                              badgeStyle = "bg-slate-100 text-slate-600"; 
                            } else {
                              badgeText = "Direncanakan";
                              badgeStyle = "bg-blue-50 text-blue-500 border border-blue-100";
                            }
                          }

                          return (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                              <td className="px-6 py-4 text-center text-gray-600">{c.type}</td>
                              <td className="px-6 py-4 text-center text-gray-600">{c.year}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                                  {badgeText}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {c.fileLink && c.fileLink !== '-' ? (
                                  <button 
                                    onClick={() => openPreviewModal(c)}
                                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                                  >
                                    Lihat
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs italic">Tidak ada file</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {allComps.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                              Tidak ada riwayat program untuk auditor ini.
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
      })()}

      {/* MODAL PREVIEW PDF/FILE */}
      {isPreviewModalOpen && previewFileData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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
                  src={previewFileData.fileUrl}
                  className="w-full h-full border-0 rounded-lg shadow-lg"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <img
                  src={previewFileData.fileUrl}
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
                  link.href = previewFileData.fileUrl;
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