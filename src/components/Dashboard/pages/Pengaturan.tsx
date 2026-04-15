import { useState, useEffect } from 'react';
import { Save, Lock, User as UserIcon, AlertCircle, CheckCircle, Eye, EyeOff, Camera, Trash2 } from 'lucide-react';
import api, { STORAGE_URL } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

export default function Pengaturan() {
  const { user } = useAuth();
  
  // State untuk form Profil Pengguna (Sesuai dengan User Management)
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [instansi, setInstansi] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [np, setNp] = useState('');
  
  // State untuk Foto Profil
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Dynamic Status Kepegawaian
  const [statusKepegawaian, setStatusKepegawaian] = useState('Pegawai Tetap');
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [customStatus, setCustomStatus] = useState('');

  // State untuk form Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // State untuk notifikasi sukses/error
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ambil data user dari Backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const response = await api.get('/users');
        
        // Buat dynamic options
        const optionsSet = new Set<string>();
        response.data.forEach((u: any) => {
          if (u.status_kepegawaian) optionsSet.add(u.status_kepegawaian);
        });
        setStatusOptions(Array.from(optionsSet));

        const currentUserData = response.data.find((u: any) => u.id.toString() === user.id.toString());
        
        if (currentUserData) {
          setNama(currentUserData.nama || '');
          setEmail(currentUserData.email || '');
          setJabatan(currentUserData.jabatan || '');
          setInstansi(currentUserData.instansi || '');
          setUnitKerja(currentUserData.unit_kerja || '');
          setNp(currentUserData.np || '');
          
          if (currentUserData.photo) {
            setPhotoPreview(`${STORAGE_URL}/${currentUserData.photo}`);
          }
          
          const s = currentUserData.status_kepegawaian || 'Pegawai Tetap';
          if (optionsSet.has(s)) {
            setStatusKepegawaian(s);
          } else {
            setStatusKepegawaian('Lainnya');
            setCustomStatus(s);
          }
        } else {
          setNama(user.nama || '');
          setEmail(user.email || '');
        }
      } catch (error) {
        console.error('Gagal mengambil detail profil user', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setMessage(null); 
    setIsLoading(true);

    try {
      if (!user) throw new Error("Sesi tidak valid.");

      const finalStatus = statusKepegawaian === 'Lainnya' ? customStatus : statusKepegawaian;

      const payload = new FormData();
      payload.append('nama', nama);
      payload.append('email', email);
      payload.append('jabatan', jabatan);
      payload.append('instansi', instansi);
      payload.append('unit_kerja', unitKerja);
      payload.append('np', np);
      payload.append('status_kepegawaian', finalStatus);
      payload.append('role', user.role); // Pertahankan role asli
      
      if (photoFile) {
        payload.append('photo', photoFile);
      }
      
      payload.append('_method', 'PUT');

      if (oldPassword || newPassword) {
        if (!oldPassword || !newPassword) {
          throw new Error("Untuk mengganti password, harap isi Password Lama dan Password Baru.");
        }
        payload.append('old_password', oldPassword);
        payload.append('password', newPassword);
      }

      await api.post(`/users/${user.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update session login saat ini (khusus data primer)
      const currentSessionString = localStorage.getItem('authUser');
      if (currentSessionString) {
        const currentSession = JSON.parse(currentSessionString);
        currentSession.nama = nama;
        currentSession.email = email;
        localStorage.setItem('authUser', JSON.stringify(currentSession));
      }

      setMessage({ type: 'success', text: 'Perubahan pengaturan dan profil berhasil disimpan! Memuat ulang dalam 2 detik...' });
      setOldPassword('');
      setNewPassword('');

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || 'Terjadi kesalahan saat menyimpan.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl transition-colors duration-300 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600 ">Kelola profil dan konfigurasi keamanan akun Anda</p>
      </div>

      {/* Area Notifikasi Error / Sukses */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 ' : 'bg-red-50 text-red-700 border border-red-200 '}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Profil Pengguna */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <UserIcon className="w-5 h-5 text-blue-600 " />
              </div>
              <h2 className="text-lg font-bold text-gray-900 ">Profil Pengguna</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            {/* Kolom Upload Foto */}
            <div className="flex flex-col items-center justify-start space-y-4">
              <div className="relative group w-full flex justify-center">
                <div className={`w-36 h-36 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-xl bg-slate-50 transition-all ${photoPreview ? '' : 'group-hover:border-blue-100 border-dashed border-slate-200'}`}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">Unggah Foto Profil</span>
                    </div>
                  )}
                  {photoPreview && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] m-1">
                      <Camera className="w-8 h-8 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Ubah Foto</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  title="Klik untuk memilih foto"
                />
                {photoPreview && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPhotoPreview(null); setPhotoFile(null); }} 
                    className="absolute -top-3 right-0 z-20 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all" 
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-500 text-center max-w-[150px]">
                Gunakan rasio foto 1:1. Maksimal ukuran file 2MB (.JPG, .PNG)
              </p>
            </div>

            {/* Kolom Form Kanan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">NP (Nomor Pegawai)</label>
                <input
                  type="text"
                  value={np}
                  onChange={(e) => setNp(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Masukkan nomor pegawai"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan</label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Masukkan jabatan"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Unit Kerja</label>
                <input
                  type="text"
                  value={unitKerja}
                  onChange={(e) => setUnitKerja(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Masukkan unit kerja"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Instansi</label>
                <input
                  type="text"
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Masukkan instansi"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Status Kepegawaian</label>
                <select
                  value={statusKepegawaian}
                  onChange={(e) => setStatusKepegawaian(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                >
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  <option value="Lainnya">Lainnya (Input Manual)</option>
                </select>
                {statusKepegawaian === 'Lainnya' && (
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-colors"
                    placeholder="Ketik status kepegawaian..."
                    required
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Keamanan / Ganti Password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-2 pb-4 border-b border-gray-100 ">
            <div className="p-2 bg-rose-50 rounded-lg">
              <Lock className="w-5 h-5 text-rose-600 " />
            </div>
            <h2 className="text-lg font-bold text-gray-900 ">Keamanan (Ganti Password)</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6 italic">Biarkan kosong jika tidak ingin mengubah password.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password Lama</label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password Baru</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isLoading ? <span>Menyimpan...</span> : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
