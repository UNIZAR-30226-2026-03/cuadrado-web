// components/CreateRoomModal.tsx - Popup global para crear partidas desde el lobby.

import { useEffect } from 'react';
import { useModal } from '../context/ModalContext';
import CreateRoomModalContent from './create-room/CreateRoomModalContent';
import '../styles/AppModal.css';

export default function CreateRoomModal() {
  const { isCreateRoomOpen, closeModal } = useModal();

  useEffect(() => {
    if (!isCreateRoomOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCreateRoomOpen, closeModal]);

  if (!isCreateRoomOpen) {
    return null;
  }

  return (
    <div className="app-modal-overlay" onClick={closeModal} role="presentation">
      <section
        className="app-modal app-modal--create-room"
        role="dialog"
        aria-modal="true"
        aria-label="Crear partida"
        onClick={event => event.stopPropagation()}
      >
        <div className="app-modal__content app-modal__content--tight">
          <CreateRoomModalContent onClose={closeModal} />
        </div>
      </section>
    </div>
  );
}
