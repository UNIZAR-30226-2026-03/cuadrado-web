// components/modals/CreateRoomModal.tsx - Popup global para crear partidas desde el lobby.

import { useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import CreateRoomModalContent from '../room/CreateRoomModalContent';
import AppModal from './AppModal';

export default function CreateRoomModal() {
  const { isCreateRoomOpen, closeModal } = useModal();

  useEffect(() => {
    if (!isCreateRoomOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCreateRoomOpen, closeModal]);

  if (!isCreateRoomOpen) return null;

  return (
    <AppModal label="Crear partida" modifier="create-room" onClose={closeModal}>
      <CreateRoomModalContent onClose={closeModal} />
    </AppModal>
  );
}
