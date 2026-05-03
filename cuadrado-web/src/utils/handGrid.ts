// src/utils/handGrid.ts - Algoritmo de rejilla fija para manos de cartas.

export type HandLayout = '2x2' | '2x3';
export type HandSlotIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface HandCellSpec {
  slotIndex: HandSlotIndex;
  row: number;
  column: number;
}

export interface HandGridState {
  layout: HandLayout;
  // AHORA ES UN MAPA: El índice del array es el número de carta (0,1,2), 
  // y el valor numérico es el hueco físico donde se pinta (0 a 5).
  occupiedSlots: HandSlotIndex[]; 
  count: number;
}

export const HAND_LAYOUT_SPECS: Record<HandLayout, { columns: number; rows: number; cells: HandCellSpec[] }> = {
  '2x2': {
    columns: 2,
    rows: 2,
    cells: [
      { slotIndex: 0, row: 1, column: 1 },
      { slotIndex: 1, row: 2, column: 1 },
      { slotIndex: 2, row: 1, column: 2 },
      { slotIndex: 3, row: 2, column: 2 },
    ],
  },
  '2x3': {
    columns: 3,
    rows: 2,
    cells: [
      { slotIndex: 0, row: 1, column: 1 },
      { slotIndex: 1, row: 2, column: 1 },
      { slotIndex: 2, row: 1, column: 2 },
      { slotIndex: 3, row: 2, column: 2 },
      { slotIndex: 4, row: 1, column: 3 },
      { slotIndex: 5, row: 2, column: 3 },
    ],
  },
};

const DEFAULT_HAND_STATE_BY_COUNT: Record<number, HandGridState> = {
  0: { layout: '2x2', occupiedSlots: [], count: 0 },
  1: { layout: '2x2', occupiedSlots: [0], count: 1 },
  2: { layout: '2x2', occupiedSlots: [0, 1], count: 2 },
  3: { layout: '2x2', occupiedSlots: [0, 1, 2], count: 3 },
  4: { layout: '2x2', occupiedSlots: [0, 1, 2, 3], count: 4 },
  5: { layout: '2x3', occupiedSlots: [0, 1, 2, 3, 4], count: 5 },
  6: { layout: '2x3', occupiedSlots: [0, 1, 2, 3, 4, 5], count: 6 },
};

const REMOVAL_PRIORITY: Record<HandLayout, HandSlotIndex[]> = {
  '2x2': [3, 2, 1, 0],
  '2x3': [5, 4, 3, 2, 1, 0],
};

export const handStateByPlayer = new Map<string, HandGridState>();
export const pendingRemovalSlotByPlayer = new Map<string, HandSlotIndex>();

export function clampHandCount(count: number): number {
  return Math.max(0, Math.min(6, count));
}

export function clearHandGridMemory(): void {
  handStateByPlayer.clear();
  pendingRemovalSlotByPlayer.clear();
}

function getDefaultHandState(count: number): HandGridState {
  return DEFAULT_HAND_STATE_BY_COUNT[count] ?? DEFAULT_HAND_STATE_BY_COUNT[0];
}

function compress2x3To2x2(occupiedSlots: ReadonlyArray<HandSlotIndex>): HandSlotIndex[] | null {
  const occupied = new Set(occupiedSlots);
  const isCol1Empty = !occupied.has(0) && !occupied.has(1);
  const isCol2Empty = !occupied.has(2) && !occupied.has(3);
  const isCol3Empty = !occupied.has(4) && !occupied.has(5);

  if (!isCol1Empty && !isCol2Empty && !isCol3Empty) {
    return null;
  }

  // Ahora mapeamos preservando estrictamente el orden de los índices de carta
  if (isCol1Empty) {
    const shiftMap: Record<number, number> = { 2: 0, 3: 1, 4: 2, 5: 3 };
    return occupiedSlots.map(slot => (shiftMap[slot] ?? slot) as HandSlotIndex);
  }

  if (isCol2Empty) {
    const shiftMap: Record<number, number> = { 4: 2, 5: 3 };
    return occupiedSlots.map(slot => (shiftMap[slot] ?? slot) as HandSlotIndex);
  }

  return [...occupiedSlots];
}

function getRemovalCandidate(layout: HandLayout, occupiedSlots: ReadonlyArray<HandSlotIndex>): HandSlotIndex {
  const occupied = new Set(occupiedSlots);
  const fallback = REMOVAL_PRIORITY[layout].find((slot) => occupied.has(slot));
  return fallback ?? occupiedSlots[occupiedSlots.length - 1] ?? 0;
}

export function resolveHandGridState(playerId: string, count: number): HandGridState {
  const safeCount = clampHandCount(count);
  const previousState = handStateByPlayer.get(playerId);

  if (!previousState) {
    const nextState = getDefaultHandState(safeCount);
    handStateByPlayer.set(playerId, nextState);
    return nextState;
  }

  if (previousState.count === safeCount) {
    return previousState;
  }

  if (safeCount > previousState.count) {
    let layout = previousState.layout;
    let occupiedSlots = [...previousState.occupiedSlots];
    let remainingToAdd = safeCount - previousState.count;

    if (safeCount > 4) {
      layout = '2x3';
    }

    const FILL_PRIORITY: HandSlotIndex[] = [0, 1, 2, 3, 4, 5];
    const occupiedSet = new Set(occupiedSlots);

    for (const slot of FILL_PRIORITY) {
      if (remainingToAdd === 0) break;
      if (layout === '2x2' && (slot === 4 || slot === 5)) continue;

      if (!occupiedSet.has(slot)) {
        // APPEND IMPORTANTE: Mantiene las cartas viejas vinculadas a sus ranuras, 
        // y la nueva carta robada toma la nueva ranura encontrada.
        occupiedSlots.push(slot); 
        occupiedSet.add(slot);
        remainingToAdd--;
      }
    }

    const nextState: HandGridState = { layout, occupiedSlots, count: safeCount };
    handStateByPlayer.set(playerId, nextState);
    return nextState;
  }

  let layout = previousState.layout;
  let occupiedSlots = [...previousState.occupiedSlots];
  const pendingRemovalSlot = pendingRemovalSlotByPlayer.get(playerId);
  let remainingToRemove = previousState.count - safeCount;

  while (remainingToRemove > 0 && occupiedSlots.length > 0) {
    let slotToRemove: HandSlotIndex;

    if (pendingRemovalSlot !== undefined && occupiedSlots.includes(pendingRemovalSlot)) {
      slotToRemove = pendingRemovalSlot;
      pendingRemovalSlotByPlayer.delete(playerId);
    } else {
      slotToRemove = getRemovalCandidate(layout, occupiedSlots);
    }

    // Filter MANTIENE el orden de la matriz para las cartas no descartadas
    occupiedSlots = occupiedSlots.filter((slot) => slot !== slotToRemove);
    remainingToRemove -= 1;

    if (layout === '2x3') {
      const compressed = compress2x3To2x2(occupiedSlots);
      if (compressed) {
        layout = '2x2';
        occupiedSlots = compressed;
      }
    }
  }

  const nextState: HandGridState = { layout, occupiedSlots, count: safeCount };
  handStateByPlayer.set(playerId, nextState);
  return nextState;
}