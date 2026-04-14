// components/modals/AppModal.tsx - Wrapper genérico para popups globales.
//
// Proporciona overlay + ventana modal con cierre por overlay y soporte opcional
// de cabecera con título. Elimina ~30 líneas duplicadas que existían en
// SettingsModal y CreateRoomModal.

import type { ReactNode } from 'react';
import '../../styles/AppModal.css';

interface AppModalProps {
  /** Texto para aria-label (accesibilidad) */
  label: string;
  /** Modificador BEM: genera app-modal--{modifier} en la sección */
  modifier?: string;
  /** Si se pasa, renderiza la cabecera estándar con botón "← Volver" y título */
  title?: string;
  /** Callback al cerrar (clic en overlay o botón Volver) */
  onClose: () => void;
  children: ReactNode;
}

/**
 * Wrapper de modal que provee overlay oscuro + ventana centrada.
 * Cuando se pasa `title`, incluye la cabecera estándar con botón de retorno.
 */
export default function AppModal({ label, modifier, title, onClose, children }: AppModalProps) {
  return (
    <div className="app-modal-overlay" onClick={onClose} role="presentation">
      <section
        className={`app-modal${modifier ? ` app-modal--${modifier}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={event => event.stopPropagation()}
      >
        {title && (
          <header className="app-modal__header">
            <button className="app-modal__back" onClick={onClose}>← Volver</button>
            <h2 className="app-modal__title">{title}</h2>
            <div className="app-modal__spacer" aria-hidden="true" />
          </header>
        )}
        <div className="app-modal__content">
          {children}
        </div>
      </section>
    </div>
  );
}
