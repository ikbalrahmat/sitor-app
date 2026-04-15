import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShieldAlert, RefreshCw, Eye, EyeOff, LogIn } from 'lucide-react';
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

  const generateCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1,
    });
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseInt(captchaAnswer) !== captcha.num1 + captcha.num2) {
      setError('Verifikasi keamanan salah. Silakan hitung kembali.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result && result.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 font-sans">
      
      {/* Subtle decorative circles */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#0b3c5d]/5"></div>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#0b3c5d]/5"></div>
      </div>

      <div className="w-full max-w-sm relative">
        
        {/* Logo / Brand area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {!imageError ? (
              <img
                src="/logo-sitor.png"
                alt="Logo Si-Tor"
                className="h-16 w-auto object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-14 h-14 bg-[#0b3c5d] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl font-black text-white tracking-wider">ST</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0b3c5d] tracking-tight">SI-TOR</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Sistem Informasi Kompetensi Auditor</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Accent bar top */}
          <div className="h-1 w-full bg-gradient-to-r from-[#0b3c5d] via-[#1d5b87] to-[#0b3c5d]"></div>

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Masuk ke Akun Anda</h2>
              <p className="text-sm text-gray-500 mt-0.5">Masukkan kredensial yang telah diberikan oleh Administrator.</p>
            </div>

            {/* Peringatan keamanan */}
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong className="font-bold">Akses Terbatas.</strong> Hanya pengguna berwenang yang diizinkan masuk. Seluruh aktivitas dicatat.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-600 font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider" htmlFor="email">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0b3c5d]/20 focus:border-[#0b3c5d] focus:bg-white transition-all"
                    placeholder="nama@perusahaan.co.id"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider" htmlFor="password">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#0b3c5d]/20 focus:border-[#0b3c5d] focus:bg-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Lupa Password */}
              {onForgotPassword && (
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-[#0b3c5d] hover:underline font-semibold transition-colors"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
              )}

              {/* CAPTCHA */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Verifikasi Keamanan
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 flex items-center justify-center bg-[#0b3c5d]/5 border border-[#0b3c5d]/10 rounded-xl px-4 py-2.5 text-sm font-black text-[#0b3c5d] tracking-widest select-none min-w-[90px] text-center">
                    {captcha.num1} + {captcha.num2}
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="p-2.5 text-gray-400 hover:text-[#0b3c5d] hover:bg-gray-100 rounded-xl transition-all"
                    title="Ganti Soal"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-center text-gray-800 outline-none focus:ring-2 focus:ring-[#0b3c5d]/20 focus:border-[#0b3c5d] focus:bg-white transition-all"
                    placeholder="Jawaban?"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#0b3c5d] hover:bg-[#0d4a72] text-white py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md shadow-[#0b3c5d]/30 hover:shadow-lg hover:shadow-[#0b3c5d]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6 leading-relaxed">
          © 2026 SI-TOR · Sistem Informasi Kompetensi Auditor<br />
          Seluruh akses dipantau dan dicatat secara otomatis.
        </p>
      </div>
    </div>
  );
}
