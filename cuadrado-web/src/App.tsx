// ─────────────────────────────────────────────────────────
// App.tsx — Componente raíz: enrutamiento y proveedores globales
//
// Aquí se define la estructura general de la aplicación:
//   1. AuthProvider envuelve toda la app para que cualquier
//      componente hijo pueda acceder al estado de autenticación.
//   2. BrowserRouter habilita la navegación SPA (Single Page
//      Application) usando la History API del navegador.
//   3. Routes / Route definen qué componente renderizar según
//      la URL actual del navegador.
// ─────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Páginas de la aplicación
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';

import './App.css'; // Estilos de componentes y páginas

function App() {
  return (
    // AuthProvider: hace disponible el contexto de autenticación en todo el árbol
    <AuthProvider>
      {/* BrowserRouter: gestiona la navegación sin recargar la página */}
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz → pantalla de bienvenida con botones de acceso */}
          <Route path="/" element={<WelcomePage />} />

          {/* Ruta de inicio de sesión */}
          <Route path="/login" element={<LoginPage />} />

          {/* Ruta de registro de nuevo usuario */}
          <Route path="/register" element={<RegisterPage />} />

          {/* Ruta para recuperar contraseña olvidada */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Ruta principal tras autenticarse (actualmente es un placeholder) */}
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
