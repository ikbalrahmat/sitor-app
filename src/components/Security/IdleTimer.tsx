import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Batas waktu diam (15 Menit = 15 * 60 * 1000 ms)
const IDLE_TIME_LIMIT = 15 * 60 * 1000; 

export default function IdleTimer({ children }: { children: React.ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fungsi untuk logout otomatis
  const handleLogout = useCallback(() => {
    if (isAuthenticated) {
      logout();
      navigate('/login');
      // Memberikan informasi kepada user mengapa mereka keluar
      alert('Keamanan: Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.');
    }
  }, [logout, navigate, isAuthenticated]);

  // Fungsi untuk mereset timer setiap kali ada aktivitas
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (isAuthenticated) {
      timerRef.current = setTimeout(handleLogout, IDLE_TIME_LIMIT);
    }
  }, [handleLogout, isAuthenticated]);

  useEffect(() => {
    // Daftar event yang dianggap sebagai "Aktivitas"
    const events = [
      'mousedown', 
      'keydown', 
      'scroll', 
      'touchstart', 
      'mousemove', 
      'click'
    ];
    
    if (isAuthenticated) {
      // Mulai timer pertama kali
      resetTimer();

      // Pasang event listener ke window
      events.forEach(event => {
        window.addEventListener(event, resetTimer);
      });
    }

    // Cleanup saat komponen dilepas atau user logout
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, resetTimer]);

  return <>{children}</>;
}