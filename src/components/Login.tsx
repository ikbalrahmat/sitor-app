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
    <div className="min-h-screen flex w-full bg-white font-sans text-slate-900">
      {/* Left Section - Branding & Decoration */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Background Image */}
        <img src="/bg-peruri.jpg" alt="Peruri Background" className="absolute inset-0 w-full h-full object-cover z-0 scale-105 hover:scale-110 transition-transform duration-[20s] ease-out" />
        
        {/* Gradient Overlays for readability */}
        <div className="absolute inset-0 bg-[#0b3c5d]/40 mix-blend-multiply z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#041a2c] via-[#0b3c5d]/20 to-transparent z-0 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b3c5d]/60 via-transparent to-transparent z-0"></div>
        
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-400/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse z-0" style={{ animationDelay: '2s' }}></div>
        
        {/* Glassmorphic Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

        <div className="relative z-10">
          <span className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase drop-shadow-sm bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">Portal Resmi</span>
        </div>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight drop-shadow-lg">
            Sistem <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Penugasan Audit</span> <br/>& Kompetensi Auditor
          </h1>
          <p className="text-blue-100/90 text-lg lg:text-xl max-w-md leading-relaxed font-medium drop-shadow-sm text-justify">
            Sistem terintegrasi untuk mengelola kompetensi dan penugasan auditor SPI. Pantau keahlian, susun rencana pelatihan, dan distribusikan tugas audit secara real-time.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-blue-200/60 text-sm font-medium">
            © {new Date().getFullYear()} SI-PAKAR. Sistem Penugasan Audit dan Kompetensi Auditor.
          </p>
          <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-400 absolute"></div>
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest ml-1">System Online</span>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-slate-50/50">
        <div className="w-full max-w-[380px] -mt-8 sm:-mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="flex flex-col items-center">
              {!imageError ? (
                <img 
                  src="/logo-sitor.png" 
                  alt="Logo SI-PAKAR" 
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md mb-4 transition-all"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-[#0b3c5d] rounded-3xl flex items-center justify-center shadow-xl mb-0.5 transition-all">
                  <span className="text-6xl font-black text-white leading-none mt-1">ST</span>
                </div>
              )}
              <span className="text-[#0b3c5d] text-xl font-black tracking-tight block mb-0.5">SI-PAKAR</span>
              <span className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] block">Sistem Penugasan Audit dan Kompetensi Auditor</span>
            </div>
          </div>

          <div className="mb-3 p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl flex items-start gap-2 text-[10px] text-amber-900 shadow-sm transition-transform hover:-translate-y-0.5 duration-300">
            <div className="bg-amber-100 p-1 rounded-md flex-shrink-0">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
            </div>
            <p className="leading-tight pt-0.5">
              <strong className="block font-bold text-amber-950 mb-0.5">Akses Terbatas</strong>
              Sistem ini hanya diperuntukkan bagi pengguna resmi.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-[11px] text-red-700 animate-in fade-in zoom-in duration-200 shadow-sm">
              <div className="bg-red-100 p-1.5 rounded-md flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              </div>
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0b3c5d] transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="block w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-[2px] focus:ring-blue-100 focus:border-[#0b3c5d] outline-none transition-all font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-slate-300 text-xs"
                  placeholder="admin@sipakar.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700" htmlFor="password">
                  Kata Sandi
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0b3c5d] transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="block w-full pl-9 pr-9 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-[2px] focus:ring-blue-100 focus:border-[#0b3c5d] outline-none transition-all font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-slate-300 text-xs"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {onForgotPassword && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-[10px] font-bold text-[#0b3c5d] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
                  >
                    Lupa password?
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1 pt-0.5">
              <label className="block text-xs font-bold text-slate-700">
                Verifikasi Keamanan
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-sm font-black text-[#0b3c5d] tracking-widest min-w-[70px] select-none shadow-inner">
                  {captcha.num1} + {captcha.num2}
                </div>
                <button 
                  type="button" 
                  onClick={generateCaptcha}
                  className="p-1.5 text-slate-500 hover:text-[#0b3c5d] hover:bg-slate-100 rounded-lg transition-all border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]"
                  title="Ganti Soal"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="captcha-answer"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  autoComplete="off"
                  className="block w-full px-3 py-1 bg-white border border-slate-200 rounded-xl focus:ring-[2px] focus:ring-blue-100 focus:border-[#0b3c5d] outline-none transition-all font-black text-center text-sm text-slate-800 shadow-sm placeholder:text-slate-300 placeholder:text-[10px] placeholder:font-normal hover:border-slate-300 appearance-none"
                  placeholder="Hasil?"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0b3c5d] hover:bg-[#082a42] text-white py-2 rounded-xl font-bold text-xs transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Masuk ke Sistem'
                )}
              </button>
            </div>
          </form>

          {/* Mobile Copyright */}
          <div className="mt-8 text-center lg:hidden relative z-10">
            <p className="text-[10px] text-slate-400 font-medium">
              © {new Date().getFullYear()} SI-PAKAR. Sistem Penugasan Audit dan Kompetensi Auditor.
            </p>
          </div>
        </div>
        
        {/* Subtle decorative background on the right side */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-40 z-0">
          <div className="absolute -top-[10%] -right-[10%] w-[400px] h-[400px] bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-[10%] -left-[10%] w-[300px] h-[300px] bg-gradient-to-tr from-slate-200 to-transparent rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
