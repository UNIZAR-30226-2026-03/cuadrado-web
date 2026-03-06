import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setMessage('Contraseña actualizada correctamente');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Cambiar contraseña</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Contraseña actual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

        <button>Cambiar contraseña</button>
      </form>
    </div>
  );
}