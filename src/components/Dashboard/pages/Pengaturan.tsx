import { useState, useEffect } from 'react';
import { Save, Lock, User as UserIcon, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../../lib/api';
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

  const handleSave = async () => {
    setMessage(null); 
    setIsLoading(true);

    try {
      if (!user) throw new Error("Sesi tidak valid.");

      const finalStatus = statusKepegawaian === 'Lainnya' ? customStatus : statusKepegawaian;

      const payload: any = {
        nama: nama,
        email: email,
        jabatan: jabatan,
        instansi: instansi,
        unit_kerja: unitKerja,
        np: np,
        status_kepegawaian: finalStatus,
        role: user.role, // Pertahankan role asli
      };

      if (oldPassword || newPassword) {
        if (!oldPassword || !newPassword) {
          throw new Error("Untuk mengganti password, harap isi Password Lama dan Password Baru.");
        }
        payload.old_password = oldPassword;
        payload.password = newPassword;
      }

      await api.put(`/users/${user.id}`, payload);

      // Update session login saat ini (khusus data primer)
      const currentSessionString = localStorage.getItem('authUser');
      if (currentSessionString) {
        const currentSession = JSON.parse(currentSessionString);
        currentSession.nama = nama;
        currentSession.email = email;
        localStorage.setItem('authUser', JSON.stringify(currentSession));
      }

      setMessage({ type: 'success', text: 'Perubahan pengaturan dan profil berhasil disimpan!' });
      setOldPassword('');
      setNewPassword('');

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
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100 ">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600 " />
            </div>
            <h2 className="text-lg font-bold text-gray-900 ">Profil Pengguna</h2>
          </div>
          
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
            <div>
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
