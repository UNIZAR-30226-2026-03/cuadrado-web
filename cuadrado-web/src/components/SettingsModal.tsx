// components/SettingsModal.tsx - Popup global de configuración reutilizable en toda la app.

import { useEffect } from 'react';
import { useModal } from '../context/ModalContext';
import SettingsContent from './settings/SettingsContent';
import '../styles/AppModal.css';

export default function SettingsModal() {
  const { isSettingsOpen, closeModal } = useModal();

  useEffect(() => {
    if (!isSettingsOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSettingsOpen, closeModal]);

  if (!isSettingsOpen) {
    return null;
  }

  return (
    <div className="app-modal-overlay" onClick={closeModal} role="presentation">
      <section
        className="app-modal app-modal--settings"
        role="dialog"
        aria-modal="true"
        aria-label="Configuración"
        onClick={event => event.stopPropagation()}
      >
        <header className="app-modal__header">
          <button className="app-modal__back" onClick={closeModal}>
            ← Volver
          </button>
          <h2 className="app-modal__title">Configuración</h2>
          <div className="app-modal__spacer" aria-hidden="true" />
        </header>

        <div className="app-modal__content">
          <SettingsContent onClose={closeModal} inModal />
        </div>
      </section>
    </div>
  );
}
