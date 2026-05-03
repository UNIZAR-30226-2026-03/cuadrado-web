// components/voice/VoiceChatControls.tsx - Botones de silenciar/ensordecer para el chat de voz.

import { useVoice } from '../../context/VoiceContext';
import '../../styles/VoiceChat.css';

interface VoiceChatControlsProps {
  /** Cuando disabled=true los botones se muestran pero no son interactivos (pantalla de resultados). */
  disabled?: boolean;
}

export default function VoiceChatControls({ disabled = false }: VoiceChatControlsProps) {
  const { micMuted, deafened, toggleMute, toggleDeafen, micPermission } = useVoice();

  const permDenied = micPermission === 'denied';
  const isDisabled = disabled || permDenied;

  return (
    <div className="voice-controls" aria-label="Controles de voz">
      <button
        type="button"
        className={`voice-btn${micMuted ? ' voice-btn--muted' : ' voice-btn--active'}`}
        onClick={toggleMute}
        disabled={isDisabled}
        title={permDenied ? 'Sin permiso de micrófono' : micMuted ? 'Reactivar micrófono' : 'Silenciar micrófono'}
        aria-pressed={micMuted}
        aria-label={micMuted ? 'Reactivar micrófono' : 'Silenciar micrófono'}
      >
        {micMuted ? <MicOffIcon /> : <MicOnIcon />}
      </button>

      <button
        type="button"
        className={`voice-btn${deafened ? ' voice-btn--deafened' : ' voice-btn--active'}`}
        onClick={toggleDeafen}
        disabled={isDisabled}
        title={deafened ? 'Escuchar voz' : 'Ensordecer (no escuchar a nadie)'}
        aria-pressed={deafened}
        aria-label={deafened ? 'Escuchar voz' : 'Ensordecer'}
      >
        {deafened ? <DeafenedIcon /> : <HeadphonesIcon />}
      </button>
    </div>
  );
}

function MicOnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function DeafenedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M3 18v-6a9 9 0 0 1 9-9" />
      <path d="M21 18v-4" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    </svg>
  );
}
