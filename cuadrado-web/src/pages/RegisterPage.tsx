import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sparkle from '../components/Sparkle';
import ErrorModal from '../components/ErrorModal';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirm) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await register({ username, email, password });
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setShowNetworkError(true);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="neon-panel auth-panel fade-in">
        <div className="logo-wrapper">
          <img src="/Logo.png" alt="Cubo logo" className="app-logo" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de usuario</label>
            <input
              className="neon-input"
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="neon-input"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input
              className="neon-input"
              type="password"
              placeholder="Repetir contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="neon-btn neon-btn--large" type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: '1rem' }}>
          <Link to="/login">Volver a Iniciar Sesión</Link>
        </p>
      </div>

      <Sparkle />

      {showNetworkError && (
        <ErrorModal onClose={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}
