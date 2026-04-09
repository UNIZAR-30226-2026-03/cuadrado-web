// pages/ProfilePage.tsx - Perfil del jugador autenticado (/profile)
//
// Muestra: avatar equipado, username, ELO + posición de ranking, estadísticas
// de partidas y ratio de victorias. Anima la entrada con GSAP.

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import GameHeader from '../components/GameHeader';
import { useAuth } from '../context/AuthContext';
import { getEquipped } from '../services/skin.service';
import { DEFAULT_AVATAR_URL } from '../config/skinDefaults';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const ratioBarRef  = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Carga la URL real del avatar equipado
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    getEquipped(token).then(eq => setAvatarUrl(eq.avatar)).catch(() => {});
  }, []);

  // Datos derivados del perfil
  const gamesPlayed = user?.gamesPlayed ?? 0;
  const gamesWon    = user?.gamesWon    ?? 0;
  const winRatio    = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const rankPlacementLabel = user?.rankPlacement != null
    ? `#${user.rankPlacement}`
    : 'Sin clasificar';

  // Animaciones de entrada
  useLayoutEffect(() => {
    if (!user || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.profile-hero', {
        y: -24, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
      });
      gsap.from('.profile-stat', {
        scale: 0.85, autoAlpha: 0, duration: 0.45, ease: 'back.out(1.5)',
        stagger: 0.07, delay: 0.2, clearProps: 'all',
      });
      gsap.from('.profile-section', {
        y: 20, autoAlpha: 0, duration: 0.5, ease: 'power2.out',
        stagger: 0.1, delay: 0.35, clearProps: 'all',
      });
    }, containerRef);

    const bar = ratioBarRef.current;
    if (bar) {
      gsap.from(bar, {
        scaleX: 0, transformOrigin: 'left center',
        duration: 1.1, ease: 'power3.out', delay: 0.5,
      });
    }

    return () => ctx.revert();
  }, [user]);

  if (!user) {
    return (
      <div className="skin-page profile-page">
        <GameHeader title="Perfil" onBack={() => navigate('/home')} />
        <main className="skin-page__content">
          <div className="profile-container">
            <p style={{ textAlign: 'center', color: 'var(--text-50)', paddingTop: 40 }}>
              Cargando perfil…
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="skin-page profile-page">
      <GameHeader title="Mi Perfil" onBack={() => navigate('/home')} />

      <main className="skin-page__content">
        <div className="profile-container" ref={containerRef}>

          {/* === Hero === */}
          <div className="profile-hero">
            <div className="profile-hero__avatar">
              <img
                className="profile-hero__avatar-image"
                src={avatarUrl ?? DEFAULT_AVATAR_URL}
                alt={`Avatar de ${user.username}`}
                loading="lazy"
              />
            </div>
            <span className="profile-hero__username">{user.username}</span>
            {user.email && (
              <span className="profile-hero__email">{user.email}</span>
            )}
          </div>

          {/* === Estadísticas === */}
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat__icon">🎮</span>
              <span className="profile-stat__value profile-stat__value--cyan">
                {gamesPlayed}
              </span>
              <span className="profile-stat__label">Partidas</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__icon">🏆</span>
              <span className="profile-stat__value profile-stat__value--gold">
                {gamesWon}
              </span>
              <span className="profile-stat__label">Victorias</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__icon">💎</span>
              <span className="profile-stat__value profile-stat__value--purple">
                {user.cubitos ?? 0}
              </span>
              <span className="profile-stat__label">Cubitos</span>
            </div>
          </div>

          {/* === ELO & Ranking === */}
          <div className="profile-section">
            <h2 className="profile-section__title">Clasificación</h2>
            <div className="profile-elo-ranking">
              <div className="profile-elo-ranking__left">
                <span className="profile-elo-ranking__elo-value">
                  {(user.eloRating ?? 1200).toLocaleString('es-ES')}
                </span>
                <span className="profile-elo-ranking__elo-label">ELO</span>
              </div>

              <div className="profile-elo-ranking__badge" aria-label="Posición en ranking">
                <span className="profile-elo-ranking__badge-icon">🏆</span>
                <span className="profile-elo-ranking__badge-label">Posición</span>
                <span className="profile-elo-ranking__badge-pos">{rankPlacementLabel}</span>
              </div>

              <button
                className="profile-elo-ranking__cta"
                onClick={() => navigate('/ranking')}
              >
                Ver ranking global
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="7,4 13,10 7,16" />
                </svg>
              </button>
            </div>
          </div>

          {/* === Ratio de victorias === */}
          <div className="profile-section">
            <h2 className="profile-section__title">Ratio de victorias</h2>
            <div className="profile-ratio">
              <div className="profile-ratio__header">
                <span className="profile-ratio__label">
                  {gamesWon} victoria{gamesWon !== 1 ? 's' : ''} de {gamesPlayed} partida{gamesPlayed !== 1 ? 's' : ''}
                </span>
                <span className="profile-ratio__value">{winRatio}%</span>
              </div>
              <div className="profile-ratio__bar-bg">
                <div
                  ref={ratioBarRef}
                  className="profile-ratio__bar-fill"
                  style={{ width: `${winRatio}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
