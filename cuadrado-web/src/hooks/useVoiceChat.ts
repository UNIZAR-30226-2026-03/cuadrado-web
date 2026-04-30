// hooks/useVoiceChat.ts - Hook WebRTC para chat de voz P2P (mesh completo).
//
// Porta la lógica de VoiceChatService (Angular, cuadrado-desktop) a React hooks.
// Usa el socket de salas (room.service.ts) para la señalización WebRTC,
// ya que el backend voice.gateway.ts comparte el mismo servidor Socket.IO.
//
// Decisión de arquitectura de audio:
//   La salida de audio remota se enruta por completo a través de Web Audio
//   (Source → Gain → Destination) en lugar del elemento <audio>. Esto evita
//   el conflicto en Chrome cuando un mismo MediaStream es asignado a un
//   <audio>.srcObject Y consumido por un MediaStreamAudioSourceNode al mismo
//   tiempo (causa cortes/petardeos en la salida y silenciaría al AnalyserNode
//   en algunas versiones). El <audio> se mantiene muted y en el DOM como
//   "primer" del pipeline de audio WebRTC del navegador.
//   El volumen y el ensordecer (deafen) se controlan vía GainNode.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getRoomsSocket } from '../services/room.service';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const SPEAKING_THRESHOLD = 15; // amplitud media (0-255) para detectar habla

export type MicPermission = 'unknown' | 'granted' | 'denied';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySocket = { on: any; off: any; emit: any; id?: string };

function loadVolVoice(): number {
  try {
    const raw = localStorage.getItem('vol_voice');
    return raw !== null ? Math.max(0, Math.min(100, Number(JSON.parse(raw)))) : 90;
  } catch { return 90; }
}

