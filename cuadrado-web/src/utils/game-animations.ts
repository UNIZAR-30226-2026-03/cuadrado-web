// utils/game-animations.ts - Primitivas GSAP para animaciones de la partida.
//
// Cada función recibe elementos DOM y devuelve o lanza animaciones GSAP.
// Patrón "ghost card": crea un div temporal, lo anima entre posiciones y lo elimina.

import gsap from 'gsap';

// ── Helpers internos ──────────────────────────────────────────────────────────

function getCenter(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function createGhostCard(skinUrl: string | null): HTMLDivElement {
  const ghost = document.createElement('div');
  ghost.style.cssText = [
    'position:fixed',
    'z-index:9999',
    'width:38px',
    'height:54px',
    'border-radius:6px',
    'pointer-events:none',
    'background:rgba(0,0,0,0.7)',
    'border:1px solid var(--neon-cyan,#00e5ff)',
    'box-shadow:0 0 12px var(--neon-cyan,#00e5ff)',
    'overflow:hidden',
  ].join(';');

  if (skinUrl) {
    const img = document.createElement('img');
    img.src = skinUrl;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    ghost.appendChild(img);
  }
  document.body.appendChild(ghost);
  return ghost;
}

// ── Carta volando de un elemento a otro ───────────────────────────────────────

export function animateCardFly(
  sourceEl: Element,
  targetEl: Element,
  skinUrl: string | null = null,
  onComplete?: () => void,
): void {
  const from = getCenter(sourceEl);
  const to   = getCenter(targetEl);

  const ghost = createGhostCard(skinUrl);
  ghost.style.left = `${from.x - 19}px`;
  ghost.style.top  = `${from.y - 27}px`;

  gsap.fromTo(
    ghost,
    { x: 0, y: 0, scale: 1, opacity: 1 },
    {
      x: to.x - from.x,
      y: to.y - from.y,
      scale: 0.75,
      opacity: 0.85,
      duration: 0.42,
      ease: 'power2.inOut',
      onComplete: () => {
        ghost.remove();
        onComplete?.();
      },
    },
  );
}

// ── Pulso en slot del jugador activo ──────────────────────────────────────────

export function animateSlotActivate(slotEl: Element): void {
  gsap.to(slotEl, {
    '--slot-glow': '1',
    boxShadow: '0 0 18px 4px var(--neon-cyan,#00e5ff)',
    duration: 0.35,
    ease: 'power2.out',
  });
}

export function animateSlotDeactivate(slotEl: Element): void {
  gsap.to(slotEl, {
    boxShadow: 'none',
    duration: 0.25,
    ease: 'power2.in',
  });
}

// ── Temporizador de turno ─────────────────────────────────────────────────────

let timerTween: gsap.core.Tween | null = null;

export function animateTurnTimer(fillEl: Element, durationMs: number): void {
  timerTween?.kill();
  gsap.set(fillEl, { scaleX: 1, transformOrigin: 'left center' });

  timerTween = gsap.to(fillEl, {
    scaleX: 0,
    duration: Math.max(durationMs / 1000, 0.1),
    ease: 'none',
    onUpdate() {
      const el = fillEl as HTMLElement;
      const pct = 1 - (this.progress() ?? 0);
      const isRed    = pct < 0.25;
      const isOrange = pct >= 0.25 && pct < 0.5;
      el.classList.toggle('turn-timer-bar__fill--red', isRed);
      el.classList.toggle('turn-timer-bar__fill--orange', isOrange);
    },
  });
}

export function killTurnTimer(): void {
  timerTween?.kill();
  timerTween = null;
}

// ── Rebarajado del mazo ───────────────────────────────────────────────────────

export function animateDeckReshuffle(deckEl: Element): void {
  gsap.timeline()
    .to(deckEl, { scale: 1.18, duration: 0.18, ease: 'power2.in' })
    .to(deckEl, { scale: 1, duration: 0.35, ease: 'elastic.out(1.2,0.5)' });
}

// ── CUBO activado ─────────────────────────────────────────────────────────────

export function animateCuboActivated(cuboEl: Element): void {
  gsap.timeline()
    .to(cuboEl, { scale: 1.4, duration: 0.18, ease: 'power2.in' })
    .to(cuboEl, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.5)' });
}

// ── Pop-in de elementos revelados ─────────────────────────────────────────────

export function animateRevealedCards(els: Element[]): void {
  if (!els.length) return;
  gsap.from(els, {
    scale: 0,
    autoAlpha: 0,
    duration: 0.32,
    stagger: 0.1,
    ease: 'back.out(1.7)',
  });
}
