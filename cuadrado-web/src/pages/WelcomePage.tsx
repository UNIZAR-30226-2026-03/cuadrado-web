// ─────────────────────────────────────────────────────────
// pages/WelcomePage.tsx — Pantalla de bienvenida (ruta "/")
//
// Es la primera página que ve el usuario al abrir la app.
// Muestra el logo, un título, un subtítulo y dos botones
// para navegar a Login o Registro.
//
// Los elementos tienen clases "fade-in" con distintos retrasos
// (delay-1, delay-2, delay-3) para crear un efecto de entrada
// escalonado al cargar la página.
// ─────────────────────────────────────────────────────────

import { Link } from 'react-router-dom'; // Navega sin recargar la página
import Sparkle from '../components/Sparkle'; // Decoración de cubo 3D (esquina inferior derecha)

export default function WelcomePage() {
  return (
    <div className="page">

      {/* Logo de la app — aparece primero con fade-in sin retraso */}
      <div className="fade-in">
        <img src="/Logo.png" alt="Cubo logo" className="app-logo" />
      </div>

      {/* Título principal — aparece 0.1s después */}
      <h1 className="welcome-title fade-in fade-in-delay-1">
        ¡BIENVENIDO A CUBO!
      </h1>

      {/* Subtítulo descriptivo — aparece 0.2s después */}
      <div className="welcome-subtitle fade-in fade-in-delay-2">
        El juego donde menos es más<br />
        El cuadrado de siempre, con una nueva dimensión
      </div>

      {/* Panel con botones de acceso — aparece 0.35s después */}
      <div className="neon-panel fade-in fade-in-delay-3" style={{ maxWidth: 380 }}>
        <div className="welcome-buttons">
          {/* Link de react-router-dom genera un <a> que no recarga la página */}
          <Link to="/login">
            <button className="neon-btn neon-btn--large" type="button">
              Iniciar Sesión
            </button>
          </Link>
          <Link to="/register">
            <button className="neon-btn neon-btn--large" type="button">
              Registrarse
            </button>
          </Link>
        </div>
      </div>

      {/* Decoración fija en esquina inferior derecha */}
      <Sparkle />
    </div>
  );
}
