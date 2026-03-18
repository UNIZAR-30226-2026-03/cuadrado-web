// ─────────────────────────────────────────────────────────
// pages/LoginPage.tsx — Página de inicio de sesión (ruta "/login")
//
// Gestiona el formulario de login con validación local antes
// de llamar al backend. Diferencia entre dos tipos de error:
//   - Error de red (fetch falla): muestra el modal ErrorModal
//   - Error de API (credenciales incorrectas, etc.): muestra
//     un mensaje inline bajo el formulario
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sparkle from '../components/Sparkle';
import ErrorModal from '../components/ErrorModal';

export default function LoginPage() {
  // Obtenemos la función login del contexto global de autenticación
  const { login } = useAuth();
  // useNavigate permite redirigir al usuario a otra ruta por código
  const navigate = useNavigate();

  // Estado local del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');          // Mensaje de error de API (inline)
  const [loading, setLoading] = useState(false);   // true mientras se espera respuesta del backend
  const [showNetworkError, setShowNetworkError] = useState(false); // true si hay error de red

  // ── handleSubmit ────────────────────────────────────────
  // Se ejecuta al enviar el formulario.
  // e.preventDefault() evita que el formulario recargue la página (comportamiento HTML por defecto).
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); // Limpiamos errores anteriores antes de intentar de nuevo

    // Validación local: campos obligatorios antes de llamar al backend
    if (!username || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setLoading(true);
      await login({ username, password }); // Llama al servicio y guarda los tokens
      navigate('/home');                   // Redirige al home tras login exitoso
    } catch (err: unknown) {
      // TypeError con "fetch" indica que el servidor no es alcanzable
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setShowNetworkError(true);
      } else if (err instanceof Error) {
        setError(err.message); // Mensaje de error del backend (p.ej. "Credenciales incorrectas")
      } else {
        setError('Error desconocido');
      }
    } finally {
      // finally se ejecuta siempre, tanto si hay éxito como si hay error
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Panel central con el formulario */}
      <div className="neon-panel auth-panel fade-in">
        <div className="logo-wrapper">
          <img src="/Logo.png" alt="Cubo logo" className="app-logo" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Campo de usuario — input controlado: su valor está en el estado de React */}
          <div className="form-group">
            <label className="form-label">Nombre de usuario</label>
            <input
              className="neon-input"
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username" // Ayuda al gestor de contraseñas del navegador
            />
          </div>

          {/* Campo de contraseña — type="password" oculta los caracteres */}
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {/* Mensaje de error inline — solo se renderiza si hay error */}
          {error && <p className="form-error">{error}</p>}

          {/* Botón deshabilitado mientras se carga para evitar envíos duplicados */}
          <button className="neon-btn neon-btn--large" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Enlaces de navegación secundarios */}
        <p className="auth-link" style={{ marginTop: '1rem' }}>
          <Link to="/register">Registrarse</Link>
        </p>
        <p className="auth-link">
          <Link to="/forgot-password">¿Has olvidado tu contraseña?</Link>
        </p>
      </div>

      <Sparkle />

      {/* Modal de error de red — se muestra condicionalmente con renderizado condicional */}
      {showNetworkError && (
        <ErrorModal onClose={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}
