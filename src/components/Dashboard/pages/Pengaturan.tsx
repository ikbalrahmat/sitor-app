import { useState, useEffect } from 'react';
import { Save, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

// MOCK DATA: Dikeluarkan dari fungsi agar referensinya stabil dan tidak me-reset form saat Anda mengetik.
const MOCK_USER = { 
  id: 'admin-1', 
  nama: 'Admin Sitor', 
  email: 'admin@sitor.com',
  jabatan: 'Ketua Tim Audit',
  instansi: 'Kementerian X',
  unitKerja: 'Biro Audit Operasional & TI',
  np: '198001012005011001',
  statusKepegawaian: 'Pegawai Tetap'
};

// MOCK useAuth untuk environment pratinjau di layar ini.
// PENTING: Saat menyalin ke VS Code, HAPUS mock ini dan GUNAKAN import asli Anda:
// import { useAuth } from '../../../context/AuthContext';
const useAuth = () => {
  return { user: MOCK_USER };
};

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
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // State untuk Preferensi Notifikasi & Tampilan (Disembunyikan dari UI tapi tetap dijaga datanya)
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // State untuk notifikasi sukses/error
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Isi form secara otomatis dengan data user yang sedang login
  useEffect(() => {
    if (user) {
      setNama(user.nama || '');
      setEmail(user.email || '');
      setJabatan(user.jabatan || '');
      setInstansi(user.instansi || '');
      setUnitKerja(user.unitKerja || '');
      setNp(user.np || '');
      setStatusKepegawaian(user.statusKepegawaian || 'Pegawai Tetap');

      // Ambil preferensi dari Local Storage (jika sudah pernah disimpan)
      const data = localStorage.getItem('userManagementData');
      if (data) {
        const users = JSON.parse(data);
        const currentUserData = users.find((u: any) => u.id === user.id);
        
        if (currentUserData && currentUserData.preferences) {
          setEmailNotif(currentUserData.preferences.emailNotif ?? true);
          setPushNotif(currentUserData.preferences.pushNotif ?? true);
          
          // Set Dark Mode jika preferensinya true
          const isDark = currentUserData.preferences.darkMode ?? false;
          setDarkMode(isDark);
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    }
  }, [user?.id]);

  const handleSave = () => {
    setMessage(null); // Reset pesan

    try {
      const data = localStorage.getItem('userManagementData');
      let users = data ? JSON.parse(data) : [];
      let userIndex = users.findIndex((u: any) => u.id === user?.id);

      // Jika user tiruan ini belum ada di localStorage, kita buatkan
      let currentUserData = userIndex !== -1 ? users[userIndex] : { ...user };

      // LOGIKA GANTI PASSWORD
      if (oldPassword || newPassword) {
        if (!oldPassword || !newPassword) {
          throw new Error('Untuk mengganti password, harap isi Password Lama dan Password Baru.');
        }
        
        const actualOldPassword = currentUserData.password || 'password123';
        if (oldPassword !== actualOldPassword) {
          throw new Error('Password Lama yang Anda masukkan salah.');
        }

        currentUserData.password = newPassword;
      }

      // LOGIKA UPDATE PROFIL
      currentUserData.nama = nama;
      currentUserData.email = email;
      currentUserData.jabatan = jabatan;
      currentUserData.instansi = instansi;
      currentUserData.unitKerja = unitKerja;
      currentUserData.np = np;
      currentUserData.statusKepegawaian = statusKepegawaian;

      // LOGIKA UPDATE PREFERENSI (Notifikasi & Tampilan)
      currentUserData.preferences = {
        emailNotif: emailNotif,
        pushNotif: pushNotif,
        darkMode: darkMode
      };

      // Simpan kembali ke master data di Local Storage
      if (userIndex !== -1) {
        users[userIndex] = currentUserData;
      } else {
        users.push(currentUserData);
      }
      localStorage.setItem('userManagementData', JSON.stringify(users));

      // Update session login saat ini
      const currentSession = JSON.parse(localStorage.getItem('authUser') || '{}');
      currentSession.nama = nama;
      currentSession.email = email;
      currentSession.jabatan = jabatan;
      currentSession.instansi = instansi;
      currentSession.unitKerja = unitKerja;
      currentSession.np = np;
      currentSession.statusKepegawaian = statusKepegawaian;
      localStorage.setItem('authUser', JSON.stringify(currentSession));

      // Berikan notifikasi sukses & kosongkan kolom password
      setMessage({ type: 'success', text: 'Perubahan pengaturan dan profil berhasil disimpan!' });
      setOldPassword('');
      setNewPassword('');

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
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
              <User className="w-5 h-5 text-blue-600 " />
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Password Lama</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 hover:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>
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
            className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Save className="w-5 h-5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
