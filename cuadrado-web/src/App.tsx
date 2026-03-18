// ─────────────────────────────────────────────────────────
// App.tsx — Componente raíz: enrutamiento, fondo animado y proveedores
//
// Estructura de la aplicación:
//   1. AuthProvider envuelve toda la app para estado de autenticación global
//   2. Capas de fondo animado (mesh, estrellas, viñeta, scan-line)
//      se renderizan fuera de Routes para persistir en todas las páginas
//   3. BrowserRouter + Routes define la navegación SPA
// ─────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      {/* Capas de fondo animado — siempre visibles detrás del contenido */}
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-stars" aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />
      <div className="scan-line" aria-hidden="true" />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
