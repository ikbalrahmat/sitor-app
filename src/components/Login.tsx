import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShieldAlert, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onForgotPassword?: () => void;
}

export default function Login({ onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  // State untuk Math CAPTCHA
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  // Fungsi untuk membuat soal matematika acak
  const generateCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1,
    });
    setCaptchaAnswer('');
  };

  // Jalankan generate CAPTCHA saat komponen pertama kali dimuat
  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. VALIDASI CAPTCHA SEBELUM HIT API (Requirement 3)
    if (parseInt(captchaAnswer) !== captcha.num1 + captcha.num2) {
      setError('Verifikasi keamanan (CAPTCHA) salah. Silakan hitung kembali.');
      generateCaptcha(); // Ganti soal jika salah
      return;
    }

    setIsLoading(true);
    setError(''); // Reset error message
    
    try {
      const result = await login(email, password);
      
      if (result && result.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
      // Jika login gagal, reset CAPTCHA agar bot tidak bisa mencoba terus dengan captcha yang sama
      generateCaptcha(); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {!imageError ? (
                <img 
                  src="/logo-sitor.png" 
                  alt="Logo Si-Tor" 
                  className="w-24 h-24 object-contain drop-shadow-md"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                  <span className="text-3xl font-bold text-white">ST</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Login Si-Tor</h1>
            <p className="text-gray-500 font-medium">Sistem Kompetensi Auditor</p>
          </div>

          {/* REQUIREMENT 5: PESAN PERINGATAN HUKUM/AKSES */}
          <div className="mb-6 p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg flex items-start space-x-3 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Peringatan Keamanan:</strong> Sistem ini merupakan fasilitas terbatas. 
              Hanya pengguna yang memiliki wewenang resmi yang diizinkan untuk masuk dan mengakses data di dalamnya.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center space-x-2 text-sm text-left animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                  placeholder="admin@sitor.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* REQUIREMENT 3: CAPTCHA SEDERHANA UNTUK CEGAH BRUTE FORCE BOT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Verifikasi Keamanan
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-700 tracking-widest min-w-[100px] select-none">
                  {captcha.num1} + {captcha.num2}
                </div>
                <button 
                  type="button" 
                  onClick={generateCaptcha}
                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Ganti Soal"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-center text-lg"
                  placeholder="Hasil?"
                  required
                />
              </div>
            </div>

            {onForgotPassword && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Lupa password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center mt-2"
            >
              {isLoading ? 'Memproses Otentikasi...' : 'Masuk Dashboard'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs font-medium mt-8">
          © 2026 Si-Tor. Sistem Kompetensi Auditor. <br/>All access is monitored and logged.
        </p>
      </div>
    </div>
  );
}
