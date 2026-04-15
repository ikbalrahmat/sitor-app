import { useState, useEffect } from 'react';
import { Save, Lock, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [statusKepegawaian, setStatusKepegawaian] = useState('Pegawai Tetap');
  
  // State untuk form Password
  const [newPassword, setNewPassword] = useState('');

  // State untuk notifikasi sukses/error
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ambil data user dari Backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const response = await api.get('/users');
        const currentUserData = response.data.find((u: any) => u.id.toString() === user.id.toString());
        
        if (currentUserData) {
          setNama(currentUserData.nama || '');
          setEmail(currentUserData.email || '');
          setJabatan(currentUserData.jabatan || '');
          setInstansi(currentUserData.instansi || '');
          setUnitKerja(currentUserData.unit_kerja || '');
          setNp(currentUserData.np || '');
          setStatusKepegawaian(currentUserData.status_kepegawaian || 'Pegawai Tetap');
        } else {
          // Fallback
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

      const payload: any = {
        nama: nama,
        email: email,
        jabatan: jabatan,
        instansi: instansi,
        unit_kerja: unitKerja, // snake case u/ backend backend
        np: np,
        status_kepegawaian: statusKepegawaian,
        role: user.role, // Pertahankan role asli
      };

      if (newPassword && newPassword.trim() !== '') {
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
                <option value="Pegawai Tetap">Pegawai Tetap</option>
                <option value="Pegawai Kontrak / PKWT">Pegawai Kontrak / PKWT</option>
                <option value="CPNS">CPNS</option>
                <option value="PNS">PNS</option>
                <option value="Outsourcing">Outsourcing</option>
                <option value="Magang">Magang</option>
              </select>
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
          <p className="text-sm text-gray-500 mb-6 italic">Kosongkan kolom ini jika tidak ingin mengubah password.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                placeholder="••••••••"
              />
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
