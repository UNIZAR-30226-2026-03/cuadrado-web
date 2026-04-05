// App.tsx - Componente raiz: AuthProvider, fondo animado y enrutamiento SPA

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

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
import CreateRoomPage from './pages/CreateRoomPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import RulesPage from './pages/RulesPage';
import GamePage from './pages/GamePage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      {/* Capas de fondo animado: siempre visibles, renderizadas fuera de Routes */}
      <div className="bg-mesh"     aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />

      <BrowserRouter>
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
          <Route path="/create-room" element={<CreateRoomPage />} />
          <Route path="/waiting-room" element={<WaitingRoomPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
