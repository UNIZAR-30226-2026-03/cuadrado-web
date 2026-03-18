// ─────────────────────────────────────────────────────────
// pages/WelcomePage.tsx — Pantalla de bienvenida (ruta "/")
//
// Primera página que ve el usuario. Muestra:
//   - Logo animado con efecto de respiración neón (estilo desktop)
//   - Título "¡BIENVENIDO A CUBO!" y tagline "EL JUEGO DE CARTAS DEFINITIVO"
//   - Dos botones: Iniciar Sesión (neon) y Crear Cuenta (ghost)
//
// Los elementos aparecen con animaciones escalonadas:
//   logo → título → tagline → botones
// ─────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';

export default function WelcomePage() {
  return (
    <div className="page">
      {/* Orbe de resplandor cyan/púrpura detrás del logo */}
      <div className="welcome-orb" aria-hidden="true" />

      {/* Logo con entrada dramática (escala + blur → normal) */}
      <div className="welcome-logo">
        <img src="/Logo.png" alt="Cubo logo" className="logo-hero" />
      </div>

      {/* Título principal */}
      <h1 className="welcome-title">¡Bienvenido a Cubo!</h1>

      {/* Tagline con revelación de texto animada */}
      <p className="welcome-tagline">El juego de cartas definitivo</p>

      {/* Botones de acceso con entrada deslizante */}
      <div className="welcome-actions">
        <Link to="/login" className="btn-neon welcome-btn">
          Iniciar Sesión
        </Link>
        <Link to="/register" className="btn-ghost welcome-btn">
          Crear Cuenta
        </Link>
      </div>
    </div>
  );
}
