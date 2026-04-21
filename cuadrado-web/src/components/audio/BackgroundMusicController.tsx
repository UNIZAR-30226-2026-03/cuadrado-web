import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const APP_BGM_SRC = '/audio/app-theme.mp3';
const GAME_BGM_SRC = '/audio/app-theme.mp3';

function readNumericPref(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getEffectiveMusicVolume(): number {
  const general = clampPercent(readNumericPref('vol_general', 80));
  const music = clampPercent(readNumericPref('vol_music', 60));
  return (general / 100) * (music / 100);
}

export default function BackgroundMusicController() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const targetSrc = useMemo(() => {
    if (!isAuthenticated) return null;
    return location.pathname === '/game' ? GAME_BGM_SRC : APP_BGM_SRC;
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = getEffectiveMusicVolume();
    audioRef.current = audio;

    const tryPlay = () => {
      const current = audioRef.current;
      if (!current) return;
      void current.play().catch(() => {
        // Autoplay puede bloquearse hasta una interaccion del usuario.
      });
    };

    const resumeOnUserInteraction = () => {
      const current = audioRef.current;
      if (!current) return;
      if (current.paused) {
        tryPlay();
      }
    };

    const syncVolume = () => {
      const current = audioRef.current;
      if (!current) return;
      current.volume = getEffectiveMusicVolume();
    };

	//para que se reactive con interaccion del usuario
    window.addEventListener('pointerdown', resumeOnUserInteraction);
    window.addEventListener('keydown', resumeOnUserInteraction);

	//Posible actualizacion del volumen
    window.addEventListener('storage', syncVolume);
    window.addEventListener('app:audio-settings-changed', syncVolume);

    return () => {
      window.removeEventListener('pointerdown', resumeOnUserInteraction);
      window.removeEventListener('keydown', resumeOnUserInteraction);
      window.removeEventListener('storage', syncVolume);
      window.removeEventListener('app:audio-settings-changed', syncVolume);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!targetSrc) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    audio.volume = getEffectiveMusicVolume();

    if (audio.src !== new URL(targetSrc, window.location.origin).toString()) {
      audio.src = targetSrc;
      audio.currentTime = 0;
    }

    void audio.play().catch(() => {
      // La reproduccion se reintentara cuando el usuario interactue.
    });

  }, [targetSrc]);

  return null;
}