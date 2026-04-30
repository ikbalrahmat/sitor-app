import { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, RefreshCw } from 'lucide-react';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsLoading(false);
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
            Pemulihan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Akses</span> Akun
          </h1>
          <p className="text-blue-100/90 text-lg lg:text-xl max-w-lg leading-relaxed font-medium drop-shadow-sm text-justify">
            Pulihkan akses akun Anda dengan aman dan cepat melalui instruksi via email terdaftar.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-blue-200/60 text-sm font-medium">
            © {new Date().getFullYear()} Si-Tor. Sistem Kompetensi Auditor.
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
          
          <button
            onClick={onBackToLogin}
            className="flex items-center text-slate-500 hover:text-[#0b3c5d] mb-6 transition-colors font-bold text-sm group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Login
          </button>

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex flex-col items-center">
              {!imageError ? (
                <img 
                  src="/logo-sitor.png" 
                  alt="Logo Si-Tor" 
                  className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-xl mb-0.5 transition-all"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-[#0b3c5d] rounded-3xl flex items-center justify-center shadow-xl mb-0.5 transition-all">
                  <span className="text-6xl font-black text-white leading-none mt-1">ST</span>
                </div>
              )}
              <span className="text-[#0b3c5d] text-xl font-black tracking-tight block mb-0.5">Si-Tor</span>
              <span className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] block">Sistem Kompetensi Auditor</span>
            </div>
          </div>

          {!isSubmitted ? (
            <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100/50">
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-[#0b3c5d] rounded-xl mb-3 border border-blue-100">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-1.5 tracking-tight">Lupa Password?</h2>
                <p className="text-slate-500 font-medium text-[11px] leading-relaxed px-2">
                  Masukkan email Anda dan kami akan mengirimkan instruksi untuk reset password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700">
                    Alamat Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0b3c5d] transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-[2px] focus:ring-blue-100 focus:border-[#0b3c5d] outline-none transition-all font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-slate-300 text-xs"
                      placeholder="nama@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#0b3c5d] hover:bg-[#082a42] text-white py-2 rounded-xl font-bold text-xs transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim Instruksi Reset
                      </>
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
              <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Email Terkirim!</h2>
              <p className="text-slate-500 font-medium text-xs mb-6 leading-relaxed px-4">
                Kami telah mengirimkan instruksi reset password ke <br/>
                <strong className="text-slate-700">{email}</strong>
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Kembali ke halaman login
              </button>
            </div>
          )}

          {/* Mobile Copyright */}
          <div className="mt-8 text-center lg:hidden relative z-10">
            <p className="text-[10px] text-slate-400 font-medium">
              © {new Date().getFullYear()} Si-Tor. Sistem Kompetensi Auditor.
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
