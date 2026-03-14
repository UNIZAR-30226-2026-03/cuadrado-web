import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthFormWrapper from '../components/auth/AuthFormWrapper';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      await login({ username, password });
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo iniciar sesion'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormWrapper
      title="Iniciar sesion"
      subtitle="Accede con tu usuario para entrar al lobby."
      footer={
        <>
          <span>¿No tienes cuenta?</span>
          <Link className="auth-link" to="/register">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            className="auth-input"
            placeholder="Tu usuario"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className="auth-input"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="auth-message auth-message--error" role="alert">
            {error}
          </p>
        )}

        <button className="auth-button" disabled={loading} type="submit">
          {loading ? 'Entrando...' : 'Iniciar sesion'}
        </button>
      </form>
    </AuthFormWrapper>
  );
}
