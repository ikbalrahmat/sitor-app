import { 
  Search, 
  Plus, 
  Download,
  Edit,
  Trash2,
  X,
  Check,
  CalendarCheck,
  Upload,
  FileText
} from 'lucide-react';
import React, { useState, useMemo, Fragment, useEffect } from 'react';
import api, { STORAGE_URL } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

// Fungsi bantuan untuk menghitung status sertifikat secara otomatis
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

export default function RencanaKompetensi() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('Semua');
  const [selectedInstansi, setSelectedInstansi] = useState('Semua');
  const [selectedUnitKerja, setSelectedUnitKerja] = useState('Semua');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user: authUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGlobalAdd, setIsGlobalAdd] = useState(false); // Flag if opened from the top global button
  const [isAddingNewUser, setIsAddingNewUser] = useState(false); // Flag for quick-add user
  const [modalMode, setModalMode] = useState<'add_diklat' | 'edit_diklat'>('add_diklat');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [selectedDiklat, setSelectedDiklat] = useState<any>(null);

  const [formExpDate, setFormExpDate] = useState<string>('');
  const [formSertifikatFile, setFormSertifikatFile] = useState<File | null>(null);
  const [formSertifikatFileName, setFormSertifikatFileName] = useState<string>('');

  // State Dinamis untuk Dropdown Jenis & Kualifikasi (Default diubah ke 'Lainnya' kalau kosong)
  const [selectedJenis, setSelectedJenis] = useState('Lainnya');
  const [customJenis, setCustomJenis] = useState('');
  const [selectedKualifikasi, setSelectedKualifikasi] = useState('Lainnya');
  const [customKualifikasi, setCustomKualifikasi] = useState('');

  // State untuk Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileData, setPreviewFileData] = useState<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  } | null>(null);

  const [personelData, setPersonelData] = useState<any[]>([]);

  // ==========================================
  // FETCH DATA DARI LARAVEL
  // ==========================================
  const fetchData = async () => {
    try {
      const [usersRes, diklatRes] = await Promise.all([
        api.get('/users'),
        api.get('/diklat')
      ]);

      const targetUsers = usersRes.data.filter((u: any) => {
        if (authUser?.role === 'User') {
          return u.id === Number(authUser.id); // User only sees themselves
        }
        return u.role === 'User' || u.role === 'Manajemen'; // Admin sees all audience
      });

      const mergedData = targetUsers.map((user: any) => {
        const userDiklats = diklatRes.data.filter((d: any) => Number(d.user_id) === Number(user.id));
        
        const formattedDiklats = userDiklats.map((d: any) => ({
          id: d.id,
          tahun: d.tahun,
          jenis: d.jenis,
          rencana: {
            diklat: d.rencana_diklat || '-',
            penyelenggara: d.rencana_penyelenggara || '-',
            jadwal: d.rencana_jadwal || '-',
          },
          realisasi: {
            diklat: d.realisasi_diklat || '-',
            penyelenggara: d.realisasi_penyelenggara || '-',
            jadwal: d.realisasi_jadwal || '-'
          },
          sertifikat_path: d.sertifikat_path, 
          nomorSertifikat: d.nomor_sertifikat || '-',
          tanggalSertifikat: d.tanggal_sertifikat || '-',
          tanggalExpired: d.tanggal_expired || '-',
          nilaiCpe: d.nilai_cpe || 0,
          biaya: d.biaya ? `Rp ${Number(d.biaya).toLocaleString('id-ID')}` : 'Rp 0',
          kualifikasi: d.kualifikasi || '-',
        }));

        return {
          id: user.id,
          instansi: user.instansi || '-',
          unitKerja: user.unit_kerja || '-',
          nama: user.nama,
          np: user.np || '-',
          jabatan: user.jabatan || '-',
          diklatList: formattedDiklats
        };
      });

      setPersonelData(mergedData);
    } catch (error) {
      console.error('Gagal mengambil data dari server', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // OPSI DINAMIS UNTUK DROPDOWN (Hardcode Dihapus)
  // ==========================================
  const jenisOptions = useMemo(() => {
    const options = new Set<string>(); // Kosong, tidak ada hardcode bawaan
    personelData.forEach(p => p.diklatList?.forEach((d: any) => {
      if (d.jenis && d.jenis !== '-' && d.jenis !== 'Lainnya') options.add(d.jenis);
    }));
    return Array.from(options);
  }, [personelData]);

  const kualifikasiOptions = useMemo(() => {
    const options = new Set<string>(); // Kosong, tidak ada hardcode bawaan
    personelData.forEach(p => p.diklatList?.forEach((d: any) => {
      if (d.kualifikasi && d.kualifikasi !== '-' && d.kualifikasi !== 'Lainnya') options.add(d.kualifikasi);
    }));
    return Array.from(options);
  }, [personelData]);

  const instansiOptions = useMemo(() => ['Semua', ...Array.from(new Set(personelData.map(i => i.instansi)))], [personelData]);
  const unitKerjaOptions = useMemo(() => ['Semua', ...Array.from(new Set(personelData.map(i => i.unitKerja).filter(u => u !== '-')))], [personelData]);
  const tahunOptions = useMemo(() => {
    const options = new Set();
    personelData.forEach(p => p.diklatList?.forEach((d: any) => options.add(d.tahun)));
    return ['Semua', ...Array.from(options).sort().reverse() as string[]];
  }, [personelData]);

  const filteredData = useMemo(() => {
    return personelData
      .map(person => {
        const searchStr = searchQuery.toLowerCase();
        const matchPersonInfo = person.nama.toLowerCase().includes(searchStr) || person.instansi.toLowerCase().includes(searchStr) || person.unitKerja.toLowerCase().includes(searchStr);
        const filteredDiklats = person.diklatList.filter((diklat: any) => {
          const matchTahun = selectedTahun === 'Semua' || diklat.tahun === selectedTahun;
          const matchDiklatInfo = diklat.rencana?.diklat?.toLowerCase().includes(searchStr);
          return matchTahun && (matchPersonInfo || matchDiklatInfo);
        });
        return { ...person, diklatList: filteredDiklats, matchPersonInfo };
      })
      .filter(person => {
        const matchInstansi = selectedInstansi === 'Semua' || person.instansi === selectedInstansi;
        const matchUnitKerja = selectedUnitKerja === 'Semua' || person.unitKerja === selectedUnitKerja;
        const passSearch = person.matchPersonInfo || person.diklatList.length > 0 || searchQuery === '';
        return matchInstansi && matchUnitKerja && passSearch;
      });
  }, [personelData, searchQuery, selectedTahun, selectedInstansi, selectedUnitKerja]);

  // Handler Modal
  const handleSertifikatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormSertifikatFile(file);
      setFormSertifikatFileName(file.name);
    }
  };

  const openAddDiklatModal = (person: any) => {
    setModalMode('add_diklat');
    setSelectedPerson(person);
    setSelectedDiklat(null);
    setFormExpDate(''); 
    setFormSertifikatFile(null); 
    setFormSertifikatFileName(''); 

    // Jika database sudah punya opsi jenis, jadikan default. Kalau kosong, paksakan 'Lainnya'
    setSelectedJenis(jenisOptions.length > 0 ? jenisOptions[0] : 'Lainnya');
    setCustomJenis('');
    
    setSelectedKualifikasi(kualifikasiOptions.length > 0 ? kualifikasiOptions[0] : 'Lainnya');
    setCustomKualifikasi('');

    setIsGlobalAdd(false);
    setIsAddingNewUser(false);
    setIsModalOpen(true);
  };

  const openGlobalAddModal = () => {
    setModalMode('add_diklat');
    setIsGlobalAdd(true);
    setIsAddingNewUser(false);
    setSelectedDiklat(null);
    setFormExpDate(''); 
    setFormSertifikatFile(null); 
    setFormSertifikatFileName(''); 

    // Jika user adalah auditor, otomatis assign ke dirinya sendiri
    if (authUser?.role === 'User' && personelData.length > 0) {
      setSelectedPerson(personelData[0]);
    } else {
      setSelectedPerson(null); // Admin perlu memilih
    }

    setSelectedJenis(jenisOptions.length > 0 ? jenisOptions[0] : 'Lainnya');
    setCustomJenis('');
    setSelectedKualifikasi(kualifikasiOptions.length > 0 ? kualifikasiOptions[0] : 'Lainnya');
    setCustomKualifikasi('');

    setIsModalOpen(true);
  };

  const openEditDiklatModal = (person: any, diklat: any) => {
    setModalMode('edit_diklat');
    setSelectedPerson(person);
    setSelectedDiklat(diklat);
    setFormExpDate(diklat.tanggalExpired !== '-' ? diklat.tanggalExpired : ''); 
    
    if (diklat.sertifikat_path) {
      setFormSertifikatFileName(diklat.sertifikat_path.split('/').pop());
    } else {
      setFormSertifikatFileName('');
    }
    setFormSertifikatFile(null); 

    // Setup Dropdown Jenis
    const jVal = diklat.jenis || 'Lainnya';
    if (jenisOptions.includes(jVal)) {
      setSelectedJenis(jVal);
      setCustomJenis('');
    } else {
      setSelectedJenis('Lainnya');
      setCustomJenis(jVal !== 'Lainnya' ? jVal : '');
    }

    // Setup Dropdown Kualifikasi
    const kVal = diklat.kualifikasi || 'Lainnya';
    if (kualifikasiOptions.includes(kVal)) {
      setSelectedKualifikasi(kVal);
      setCustomKualifikasi('');
    } else {
      setSelectedKualifikasi('Lainnya');
      setCustomKualifikasi(kVal !== 'Lainnya' ? kVal : '');
    }

    setIsModalOpen(true);
  };

  // ==========================================
  // ACTION KE BACKEND
  // ==========================================
  const handleSaveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formEl = new FormData(e.currentTarget);
    const payload = new FormData();

    // Logika Final untuk Dropdown Jenis & Kualifikasi
    const finalJenis = selectedJenis === 'Lainnya' ? customJenis : selectedJenis;
    const finalKualifikasi = selectedKualifikasi === 'Lainnya' ? customKualifikasi : selectedKualifikasi;

    let targetUserId = selectedPerson?.id;
    if (isGlobalAdd && authUser?.role !== 'User') {
      if (isAddingNewUser) {
        // Logika Quick-Add User (Profil Dummy)
        const newUserName = formEl.get('new_user_name') as string;
        const dummyEmail = `dummy_${Date.now()}@sitor.local`;
        const userPayload = {
          nama: newUserName,
          email: dummyEmail,
          jabatan: formEl.get('new_user_jabatan') as string || '-',
          instansi: formEl.get('new_user_instansi') === 'Lainnya' ? (formEl.get('custom_new_instansi') as string || '-') : (formEl.get('new_user_instansi') as string || '-'),
          unit_kerja: formEl.get('new_user_unit') === 'Lainnya' ? (formEl.get('custom_new_unit') as string || '-') : (formEl.get('new_user_unit') as string || '-'),
          np: formEl.get('new_user_np') as string || '-',
          role: 'User',
          status_keaktifan: 'Tidak Aktif',
          password: 'dummy_password_123!'
        };
        try {
          await api.post('/users', userPayload);
          
          // Cari ID user yang baru saja dibuat berdasarkan email dummy-nya
          const allUsersRes = await api.get('/users');
          const newlyCreated = allUsersRes.data.find((u:any) => u.email === dummyEmail);
          
          if (newlyCreated) {
            targetUserId = newlyCreated.id;
          } else {
            alert('Terjadi kesalahan saat memvalidasi profil baru.');
            setIsLoading(false);
            return;
          }
        } catch(e) {
          console.error('Gagal membuat profil dummy', e);
          alert('Gagal membuat profil pegawai baru.');
          setIsLoading(false);
          return;
        }
      } else {
        const globalUserId = formEl.get('global_user_id');
        if (!globalUserId) {
          alert('Silakan pilih pegawai terlebih dahulu.');
          setIsLoading(false);
          return;
        }
        targetUserId = globalUserId;
      }
    }

    payload.append('user_id', targetUserId); 
    payload.append('tahun', formEl.get('tahun') as string);
    payload.append('jenis', finalJenis);
    
    payload.append('rencana_diklat', formEl.get('rencana_diklat') as string || '-');
    payload.append('rencana_penyelenggara', formEl.get('rencana_penyelenggara') as string || '-');
    
    const rcnJadwal = formEl.get('rencana_jadwal') as string;
    payload.append('rencana_jadwal', rcnJadwal ? rcnJadwal : '-');
    
    payload.append('realisasi_diklat', formEl.get('realisasi_diklat') as string || '-');
    payload.append('realisasi_penyelenggara', formEl.get('realisasi_penyelenggara') as string || '-');
    
    const rlsJadwal = formEl.get('realisasi_jadwal') as string;
    payload.append('realisasi_jadwal', rlsJadwal ? rlsJadwal : '-');
    
    payload.append('nomor_sertifikat', formEl.get('nomorSertifikat') as string || '-');
    
    const tglSertifikat = formEl.get('tanggalSertifikat') as string;
    if (tglSertifikat && tglSertifikat !== '-') {
      payload.append('tanggal_sertifikat', tglSertifikat);
    }
    
    if (formExpDate && formExpDate !== '-') {
      payload.append('tanggal_expired', formExpDate);
    }

    payload.append('nilai_cpe', formEl.get('nilaiCpe') as string || '0');
    
    const rawBiaya = formEl.get('biaya') as string;
    const cleanBiaya = rawBiaya.replace(/[^0-9]/g, ''); 
    payload.append('biaya', cleanBiaya === '' ? '0' : cleanBiaya);

    payload.append('kualifikasi', finalKualifikasi);

    if (formSertifikatFile) {
      payload.append('sertifikat_file', formSertifikatFile);
    }

    if (modalMode === 'edit_diklat') {
      payload.append('_method', 'PUT'); 
    }

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (modalMode === 'add_diklat') {
        await api.post('/diklat', payload, config);
      } else {
        await api.post(`/diklat/${selectedDiklat.id}`, payload, config);
      }
      
      await fetchData(); 
      setIsModalOpen(false);
    } catch (error) {
      console.error('Gagal menyimpan diklat', error);
      alert('Gagal menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDiklat = async (diklatId: number) => {
    if(confirm('Yakin ingin menghapus data diklat ini beserta sertifikatnya?')) {
      try {
        await api.delete(`/diklat/${diklatId}`);
        fetchData();
      } catch (error) {
        console.error('Gagal menghapus', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{authUser?.role === 'User' ? 'Kompetensi Saya' : 'Perencanaan Kompetensi'}</h1>
          <p className="text-gray-600">Kelola Rencana Kerja Tahunan (RKT) dan realisasi diklat personel</p>
        </div>
        <div className="flex items-center gap-3">
          {authUser?.role !== 'User' && (
            <div className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100 font-medium">
              💡 Info: Daftar pegawai ditarik otomatis dari User Management.
            </div>
          )}
          <button onClick={openGlobalAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            <span>Tambah Kompetensi</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama, instansi, atau diklat..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Tahun:</span>
              <select value={selectedTahun} onChange={(e) => setSelectedTahun(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
                {tahunOptions.map(thn => <option key={thn as string} value={thn as string}>{thn as string}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Instansi:</span>
              <select value={selectedInstansi} onChange={(e) => { setSelectedInstansi(e.target.value); setSelectedUnitKerja('Semua'); }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]">
                {instansiOptions.map(inst => <option key={inst} value={inst}>{inst}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Unit Kerja:</span>
              <select value={selectedUnitKerja} onChange={(e) => setSelectedUnitKerja(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]">
                {unitKerjaOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[2200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-bold">
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-12">NO</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 w-32">INSTANSI</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 w-32">UNIT KERJA</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 w-48">NAMA</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-16">NP</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 w-32">JABATAN</th>
                <th colSpan={3} className="px-4 py-3 border-r border-gray-200 text-center bg-blue-50/50 text-blue-800">RENCANA</th>
                <th colSpan={3} className="px-4 py-3 border-r border-gray-200 text-center bg-green-50/50 text-green-800">REALISASI</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-20">TAHUN</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-24">JENIS</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-24">SERTIFIKAT</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-32">NO. SERTIFIKAT</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-28">TGL SERTIFIKAT</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-28">TGL EXPIRED</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-24">STATUS SERTIFIKAT</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-24">NILAI CPE/SKP</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-28">BIAYA</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-gray-200 text-center w-32">KUALIFIKASI</th>
                <th colSpan={2} className="px-4 py-3 text-center w-32">AKSI</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-bold">
                <th className="px-4 py-2 border-r border-t border-gray-200 w-56">DIKLAT</th>
                <th className="px-4 py-2 border-r border-t border-gray-200 w-40">PENYELENGGARA</th>
                <th className="px-4 py-2 border-r border-t border-gray-200 w-28">JADWAL</th>
                <th className="px-4 py-2 border-r border-t border-gray-200 w-56">DIKLAT</th>
                <th className="px-4 py-2 border-r border-t border-gray-200 w-40">PENYELENGGARA</th>
                <th className="px-4 py-2 border-r border-t border-gray-200 w-28">JADWAL</th>
                <th className="px-2 py-2 border-r border-t border-gray-200 text-center w-16">EDIT</th>
                <th className="px-2 py-2 border-t border-gray-200 text-center w-16">TAMBAH</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((person, pIndex) => {
                
                if (person.diklatList.length === 0) {
                  return (
                    <Fragment key={person.id}>
                      <tr className="hover:bg-blue-50/20 transition-colors align-top border-b border-gray-100">
                        <td className="px-4 py-4 border-r border-gray-200 text-center text-gray-500 font-medium bg-white">{pIndex + 1}</td>
                        <td className="px-4 py-4 border-r border-gray-200 text-gray-900 bg-white">
                          <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded text-xs block truncate w-28" title={person.instansi}>{person.instansi}</span>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-200 text-gray-900 bg-white">
                          <span className="text-gray-700 text-xs block truncate w-28" title={person.unitKerja}>{person.unitKerja}</span>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-200 font-bold text-gray-900 bg-white">{person.nama}</td>
                        <td className="px-4 py-4 border-r border-gray-200 text-center text-gray-500 bg-white">{person.np}</td>
                        <td className="px-4 py-4 border-r border-gray-200 text-gray-900 text-xs font-medium bg-white">{person.jabatan}</td>
                        
                        <td colSpan={17} className="px-4 py-4 border-r border-gray-200 text-center text-gray-400 italic bg-gray-50/50">
                          Belum ada data rencana atau realisasi diklat. Silakan klik tambah.
                        </td>
                        
                        <td className="px-2 py-3 text-center align-middle bg-white">
                          <div className="flex justify-center">
                            <button onClick={() => openAddDiklatModal(person)} className="bg-green-100 text-green-700 p-2.5 rounded-xl hover:bg-green-200 hover:shadow-sm transition-all flex flex-col items-center justify-center space-y-1">
                              <Plus className="w-5 h-5" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Tambah</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                }

                const rowCount = person.diklatList.length + 1;
                return (
                  <Fragment key={person.id}>
                    {person.diklatList.map((diklat: any, dIndex: number) => {
                      const dynamicStatus = calculateStatus(diklat.tanggalExpired);

                      return (
                        <tr key={diklat.id} className="hover:bg-blue-50/20 transition-colors align-top border-b border-gray-100">
                          {dIndex === 0 && (
                            <>
                              <td rowSpan={rowCount} className="px-4 py-4 border-r border-gray-200 text-center text-gray-500 font-medium bg-white">{pIndex + 1}</td>
                              <td rowSpan={rowCount} className="px-4 py-4 border-r border-gray-200 text-gray-900 bg-white">
                                <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded text-xs block truncate w-28" title={person.instansi}>{person.instansi}</span>
                              </td>
                              <td rowSpan={rowCount} className="px-4 py-4 border-r border-gray-200 text-gray-900 bg-white">
                                <span className="text-gray-700 text-xs block truncate w-28" title={person.unitKerja}>{person.unitKerja}</span>
                              </td>
                              <td rowSpan={rowCount} className="px-4 py-4 border-r border-gray-200 font-bold text-gray-900 bg-white">{person.nama}</td>
                              <td rowSpan={rowCount} className="px-4 py-4 border-r border-gray-200 text-center text-gray-500 bg-white">{person.np}</td>
                              <td rowSpan={rowCount} className="px-4 py-4 border-r border-gray-200 text-gray-900 text-xs font-medium bg-white">{person.jabatan}</td>
                            </>
                          )}
                          
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700">{diklat.rencana.diklat}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700">{diklat.rencana.penyelenggara}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700">{diklat.rencana.jadwal}</td>
                          
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700">{diklat.realisasi.diklat}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700">{diklat.realisasi.penyelenggara}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-gray-700">{diklat.realisasi.jadwal}</td>

                          <td className="px-4 py-3 border-r border-gray-200 text-center font-bold text-gray-700">{diklat.tahun}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-center text-gray-700 font-medium">
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                              {diklat.jenis}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 border-r border-gray-200 text-center">
                            {diklat.sertifikat_path ? (
                              <button 
                                onClick={() => {
                                  const fileUrl = `${STORAGE_URL}/${diklat.sertifikat_path}`;
                                  const ext = diklat.sertifikat_path.split('.').pop()?.toLowerCase();
                                  setPreviewFileData({
                                    fileName: diklat.sertifikat_path.split('/').pop() || 'Sertifikat',
                                    fileUrl: fileUrl,
                                    fileType: (ext === 'pdf') ? 'pdf' : 'image'
                                  });
                                  setIsPreviewModalOpen(true);
                                }}
                                className="flex flex-col items-center justify-center gap-1 cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                              >
                                <FileText className="w-5 h-5 text-blue-600" />
                                <span className="text-[10px] font-bold text-blue-600 hover:underline truncate w-16 text-center">Lihat File</span>
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 border-r border-gray-200 text-center text-xs font-mono text-gray-600">{diklat.nomorSertifikat}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-center text-xs text-gray-600">{diklat.tanggalSertifikat}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-center text-xs text-gray-600">{diklat.tanggalExpired}</td>
                          
                          <td className="px-4 py-3 border-r border-gray-200 text-center">
                            {dynamicStatus !== '-' ? (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${dynamicStatus === 'Aktif' ? 'bg-green-100 text-green-700' : dynamicStatus === 'Hampir Expired' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {dynamicStatus}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 border-r border-gray-200 text-center font-bold text-blue-700">{diklat.nilaiCpe > 0 ? `${diklat.nilaiCpe} Jam` : '-'}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-right font-medium text-gray-700 whitespace-nowrap">{diklat.biaya}</td>
                          <td className="px-4 py-3 border-r border-gray-200 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-gray-100 text-gray-700 border border-gray-200 uppercase">{diklat.kualifikasi}</span>
                          </td>
                          
                          <td className="px-2 py-3 border-r border-gray-200 text-center bg-white/50">
                            <div className="flex justify-center items-center space-x-2">
                              <button onClick={() => openEditDiklatModal(person, diklat)} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteDiklat(diklat.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                          {dIndex === 0 && (
                            <td rowSpan={rowCount} className="px-2 py-3 text-center align-middle bg-white">
                              <div className="flex justify-center space-x-2">
                                <button onClick={() => openAddDiklatModal(person)} className="bg-green-100 text-green-700 p-2.5 rounded-xl hover:bg-green-200 hover:shadow-sm transition-all flex flex-col items-center justify-center space-y-1">
                                  <Plus className="w-5 h-5" />
                                  <span className="text-[9px] font-bold uppercase tracking-wider">Tambah</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    
                    <tr className="bg-slate-50 border-b-2 border-gray-300">
                      <td colSpan={13} className="px-4 py-2 border-r border-gray-200 text-right font-bold text-gray-500 uppercase text-xs tracking-wider">Total Nilai CPE/SKP ({person.nama})</td>
                      <td className="px-4 py-2 border-r border-gray-200 text-center font-extrabold text-blue-700 bg-blue-100/50">{person.diklatList.reduce((sum: number, d: any) => sum + (Number(d.nilaiCpe) || 0), 0)} Jam</td>
                      <td colSpan={3} className="border-r border-gray-200"></td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GLOBAL (TAMBAH/EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className={`p-5 border-b flex justify-between items-center text-white ${modalMode === 'edit_diklat' ? 'bg-orange-600' : 'bg-blue-600'}`}>
              <h2 className="text-xl font-bold flex items-center space-x-2">
                {modalMode === 'edit_diklat' ? <><Edit className="w-5 h-5"/> <span>Edit Diklat & Sertifikat</span></> : <><Plus className="w-5 h-5"/> <span>{isGlobalAdd ? 'Tambah Kompetensi Baru' : `Tambah Diklat (${selectedPerson?.nama})`}</span></>}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/20 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 bg-slate-50">
              <form id="rencanaForm" onSubmit={handleSaveSubmit} className="space-y-6">
                
                {/* Global Add: Pilih Pegawai (Hanya untuk Admin/Super Admin/Manajemen) */}
                {isGlobalAdd && authUser?.role !== 'User' && (
                  <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-gray-700 uppercase">Pilih Pegawai / Auditor</label>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingNewUser(!isAddingNewUser)} 
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isAddingNewUser ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        {isAddingNewUser ? 'Batal Tambah Baru' : '+ Buat Profil Pegawai Baru'}
                      </button>
                    </div>

                    {isAddingNewUser ? (
                      <div className="space-y-4 p-5 bg-blue-50/40 rounded-xl border border-blue-100 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                            <input name="new_user_name" required placeholder="Nama Pegawai Baru" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-800" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nomor Pegawai (NP)</label>
                            <input name="new_user_np" placeholder="Opsional" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-800" />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Instansi Utama</label>
                            <select name="new_user_instansi" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-800" onChange={(e) => {
                              const inputEl = document.getElementById('customInstansiInput');
                              if (inputEl) inputEl.style.display = e.target.value === 'Lainnya' ? 'block' : 'none';
                            }}>
                              <option value="" disabled selected>-- Pilih Instansi --</option>
                              {instansiOptions.filter(i => i !== 'Semua').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              <option value="Lainnya">Lainnya (Input Manual)</option>
                            </select>
                            <input id="customInstansiInput" name="custom_new_instansi" placeholder="Ketik nama instansi manual..." className="w-full mt-2 px-4 py-2 border border-blue-300 rounded-lg outline-none bg-blue-50/30" style={{ display: 'none' }} />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Unit Kerja</label>
                            <select name="new_user_unit" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-800" onChange={(e) => {
                              const inputEl = document.getElementById('customUnitInput');
                              if (inputEl) inputEl.style.display = e.target.value === 'Lainnya' ? 'block' : 'none';
                            }}>
                              <option value="" disabled selected>-- Pilih Unit --</option>
                              {unitKerjaOptions.filter(u => u !== 'Semua').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              <option value="Lainnya">Lainnya (Input Manual)</option>
                            </select>
                            <input id="customUnitInput" name="custom_new_unit" placeholder="Ketik unit kerja manual..." className="w-full mt-2 px-4 py-2 border border-blue-300 rounded-lg outline-none bg-blue-50/30" style={{ display: 'none' }} />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Jabatan Aktual</label>
                            <input name="new_user_jabatan" placeholder="Contoh: Auditor Pertama, Verifikator, dll" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-800" />
                          </div>
                        </div>

                        <p className="text-xs text-blue-700 font-medium pt-1 mt-2 border-t border-blue-100">
                          💡 Akun otomatis disiapkan dengan status "Tidak Aktif" tanpa kredensial login. Perbarui dan aktifkan di menu <span className="font-bold">User Management</span> kelak.
                        </p>
                      </div>
                    ) : (
                      <select name="global_user_id" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium">
                        <option value="">-- Pilih Pegawai --</option>
                        {personelData.map(p => (
                          <option key={p.id} value={p.id}>{p.nama} ({p.unitKerja})</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* RENCANA DIKLAT */}
                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 shadow-sm">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b border-blue-200 pb-2 flex items-center justify-between">
                      <span>1. Rencana Diklat (RKT)</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Nama Diklat / Sertifikasi</label>
                        <input name="rencana_diklat" defaultValue={selectedDiklat?.rencana?.diklat !== '-' ? selectedDiklat?.rencana?.diklat : ''} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white placeholder-blue-300" placeholder="Biarkan kosong jika tanpa rencana" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Penyelenggara</label>
                        <input name="rencana_penyelenggara" defaultValue={selectedDiklat?.rencana?.penyelenggara !== '-' ? selectedDiklat?.rencana?.penyelenggara : ''} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white placeholder-blue-300" placeholder="Biarkan kosong jika tanpa rencana" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Jadwal Rencana</label>
                        <input type="date" name="rencana_jadwal" defaultValue={selectedDiklat?.rencana?.jadwal !== '-' ? selectedDiklat?.rencana?.jadwal : ''} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                      </div>
                    </div>
                  </div>

                  {/* REALISASI DIKLAT */}
                  <div className="bg-green-50/50 p-5 rounded-xl border border-green-100 shadow-sm">
                    <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4 border-b border-green-200 pb-2 flex items-center justify-between">
                      <span>2. Realisasi Aktual</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-green-600 uppercase mb-1">Nama Diklat Aktual</label>
                        <input name="realisasi_diklat" defaultValue={selectedDiklat?.realisasi?.diklat !== '-' ? selectedDiklat?.realisasi?.diklat : ''} className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white placeholder-green-300" placeholder="Biarkan kosong jika belum terealisasi" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-green-600 uppercase mb-1">Penyelenggara Aktual</label>
                        <input name="realisasi_penyelenggara" defaultValue={selectedDiklat?.realisasi?.penyelenggara !== '-' ? selectedDiklat?.realisasi?.penyelenggara : ''} className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white placeholder-green-300" placeholder="Biarkan kosong jika belum terealisasi" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-green-600 uppercase mb-1">Tanggal Realisasi</label>
                        <input type="date" name="realisasi_jadwal" defaultValue={selectedDiklat?.realisasi?.jadwal !== '-' ? selectedDiklat?.realisasi?.jadwal : ''} className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ADMINISTRASI & SERTIFIKAT */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">3. Administrasi & Dokumen Bukti</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahun</label>
                      <input name="tahun" required defaultValue={selectedDiklat?.tahun || new Date().getFullYear().toString()} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                    
                    {/* DROPDOWN DINAMIS: JENIS PROGRAM */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Program</label>
                      <select 
                        value={selectedJenis} 
                        onChange={(e) => setSelectedJenis(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        {jenisOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        <option value="Lainnya">Lainnya (Input Manual)</option>
                      </select>
                      {selectedJenis === 'Lainnya' && (
                        <input 
                          type="text" 
                          value={customJenis} 
                          onChange={(e) => setCustomJenis(e.target.value)}
                          placeholder="Ketik jenis program..." 
                          className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                          required 
                        />
                      )}
                    </div>

                    {/* DROPDOWN DINAMIS: KUALIFIKASI */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kualifikasi</label>
                      <select 
                        value={selectedKualifikasi} 
                        onChange={(e) => setSelectedKualifikasi(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        {kualifikasiOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        <option value="Lainnya">Lainnya (Input Manual)</option>
                      </select>
                      {selectedKualifikasi === 'Lainnya' && (
                        <input 
                          type="text" 
                          value={customKualifikasi} 
                          onChange={(e) => setCustomKualifikasi(e.target.value)}
                          placeholder="Ketik kualifikasi..." 
                          className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                          required 
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Biaya</label>
                      <input name="biaya" defaultValue={selectedDiklat?.biaya !== 'Rp 0' ? selectedDiklat?.biaya : ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Contoh: 5000000" />
                    </div>

                    {/* Upload File */}
                    <div className="md:col-span-2 mt-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload File Sertifikat</label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors bg-blue-50/30">
                          <div className="flex flex-col items-center">
                            <Upload className="w-6 h-6 text-blue-600 mb-1" />
                            <span className="text-xs font-bold text-blue-600">Klik Pilih File PDF/Gambar</span>
                          </div>
                          <input type="file" onChange={handleSertifikatFileChange} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                        </label>
                        {formSertifikatFileName && (
                          <div className="text-xs bg-green-50 text-green-700 p-2 rounded border border-green-200 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span className="font-semibold">File disiapkan: {formSertifikatFileName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nomor Sertifikat</label>
                      <input name="nomorSertifikat" defaultValue={selectedDiklat?.nomorSertifikat !== '-' ? selectedDiklat?.nomorSertifikat : ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="Nomor Sertifikat" />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tgl Sertifikat</label>
                      <input type="date" name="tanggalSertifikat" defaultValue={selectedDiklat?.tanggalSertifikat !== '-' ? selectedDiklat?.tanggalSertifikat : ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                    
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tgl Expired</label>
                      <input type="date" name="tanggalExpired" value={formExpDate} onChange={(e) => setFormExpDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                    
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status Sertifikat</label>
                      <input type="text" readOnly value={formExpDate ? calculateStatus(formExpDate) : ''} className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 font-bold outline-none cursor-not-allowed" />
                    </div>

                    <div className="md:col-span-4 mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Nilai CPE / SKP (Jumlah Jam)</label>
                      <input type="number" name="nilaiCpe" defaultValue={selectedDiklat?.nilaiCpe || 0} min="0" className="w-full max-w-xs px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold" />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-gray-100 bg-white flex justify-end space-x-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 transition-colors">Batal</button>
              <button type="submit" form="rencanaForm" disabled={isLoading} className={`px-6 py-2.5 text-white rounded-lg font-bold flex items-center space-x-2 transition-transform active:scale-95 ${modalMode === 'edit_diklat' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
                {isLoading ? <span>Menyimpan...</span> : <>{modalMode === 'edit_diklat' ? <CalendarCheck className="w-5 h-5" /> : <Check className="w-5 h-5" />}<span>Simpan Data</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL PREVIEW PDF/GAMBAR (TANPA NEW TAB) */}
      {/* ========================================== */}
      {isPreviewModalOpen && previewFileData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-800 text-white">
              <h2 className="text-sm font-bold flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-[300px] md:max-w-md">{previewFileData.fileName}</span>
              </h2>
              <button onClick={() => setIsPreviewModalOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-4" style={{ minHeight: '60vh' }}>
              {previewFileData.fileType === 'pdf' ? (
                <iframe src={previewFileData.fileUrl} className="w-full h-full border-0 rounded-lg shadow-sm" style={{ minHeight: '60vh' }} />
              ) : (
                <img src={previewFileData.fileUrl} alt="Preview Sertifikat" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Pastikan ukuran file terbaca dengan jelas.</span>
              <a 
                href={previewFileData.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
