// components/modals/SettingsModal.tsx - Popup global de configuración reutilizable en toda la app.

import { useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import SettingsContent from '../settings/SettingsContent';
import AppModal from './AppModal';

export default function SettingsModal() {
  const { isSettingsOpen, closeModal } = useModal();

  useEffect(() => {
    if (!isSettingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSettingsOpen, closeModal]);

  if (!isSettingsOpen) return null;

  return (
    <AppModal label="Configuración" modifier="settings" title="Configuración" onClose={closeModal}>
      <SettingsContent onClose={closeModal} inModal />
    </AppModal>
  );
}
