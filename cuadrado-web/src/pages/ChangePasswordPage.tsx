import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthFormWrapper from '../components/auth/AuthFormWrapper';

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentPassword || !newPassword || !confirm) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      setMessage('Contraseña actualizada correctamente');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cambiar la contraseña'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormWrapper
      title="Cambiar contraseña"
      subtitle="Actualiza tu contraseña para mantener la cuenta segura."
      footer={
        <>
          <span>¿Has terminado?</span>
          <Link className="auth-link" to="/dashboard">
            Volver al panel
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="currentPassword">
            Contraseña actual
          </label>
          <input
            id="currentPassword"
            className="auth-input"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="newPassword">
            Nueva contraseña
          </label>
          <input
            id="newPassword"
            className="auth-input"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="confirmPassword">
            Confirmar nueva contraseña
          </label>
          <input
            id="confirmPassword"
            className="auth-input"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p className="auth-message auth-message--error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="auth-message auth-message--success" role="status">
            {message}
          </p>
        )}

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </AuthFormWrapper>
  );
}
