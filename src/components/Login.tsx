import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShieldAlert, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onForgotPassword?: () => void;
}

export default function Login({ onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f8fafc] font-sans">
      {/* Decorative Modern Background Elements */}
      {/* Diagonal Enterprise Shape */}
      <div className="absolute top-0 right-0 w-[150%] h-[70%] bg-gradient-to-bl from-[#0b3c5d] via-[#1d5786] to-[#0b3c5d] -skew-y-6 origin-top-right transform -translate-y-24 shadow-2xl"></div>
      
      {/* Tambahan Cahaya Orb agar tidak kaku */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-blue-400/20 rounded-full mix-blend-overlay filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-cyan-300/20 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 border border-white">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6 relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full filter blur-xl opacity-50 scale-150"></div>
              {!imageError ? (
                <img 
                  src="/logo-sitor.png" 
                  alt="Logo Si-Tor" 
                  className="relative w-24 h-24 object-contain drop-shadow-xl"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 mx-auto transform rotate-3">
                  <span className="text-4xl font-black text-white -rotate-3">ST</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Login Si-Tor</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Sistem Kompetensi Auditor</p>
          </div>

          <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 rounded-2xl flex items-start space-x-3 text-xs leading-relaxed text-amber-800 shadow-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <p>
              <strong>Peringatan Keamanan:</strong> Sistem ini merupakan fasilitas terbatas. 
              Hanya pengguna yang memiliki wewenang resmi yang diizinkan untuk masuk dan mengakses data di dalamnya.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center space-x-3 text-sm text-left animate-in fade-in zoom-in duration-200 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all font-bold text-slate-800 shadow-sm placeholder:text-slate-300"
                  placeholder="admin@sitor.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1" htmlFor="password">
                Kata Sandi
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all font-bold text-slate-800 shadow-sm placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                Verifikasi Keamanan
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center bg-slate-100/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-lg font-black text-slate-700 tracking-widest min-w-[110px] select-none shadow-inner">
                  {captcha.num1} + {captcha.num2}
                </div>
                <button 
                  type="button" 
                  onClick={generateCaptcha}
                  className="p-3.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                  title="Ganti Soal"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all font-black text-center text-xl text-slate-800 shadow-sm placeholder:text-slate-300 placeholder:text-base placeholder:font-bold"
                  placeholder="Hasil?"
                  required
                />
              </div>
            </div>

            {onForgotPassword && (
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                >
                  Lupa password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0b3c5d] to-[#1d5786] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/20 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex justify-center items-center mt-4"
            >
              {isLoading ? 'Memproses...' : 'Masuk Dashboard'}
            </button>
          </form>
        </div>

        <div className="text-center mt-8 space-y-2">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
            © 2026 Si-Tor
          </p>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
            All access is monitored and logged
          </p>
        </div>
      </div>
    </div>
  );
}
