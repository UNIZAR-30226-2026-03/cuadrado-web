// App.tsx - Componente raiz: AuthProvider, fondo animado y enrutamiento SPA

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import SettingsModal from './components/modals/SettingsModal';
import CreateRoomModal from './components/modals/CreateRoomModal';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyCodePage from './pages/VerifyCodePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import InventoryPage from './pages/InventoryPage';
import JoinRoomPage from './pages/JoinRoomPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import RulesPage from './pages/RulesPage';
import GamePage from './pages/GamePage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';

import './App.css';
import PortraitOverlay from './components/PortraitOverlay/PortraitOverlay';

function AppInner() {
  const location = useLocation();
  const hideOn = [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-code',
    '/reset-password',
  ];
  const hideOverlay = hideOn.includes(location.pathname);

  return (
    <>
      {/* Capas de fondo animado: siempre visibles, renderizadas fuera de Routes */}
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />

      {/* Overlay de orientación: se oculta en las rutas de autenticación */}
      {!hideOverlay && <PortraitOverlay />}

      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/waiting-room" element={<WaitingRoomPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/ranking" element={<RankingPage />} />
      </Routes>

      {/* Modales montados globalmente para poder abrirlos desde cualquier componente */}
      <SettingsModal />
      <CreateRoomModal />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ModalProvider>
          <AppInner />
        </ModalProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
