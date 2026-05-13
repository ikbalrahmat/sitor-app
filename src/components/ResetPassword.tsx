import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, RefreshCw, EyeOff, Eye } from 'lucide-react';
import api from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Jika tidak ada token atau email di URL, kembalikan ke login
    if (!token || !email) {
      navigate('/login');
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
      // Tunggu sebentar sebelum redirect ke login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mereset password. Link mungkin sudah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-slate-900">
      {/* Left Section - Sama seperti Login */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        <img src="/bg-peruri.jpg" alt="Peruri Background" className="absolute inset-0 w-full h-full object-cover z-0 scale-105 hover:scale-110 transition-transform duration-[20s] ease-out" />
        <div className="absolute inset-0 bg-[#0b3c5d]/40 mix-blend-multiply z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#041a2c] via-[#0b3c5d]/20 to-transparent z-0 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b3c5d]/60 via-transparent to-transparent z-0"></div>
        
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-400/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse z-0" style={{ animationDelay: '2s' }}></div>
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

        <div className="relative z-10">
          <span className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase drop-shadow-sm bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">Portal Resmi</span>
        </div>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight drop-shadow-lg">
            Sistem <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Penugasan Audit</span> <br/>& Kompetensi Auditor
          </h1>
          <p className="text-blue-100/90 text-lg lg:text-xl max-w-md leading-relaxed font-medium drop-shadow-sm text-justify">
            Sistem terintegrasi untuk memudahkan Anda mengelola kompetensi auditor SPI. Pantau kesesuaian standar, susun rencana pelatihan yang tepat sasaran, dan evaluasi laporan kinerja secara real-time.
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

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-slate-50/50">
        <div className="w-full max-w-[380px] -mt-8 sm:-mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
          
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex flex-col items-center">
              <img 
                src="/logo-sitor.png" 
                alt="Logo SI-PAKAR" 
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md mb-4 transition-all"
              />
              <span className="text-[#0b3c5d] text-xl font-black tracking-tight block mb-0.5">SI-PAKAR</span>
              <span className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] block">Sistem Penugasan Audit dan Kompetensi Auditor</span>
            </div>
          </div>

          {!isSuccess ? (
            <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100/50">
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-[#0b3c5d] rounded-xl mb-3 border border-blue-100">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-1.5 tracking-tight">Buat Sandi Baru</h2>
                <p className="text-slate-500 font-medium text-[11px] leading-relaxed px-2">
                  Silakan masukkan kata sandi baru untuk akun <strong className="text-slate-700">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-[11px] text-red-700 animate-in fade-in zoom-in duration-200 shadow-sm">
                    <div className="bg-red-100 p-1.5 rounded-md flex-shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <span className="font-bold">{error}</span>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi Baru
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0b3c5d] transition-colors">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-9 pr-9 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-[2px] focus:ring-blue-100 focus:border-[#0b3c5d] outline-none transition-all font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-slate-300 text-xs"
                      placeholder="Minimal 8 karakter"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Ulangi Kata Sandi Baru
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0b3c5d] transition-colors">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="block w-full pl-9 pr-9 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-[2px] focus:ring-blue-100 focus:border-[#0b3c5d] outline-none transition-all font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-slate-300 text-xs"
                      placeholder="Konfirmasi password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    >
                      {showPasswordConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#0b3c5d] hover:bg-[#082a42] text-white py-2 rounded-xl font-bold text-xs transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Sandi Baru'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100/50 text-center animate-in zoom-in duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4 border border-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Sandi Berhasil Diubah!</h2>
              <p className="text-slate-500 font-medium text-xs mb-6 leading-relaxed px-4">
                Kata sandi untuk <strong className="text-slate-700">{email}</strong> telah berhasil diperbarui. Anda akan dialihkan ke halaman login dalam beberapa detik.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#0b3c5d] hover:bg-[#082a42] text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg"
              >
                Kembali ke Login Sekarang
              </button>
            </div>
          )}

          <div className="mt-8 text-center lg:hidden relative z-10">
            <p className="text-[10px] text-slate-400 font-medium">
              © {new Date().getFullYear()} SI-PAKAR. Sistem Penugasan Audit dan Kompetensi Auditor.
            </p>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-40 z-0">
          <div className="absolute -top-[10%] -right-[10%] w-[400px] h-[400px] bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-[10%] -left-[10%] w-[300px] h-[300px] bg-gradient-to-tr from-slate-200 to-transparent rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
