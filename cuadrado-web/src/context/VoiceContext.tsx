// context/VoiceContext.tsx - Proveedor global de chat de voz.
//
// Persiste la conexión WebRTC entre WaitingRoomPage y GamePage.
// Mantiene el mapeo socketId→userId para saber quién habla en los avatares.

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { useVoiceChat, type MicPermission } from '../hooks/useVoiceChat';

interface PlayerMapping {
  userId: string;
  socketId: string;
}

interface VoiceContextValue {
  // Estado
  micPermission: MicPermission;
  audioInputDevices: MediaDeviceInfo[];
  micMuted: boolean;
  deafened: boolean;
  localSpeaking: boolean;
  speakingPeers: ReadonlySet<string>;
  connectedPeers: string[];
  selectedDeviceId: string;

  // Acciones de dispositivo
  requestPermission: () => Promise<boolean>;
  selectDevice: (deviceId: string) => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  setOutputVolume: (vol: number) => void;

  // Sala de voz
  joinVoiceRoom: (roomId: string) => Promise<void>;
  leaveVoiceRoom: () => void;

  // Mapeo socketId→userId para indicadores de avatar
  updatePlayerMapping: (players: PlayerMapping[]) => void;

  // Devuelve true si el userId dado está hablando en este momento.
  // isLocal=true usa localSpeaking directamente (sin mapeo de sockets).
  isSpeakingUser: (userId: string, isLocal?: boolean) => boolean;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const voice = useVoiceChat();

  // socketId → userId de los jugadores de la sala actual.
  // Se rellena desde WaitingRoomPage (room.players tiene socketId)
  // y persiste durante la partida.
  const [playerMapping, setPlayerMapping] = useState<Map<string, string>>(new Map());

  const updatePlayerMapping = useCallback((players: PlayerMapping[]) => {
    setPlayerMapping(new Map(players.map(p => [p.socketId, p.userId])));
  }, []);

  const joinVoiceRoom = useCallback(async (roomId: string): Promise<void> => {
    await voice.ensureLocalStream();
    voice.joinRoom(roomId);
  }, [voice]);

  const leaveVoiceRoom = useCallback(() => {
    voice.leaveRoom();
  }, [voice]);

  const isSpeakingUser = useCallback((userId: string, isLocal = false): boolean => {
    if (isLocal) return voice.localSpeaking && !voice.micMuted;
    for (const [socketId, uid] of playerMapping) {
      if (uid === userId && voice.speakingPeers.has(socketId)) return true;
    }
    return false;
  }, [playerMapping, voice.speakingPeers, voice.localSpeaking, voice.micMuted]);

  const value: VoiceContextValue = {
    micPermission: voice.micPermission,
    audioInputDevices: voice.audioInputDevices,
    micMuted: voice.micMuted,
    deafened: voice.deafened,
    localSpeaking: voice.localSpeaking,
    speakingPeers: voice.speakingPeers,
    connectedPeers: voice.connectedPeers,
    selectedDeviceId: voice.selectedDeviceId,
    requestPermission: voice.requestPermission,
    selectDevice: voice.selectDevice,
    toggleMute: voice.toggleMute,
    toggleDeafen: voice.toggleDeafen,
    setOutputVolume: voice.setOutputVolume,
    joinVoiceRoom,
    leaveVoiceRoom,
    updatePlayerMapping,
    isSpeakingUser,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice debe usarse dentro de VoiceProvider');
  return ctx;
}
