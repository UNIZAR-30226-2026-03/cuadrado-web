import { Link } from 'react-router-dom';
import Sparkle from '../components/Sparkle';

export default function WelcomePage() {
  return (
    <div className="page">
      <div className="fade-in">
        <img src="/Logo.png" alt="Cubo logo" className="app-logo" />
      </div>

      <h1 className="welcome-title fade-in fade-in-delay-1">
        ¡BIENVENIDO A CUBO!
      </h1>

      <div className="welcome-subtitle fade-in fade-in-delay-2">
        El juego donde menos es más<br />
        El cuadrado de siempre, con una nueva dimensión
      </div>

      <div className="neon-panel fade-in fade-in-delay-3" style={{ maxWidth: 380 }}>
        <div className="welcome-buttons">
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

      <Sparkle />
    </div>
  );
}
