// ─────────────────────────────────────────────────────────
// pages/ChangePasswordPage.tsx — Cambio de contraseña
//
// Permite a un usuario autenticado cambiar su contraseña
// introduciendo la contraseña actual y la nueva dos veces.
//
// Nota: esta página no está registrada en el enrutador (App.tsx)
// aún, por lo que no tiene ruta asignada. Tampoco usa el
// estilo neon del resto de páginas (está pendiente de maquetar).
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
  // Obtenemos la función changePassword del contexto de autenticación
  const { changePassword } = useAuth();

  // Estado local del formulario
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(''); // Mensaje de éxito
  const [error, setError] = useState('');     // Mensaje de error

  // ── handleSubmit ────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validación 1: mínimo 8 caracteres para la nueva contraseña
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Validación 2: ambas contraseñas deben coincidir
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      // changePassword llama al backend con el token actual del localStorage
      await changePassword({ currentPassword, newPassword });
      setMessage('Contraseña actualizada correctamente');
    } catch (err: any) {
      // Nota: err: any es menos seguro que err: unknown + typeof check;
      // está pendiente de mejorar como el resto de páginas
      setError(err.message);
    }
  }

  // Nota: este componente no usa todavía las clases CSS del tema neon.
  // El formulario está en estado básico, pendiente de maquetar.
  return (
    <div>
      <h2>Cambiar contraseña</h2>

      <form onSubmit={handleSubmit}>
        {/* Contraseña actual — necesaria para verificar identidad en el backend */}
        <input
          type="password"
          placeholder="Contraseña actual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        {/* Nueva contraseña */}
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {/* Confirmación de la nueva contraseña */}
        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {/* Mensajes de feedback con estilos inline (pendiente de usar clases CSS del tema) */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

        <button>Cambiar contraseña</button>
      </form>
    </div>
  );
}