export function useVoiceChat() {
  // ── Estado reactivo (usado en UI) ─────────────────────────────────────────
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [speakingPeers, setSpeakingPeers] = useState<ReadonlySet<string>>(new Set());
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('default');

  // ── Refs (estado mutable sin re-render) ───────────────────────────────────
  const localStreamRef     = useRef<MediaStream | null>(null);
  const peersRef           = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef     = useRef<Map<string, HTMLAudioElement>>(new Map());
  const remoteSourcesRef   = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());
  const remoteGainsRef     = useRef<Map<string, GainNode>>(new Map());
  const audioCtxRef        = useRef<AudioContext | null>(null);
  const localAnalyserRef   = useRef<AnalyserNode | null>(null);
  const remoteAnalysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const detectionTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRoomRef     = useRef<string | null>(null);
  // Refs que espejean el estado booleano para uso en callbacks sin re-crear deps
  const micMutedRef  = useRef(false);
  const deafenedRef  = useRef(false);

  // ── AudioContext ──────────────────────────────────────────────────────────

  const getOrCreateAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      // Sample rate 48kHz coincide con el códec Opus de WebRTC y evita
      // resampling cuando se enruta por Web Audio.
      try {
        audioCtxRef.current = new AudioContext({ sampleRate: 48000 });
      } catch {
        audioCtxRef.current = new AudioContext();
      }
    }
    return audioCtxRef.current;
  }, []);

  const resumeAudioCtx = useCallback((): void => {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* el navegador requiere gesto del usuario */ });
    }
  }, []);

  // ── Detección de actividad de voz (100ms polling) ─────────────────────────

  const detectSpeaking = useCallback(() => {
    const buf = new Uint8Array(128);

    if (localAnalyserRef.current) {
      localAnalyserRef.current.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      setLocalSpeaking(avg > SPEAKING_THRESHOLD && !micMutedRef.current);
    }

    const speaking = new Set<string>();
    remoteAnalysersRef.current.forEach((analyser, peerId) => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      if (avg > SPEAKING_THRESHOLD) speaking.add(peerId);
    });
    setSpeakingPeers(speaking);
  }, []);

  const ensureDetectionRunning = useCallback(() => {
    if (detectionTimerRef.current !== null) return;
    detectionTimerRef.current = setInterval(detectSpeaking, 100);
  }, [detectSpeaking]);

  const maybeStopDetection = useCallback(() => {
    if (localAnalyserRef.current || remoteAnalysersRef.current.size > 0) return;
    if (detectionTimerRef.current !== null) {
      clearInterval(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
  }, []);

  const setupLocalAnalyser = useCallback((stream: MediaStream) => {
    try {
      const ctx = getOrCreateAudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      // Source local va sólo al analyser (NO a destination, sería eco del propio mic)
      ctx.createMediaStreamSource(stream).connect(analyser);
      localAnalyserRef.current = analyser;
    } catch { /* AudioContext bloqueado hasta la primera acción del usuario */ }
  }, [getOrCreateAudioCtx]);

  // ── Gestión de audio remoto (Web Audio: source → gain → destination) ─────

  const attachRemoteAudio = useCallback((peerId: string, stream: MediaStream) => {
    // 1) <audio> "primer": Chrome necesita que el stream esté asignado a un
    //    elemento media en el DOM para que el pipeline WebRTC arranque correctamente.
    //    Lo mantenemos muted; el sonido sale por Web Audio para evitar conflictos.
    let el = remoteAudioRef.current.get(peerId);
    if (!el) {
      el = new Audio();
      el.autoplay = true;
      el.muted = true;
      el.style.display = 'none';
      el.setAttribute('playsinline', 'true');
      document.body.appendChild(el);
      remoteAudioRef.current.set(peerId, el);
    }
    el.srcObject = stream;
    el.play().catch(() => { /* autoplay puede requerir gesto, no bloqueante */ });

    // 2) Web Audio: source → analyser (detección) y source → gain → destination (salida)
    const ctx = getOrCreateAudioCtx();
    resumeAudioCtx();

    // Limpiar nodos previos de este peer (re-attach tras renegociación, etc.)
    const prevSource = remoteSourcesRef.current.get(peerId);
    if (prevSource) { try { prevSource.disconnect(); } catch { /* ignore */ } }
    const prevGain = remoteGainsRef.current.get(peerId);
    if (prevGain) { try { prevGain.disconnect(); } catch { /* ignore */ } }

    let source: MediaStreamAudioSourceNode;
    try {
      source = ctx.createMediaStreamSource(stream);
    } catch {
      // Si no se puede crear el source (estado del ctx, etc.), abortamos esta vía.
      return;
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const gain = ctx.createGain();
    gain.gain.value = deafenedRef.current ? 0 : (loadVolVoice() / 100);
    source.connect(gain);
    gain.connect(ctx.destination);

    remoteSourcesRef.current.set(peerId, source);
    remoteGainsRef.current.set(peerId, gain);
    remoteAnalysersRef.current.set(peerId, analyser);
    ensureDetectionRunning();
  }, [getOrCreateAudioCtx, resumeAudioCtx, ensureDetectionRunning]);

  const closePeer = useCallback((peerId: string) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);

    const el = remoteAudioRef.current.get(peerId);
    if (el) {
      el.srcObject = null;
      el.remove();
      remoteAudioRef.current.delete(peerId);
    }
    try { remoteSourcesRef.current.get(peerId)?.disconnect(); } catch { /* ignore */ }
    remoteSourcesRef.current.delete(peerId);
    try { remoteGainsRef.current.get(peerId)?.disconnect(); } catch { /* ignore */ }
    remoteGainsRef.current.delete(peerId);
    remoteAnalysersRef.current.delete(peerId);

    setSpeakingPeers(s => { const n = new Set(s); n.delete(peerId); return n; });
    setConnectedPeers(list => list.filter(id => id !== peerId));
    maybeStopDetection();
  }, [maybeStopDetection]);

  const createPeer = useCallback((peerId: string): RTCPeerConnection => {
    if (peersRef.current.has(peerId)) {
      peersRef.current.get(peerId)!.close();
      peersRef.current.delete(peerId);
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = event => attachRemoteAudio(peerId, event.streams[0]);

    pc.onicecandidate = event => {
      if (!event.candidate) return;
      const socket = getRoomsSocket() as AnySocket | null;
      socket?.emit('voice:ice-candidate', { to: peerId, candidate: event.candidate.toJSON() });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        closePeer(peerId);
      }
    };

    peersRef.current.set(peerId, pc);
    setConnectedPeers(list => (list.includes(peerId) ? list : [...list, peerId]));
    return pc;
  }, [attachRemoteAudio, closePeer]);

  const closeAllPeers = useCallback(() => {
    for (const id of [...peersRef.current.keys()]) closePeer(id);
  }, [closePeer]);

  // ── Señalización WebRTC ───────────────────────────────────────────────────

  const teardownSignaling = useCallback(() => {
    const socket = getRoomsSocket() as AnySocket | null;
    if (!socket) return;
    socket.off('voice:peers');
    socket.off('voice:peer-joined');
    socket.off('voice:peer-left');
    socket.off('voice:offer');
    socket.off('voice:answer');
    socket.off('voice:ice-candidate');
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (currentRoomRef.current === roomId) return;
    const socket = getRoomsSocket() as AnySocket | null;
    if (!socket) return;

    teardownSignaling();
    currentRoomRef.current = roomId;

    // Reanudar AudioContext (gesto del usuario al pulsar "Comenzar partida"/joinRoom).
    resumeAudioCtx();

    socket.on('voice:peers', async (peers: string[]) => {
      for (const peerId of peers) {
        const pc = createPeer(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice:offer', { to: peerId, offer });
      }
    });

    socket.on('voice:peer-joined', (_payload: { peerId: string }) => {
      // El peer entrante nos enviará una oferta — no necesitamos hacer nada aquí
    });

    socket.on('voice:peer-left', (payload: { peerId: string }) => {
      closePeer(payload.peerId);
    });

    socket.on('voice:offer', async (payload: { from: string; offer: RTCSessionDescriptionInit }) => {
      const pc = createPeer(payload.from);
      await pc.setRemoteDescription(payload.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice:answer', { to: payload.from, answer });
    });

    socket.on('voice:answer', async (payload: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(payload.from);
      if (pc) await pc.setRemoteDescription(payload.answer);
    });

    socket.on('voice:ice-candidate', async (payload: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(payload.from);
      if (!pc) return;
      try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch { /* ignorar */ }
    });

    socket.emit('voice:join', roomId);
  }, [teardownSignaling, resumeAudioCtx, createPeer, closePeer]);

  const leaveRoom = useCallback(() => {
    if (!currentRoomRef.current) return;
    const socket = getRoomsSocket() as AnySocket | null;
    socket?.emit('voice:leave');
    closeAllPeers();
    teardownSignaling();
    currentRoomRef.current = null;
    setConnectedPeers([]);
    setSpeakingPeers(new Set());
    setLocalSpeaking(false);
  }, [closeAllPeers, teardownSignaling]);

  // ── Stream local ──────────────────────────────────────────────────────────

  const startLocalStream = useCallback(async (deviceId = 'default'): Promise<MediaStream | null> => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    localAnalyserRef.current = null;

    // Constraints explícitas con AEC/NS/AGC para evitar eco/ruido cuando hay
    // varios participantes en la misma máquina o entornos ruidosos.
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };
    if (deviceId !== 'default') {
      audioConstraints.deviceId = { exact: deviceId };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      localStreamRef.current = stream;
      setSelectedDeviceId(deviceId);
      setupLocalAnalyser(stream);
      ensureDetectionRunning();

      // Reemplazar tracks en peers existentes (cambio de dispositivo en caliente)
      peersRef.current.forEach(pc => {
        const track = stream.getAudioTracks()[0];
        if (track) pc.getSenders().find(s => s.track?.kind === 'audio')?.replaceTrack(track);
      });

      // Aplicar estado de mute previo
      if (micMutedRef.current) stream.getAudioTracks().forEach(t => (t.enabled = false));

      return stream;
    } catch { return null; }
  }, [setupLocalAnalyser, ensureDetectionRunning]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicPermission('denied');
      return false;
    }
    if (micPermission === 'granted') {
      const all = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      setAudioInputDevices(all.filter(d => d.kind === 'audioinput' && d.deviceId !== 'default'));
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPermission('granted');
      const all = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      setAudioInputDevices(all.filter(d => d.kind === 'audioinput' && d.deviceId !== 'default'));
      return true;
    } catch {
      setMicPermission('denied');
      return false;
    }
  }, [micPermission]);

  const selectDevice = useCallback(async (deviceId: string): Promise<void> => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem('selectedMicDevice', deviceId);
    if (localStreamRef.current) {
      await startLocalStream(deviceId);
    }
  }, [startLocalStream]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !micMutedRef.current;
    micMutedRef.current = newMuted;
    stream.getAudioTracks().forEach(t => (t.enabled = !newMuted));
    setMicMuted(newMuted);
    if (newMuted) setLocalSpeaking(false);
  }, []);

  const toggleDeafen = useCallback(() => {
    const newDeafened = !deafenedRef.current;
    deafenedRef.current = newDeafened;
    setDeafened(newDeafened);
    if (newDeafened) {
      remoteGainsRef.current.forEach(g => { g.gain.value = 0; });
    } else {
      const vol = loadVolVoice() / 100;
      remoteGainsRef.current.forEach(g => { g.gain.value = vol; });
    }
  }, []);

  // Inicia stream local (solicita permiso si falta). Llamado antes de joinRoom.
  const ensureLocalStream = useCallback(async (): Promise<void> => {
    if (localStreamRef.current) return;
    const granted = await requestPermission();
    if (!granted) return;
    const savedDevice = localStorage.getItem('selectedMicDevice') ?? 'default';
    await startLocalStream(savedDevice);
    // Reanudar AudioContext aprovechando el gesto del usuario (clic que disparó join)
    resumeAudioCtx();
  }, [requestPermission, startLocalStream, resumeAudioCtx]);

  // Actualiza el volumen de salida (deafen tiene prioridad: si activo, gains a 0).
  const setOutputVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol / 100));
    if (deafenedRef.current) return;
    remoteGainsRef.current.forEach(g => { g.gain.value = clamped; });
  }, []);

  // ── Limpieza al desmontar ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      leaveRoom();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      // Eliminar audios del DOM por si quedaran tras leaveRoom
      remoteAudioRef.current.forEach(el => { el.srcObject = null; el.remove(); });
      remoteAudioRef.current.clear();
      if (detectionTimerRef.current !== null) clearInterval(detectionTimerRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    micPermission,
    audioInputDevices,
    micMuted,
    deafened,
    localSpeaking,
    speakingPeers,
    connectedPeers,
    selectedDeviceId,
    requestPermission,
    selectDevice,
    toggleMute,
    toggleDeafen,
    joinRoom,
    leaveRoom,
    ensureLocalStream,
    setOutputVolume,
  };
}
