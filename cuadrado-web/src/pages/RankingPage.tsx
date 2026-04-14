// pages/RankingPage.tsx - Clasificación global de jugadores (/ranking)
//
// Muestra los primeros 50 jugadores ordenados por ELO.
// Si el jugador no está en el top 50, aparece anclado al pie de la lista.
// Listo para conectar a GET /api/ranking cuando el backend lo implemente.

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import GameHeader from '../components/game/GameHeader';
import { useAuth } from '../context/AuthContext';
import { getRanking } from '../services/ranking.service';
import { getEquipped } from '../services/skin.service';
import type { RankingEntry } from '../types/ranking.types';
import '../styles/RankingPage.css';
import { DEFAULT_AVATAR_URL } from '../config/skinDefaults';
import { getAccessToken } from '../utils/token';

export default function RankingPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const listRef   = useRef<HTMLDivElement>(null);
  const accessToken = getAccessToken();

  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(() => Boolean(accessToken));
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);

  // Carga del ranking al montar
  useEffect(() => {
    if (!accessToken) return;

    getRanking(accessToken, 50)
      .then(data => {
        setEntries(data);
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accessToken]);

  // Obtener avatar equipado del jugador local y aplicarlo si hace falta
  useEffect(() => {
    if (!accessToken) return;

    getEquipped(accessToken).then(eq => {
      setMyAvatarUrl(eq.avatar);
    }).catch(() => {});
  }, [accessToken]);

  // Vista derivada: si falta avatar del usuario local, se completa sin mutar estado
  const entriesWithAvatar = useMemo(() => {
    const username = user?.username;
    if (!myAvatarUrl || !username) return entries;

    return entries.map((entry) => (
      entry.username === username && !entry.avatarUrl
        ? { ...entry, avatarUrl: myAvatarUrl }
        : entry
    ));
  }, [entries, myAvatarUrl, user?.username]);

  // Animación de entrada de filas cuando los datos cargan
  useLayoutEffect(() => {
    if (loading || !listRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.ranking-row', {
        y: 16, autoAlpha: 0, duration: 0.35, ease: 'power2.out',
        stagger: 0.04, delay: 0.05, clearProps: 'all',
      });
    }, listRef);
    return () => ctx.revert();
  }, [loading]);

  const myUsername  = user?.username ?? '';
  const isInTop50   = entriesWithAvatar.some(e => e.username === myUsername);

  // Fila del jugador para anclar al pie si no está en top 50
  const myAnchorEntry: RankingEntry | null =
    !isInTop50 && myUsername
      ? {
          position:    user?.rankPlacement ?? 999,
          username:    myUsername,
          eloRating:   user?.eloRating ?? 1200,
          avatarUrl:   myAvatarUrl ?? null,
          gamesPlayed: user?.gamesPlayed ?? 0,
          gamesWon:    user?.gamesWon    ?? 0,
        }
      : null;

  return (
    <div className="app-page">
      <GameHeader title="Ranking Global" onBack={() => navigate(-1)} />

      <div className="ranking-page__content">
        {loading ? (
          <div className="ranking-empty">
            <span className="ranking-empty__icon">⏳</span>
            <span className="ranking-empty__title">Cargando ranking…</span>
          </div>
        ) : entriesWithAvatar.length === 0 ? (
          /* Estado vacío: backend aún no implementado */
          <>
            <div className="ranking-empty">
              <span className="ranking-empty__icon">🏆</span>
              <span className="ranking-empty__title">Clasificación disponible próximamente</span>
              <span className="ranking-empty__sub">
                El ranking global se mostrará aquí cuando esté disponible.
              </span>
            </div>

            {myAnchorEntry && (
              <div className="ranking-anchor-wrapper">
                <hr className="ranking-anchor-divider" />
                <RankingRow entry={myAnchorEntry} isMe />
              </div>
            )}
          </>
        ) : (
          /* Lista con datos reales */
          <>
            <div className="ranking-list" ref={listRef}>
              {entriesWithAvatar.map(entry => (
                <RankingRow
                  key={entry.username}
                  entry={entry}
                  isMe={entry.username === myUsername}
                />
              ))}
            </div>

            {/* Fila anclada fuera del scroll si el jugador no está en top 50 */}
            {myAnchorEntry && (
              <div className="ranking-anchor-wrapper">
                <hr className="ranking-anchor-divider" />
                <RankingRow entry={myAnchorEntry} isMe />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponente: fila de la tabla
// ---------------------------------------------------------------------------

interface RankingRowProps {
  entry: RankingEntry;
  isMe?: boolean;
}

function RankingRow({ entry, isMe = false }: RankingRowProps) {
  const posClass =
    entry.position === 1 ? 'ranking-pos--top1' :
    entry.position === 2 ? 'ranking-pos--top2' :
    entry.position === 3 ? 'ranking-pos--top3' :
    isMe                 ? 'ranking-pos--me'   : '';

  const rowClass =
    entry.position === 1 ? 'ranking-row--top1' :
    entry.position === 2 ? 'ranking-row--top2' :
    entry.position === 3 ? 'ranking-row--top3' :
    isMe                 ? 'ranking-row--me'   : '';

  const posLabel =
    entry.position === 1 ? '🥇' :
    entry.position === 2 ? '🥈' :
    entry.position === 3 ? '🥉' :
    `#${entry.position}`;

  const winRatio = entry.gamesPlayed > 0
    ? Math.round((entry.gamesWon / entry.gamesPlayed) * 100)
    : 0;

  return (
    <div className={`ranking-row ${rowClass}`}>
      <span className={`ranking-pos ${posClass}`}>{posLabel}</span>

      <div className="ranking-avatar">
        <img src={entry.avatarUrl ?? DEFAULT_AVATAR_URL} alt={entry.username} />
      </div>

      <div className="ranking-info">
        <span className={`ranking-info__name${isMe ? ' ranking-info__name--me' : ''}`}>
          {entry.username}{isMe ? ' (tú)' : ''}
        </span>
        <span className="ranking-info__sub">
          {entry.gamesPlayed} partidas · {winRatio}% victorias
        </span>
      </div>

      <div className="ranking-elo">
        <span className="ranking-elo__icon">🏆</span>
        {entry.eloRating.toLocaleString('es-ES')}
      </div>
    </div>
  );
}

