import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const { setRequiresPasswordChange } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    // Validasi basic di frontend sebelum lempar ke backend
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });

      setSuccessMsg(response.data.message || 'Password berhasil diubah!');
      
      // Reset status wajib ganti password di Context & LocalStorage
      setRequiresPasswordChange(false);
      localStorage.setItem('requiresPasswordChange', 'false');

      // Beri jeda 2 detik biar user baca pesan sukses, lalu lempar ke Dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      // Tangkap error dari Laravel (termasuk jika password kurang kompleks atau pakai password lama)
      if (err.response?.data?.errors?.new_password) {
        // Error dari aturan kompleksitas Laravel
        setError(err.response.data.errors.new_password[0]);
      } else {
        // Error umum / 3 password history
        setError(err.response?.data?.message || 'Gagal mengubah password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pembaruan Keamanan</h2>
          <p className="text-gray-500 text-sm mt-2">
            Anda diwajibkan untuk mengganti password demi keamanan akun (Min. 8 karakter, huruf besar & kecil, angka, dan simbol).
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center space-x-2 text-sm text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center space-x-2 text-sm text-left">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password Saat Ini</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Contoh: Sitor123!@"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || successMsg !== ''}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Ganti Password & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  );
}