import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import IdleTimer from './components/Security/IdleTimer'; 
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ChangePassword from './components/ChangePassword';
import Dashboard from './components/Dashboard/Dashboard';
import DashboardHome from './components/Dashboard/DashboardHome';
import UnitKompetensi from './components/Dashboard/pages/UnitKompetensi';
import RencanaKompetensi from './components/Dashboard/pages/RencanaKompetensi';
import MatriksRisiko from './components/Dashboard/pages/MatriksRisiko';
import PenugasanAudit from './components/Dashboard/pages/PenugasanAudit';
import UserManagement from './components/Dashboard/pages/UserManagement';
import Pengaturan from './components/Dashboard/pages/Pengaturan';
import ActivityLog from './components/Dashboard/pages/ActivityLog';
function AppContent() {
  const { isAuthenticated, user, requiresPasswordChange } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // LOGIKA UNTUK MENYIMPAN DARK MODE SECARA PERMANEN (Versi API Laravel)
  useEffect(() => {
    if (isAuthenticated && user) {
      let isDark = false;
      // Ambil data darkMode langsung dari response API user
      if (user.preferences) {
        if (typeof user.preferences === 'string') {
          try {
            const prefs = JSON.parse(user.preferences);
            isDark = prefs.darkMode;
          } catch (e) {
            console.error("Gagal parse preferences", e);
          }
        } else {
          isDark = (user.preferences as { darkMode?: boolean }).darkMode ?? false;
        }
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isAuthenticated, user]);
  return (
    /* MEMBUNGKUS ROUTES DENGAN IDLE TIMER */
    <IdleTimer>
      <Routes>
        {/* 1. ROUTE PUBLIC (Login & Lupa Password) */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={requiresPasswordChange ? "/change-password" : "/"} replace />
            ) : showForgotPassword ? (
              <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />
            ) : (
              <Login onForgotPassword={() => setShowForgotPassword(true)} />
            )
          }
        />
        {/* 2. ROUTE WAJIB GANTI PASSWORD */}
        <Route
          path="/change-password"
          element={
            !isAuthenticated ? <Navigate to="/login" replace /> :
            !requiresPasswordChange ? <Navigate to="/" replace /> :
            <ChangePassword />
          }
        />
        {/* 3. ROUTE PRIVATE (Dashboard) */}
        <Route
          path="/"
          element={
            !isAuthenticated ? <Navigate to="/login" replace /> :
            requiresPasswordChange ? <Navigate to="/change-password" replace /> :
            <Dashboard />
          }
        >
          {/* Child Routes Dashboard */}
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="unit-kompetensi" element={<UnitKompetensi />} />
          <Route path="rencana-kompetensi" element={<RencanaKompetensi />} />
          <Route path="matriks-risiko" element={<MatriksRisiko />} />
          <Route path="penugasan-audit" element={<PenugasanAudit />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          {/* RUTE BARU UNTUK ACTIVITY LOG */}
          <Route path="activity-log" element={<ActivityLog />} />
        </Route>
        {/* 4. CATCH ALL ROUTE */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </IdleTimer>
  );
}
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
export default App;
