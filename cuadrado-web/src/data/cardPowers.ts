// data/cardPowers.ts - Fuente única de verdad para los poderes de carta.
//
// Unifica la descripción breve (WaitingRoomPage) y completa (CreateRoomModalContent)
// en un único array tipado. POWER_MAP permite lookup O(1) por valor.

/** Configuración completa de un poder de carta */
export interface PowerConfig {
  /** Valor de la carta ('A', '2'…'J') */
  value: string;
  /** Descripción breve para el modal de sala de espera */
  shortDesc: string;
  /** Descripción completa para el modal de crear sala */
  fullDesc: string;
}

export const CARD_POWERS: PowerConfig[] = [
  {
    value: 'A',
    shortDesc: 'Intercambia TODAS tus cartas por TODAS las cartas de otro jugador.',
    fullDesc: 'Intercambia todas tus cartas por todas las cartas de otro jugador.',
  },
  {
    value: '2',
    shortDesc: 'Elige un jugador para que robe una carta extra y la añada a su mano.',
    fullDesc: 'Elige un jugador para que robe una carta extra.',
  },
  {
    value: '3',
    shortDesc: 'Protege una de tus cartas: esa carta no puede ser intercambiada por nadie hasta el final.',
    fullDesc: 'Protege una carta para que no pueda ser intercambiada.',
  },
  {
    value: '4',
    shortDesc: 'Salta el siguiente turno de un jugador a tu elección.',
    fullDesc: 'Salta el siguiente turno de un jugador.',
  },
  {
    value: '5',
    shortDesc: 'Elige una carta de cada jugador de la partida para verla en secreto.',
    fullDesc: 'Mira una carta de cada jugador en secreto.',
  },
  {
    value: '6',
    shortDesc: 'Roba otra carta del mazo para tener una segunda oportunidad de intercambiar o descartar.',
    fullDesc: 'Roba otra carta del mazo.',
  },
  {
    value: '7',
    shortDesc: '(Guardable) Revela quién tiene la mano con menos puntos. Puedes activarlo en cualquier momento.',
    fullDesc: '(Guardable) Revela quién tiene menos puntos.',
  },
  {
    value: '8',
    shortDesc: '(Guardable) Anula la siguiente habilidad que se active en la partida. Puedes activarlo en cualquier momento.',
    fullDesc: '(Guardable) Anula la siguiente habilidad activa.',
  },
  {
    value: '9',
    shortDesc: 'Propones un intercambio ciego a otro jugador: ambos elegís una carta para dar sin saber qué recibiréis.',
    fullDesc: 'Propones intercambio ciego con otro jugador.',
  },
  {
    value: '10',
    shortDesc: 'Puedes ver una de tus propias cartas durante 5 segundos para refrescar la memoria.',
    fullDesc: 'Mira una de tus cartas durante 5 segundos.',
  },
  {
    value: 'J',
    shortDesc: 'Ve una de tus cartas y una de otro jugador. Decide si quieres intercambiarlas o no.',
    fullDesc: 'Mira una carta tuya y otra rival; decide intercambio.',
  },
];

/** Lookup O(1) por valor de carta */
export const POWER_MAP: Record<string, PowerConfig> = Object.fromEntries(
  CARD_POWERS.map(p => [p.value, p]),
);

/** Poderes activados por defecto para el modal de crear sala (todos habilitados) */
export const DEFAULT_POWERS = CARD_POWERS.map(p => ({
  value: p.value,
  label: p.value,
  description: p.fullDesc,
  enabled: true,
}));

/**
 * Convierte el label de carta ('A', '2'…'J') al número que usa el backend (1–11).
 * Retorna null si el label no es reconocido.
 */
export function cardLabelToNumber(label: string): number | null {
  const index = CARD_POWERS.findIndex(p => p.value === label);
  return index === -1 ? null : index + 1;
}

/** Convierte el número del backend (1–11) al label de carta ('A', '2'…'J'). */
export function numberToCardLabel(n: number): string {
  return CARD_POWERS[n - 1]?.value ?? String(n);
}
