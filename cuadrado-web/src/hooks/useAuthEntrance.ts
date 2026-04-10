// hooks/useAuthEntrance.ts - Animación de entrada para páginas de autenticación.
//
// Anima: flecha "Volver" desde la izquierda + auth-card con escala y desvanecimiento.
// Los campos dentro de la card (auth-field) siguen usando su CSS animation
// con delays escalonados, que se activan naturalmente una vez la card es visible.

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export function useAuthEntrance() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Botón "← Volver" deslizando desde la izquierda
      tl.from('.auth-back', {
        x: -24,
        autoAlpha: 0,
        duration: 0.4,
        ease: 'power2.out',
        clearProps: 'all',
      });

      // Card principal: sube desde abajo con ligera escala
      tl.from('.auth-card', {
        y: 40,
        autoAlpha: 0,
        scale: 0.93,
        duration: 0.55,
        ease: 'power3.out',
        clearProps: 'all',
      }, 0.05);

      // Logo dentro de la card: escala con rebote
      tl.from('.auth-logo-img', {
        scale: 0.7,
        autoAlpha: 0,
        duration: 0.45,
        ease: 'back.out(1.8)',
        clearProps: 'all',
      }, 0.2);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return containerRef;
}
