// ─────────────────────────────────────────────────────────
// types/index.ts — Tipos de dominio del juego Cubo
//
// Define las interfaces TypeScript que representan las
// entidades principales del juego. Separarlas aquí permite
// reutilizarlas en cualquier parte del proyecto y que el
// compilador detecte errores de tipo en tiempo de desarrollo.
// ─────────────────────────────────────────────────────────

// Datos del perfil de un usuario registrado
export interface Usuario {
    id: number;
    nombre: string;
    monedas: number;           // Moneda virtual del juego
    exp: number;               // Puntos de experiencia acumulados
    partidasJugadas: number;
    partidasGanadas: number;
    ranking: number;           // Posición en el ranking global
    avatarSeleccionado: string;   // ID del avatar activo
    reversoSeleccionado: string;  // ID del reverso de carta activo
    tapeteSeleccionado: string;   // ID del tapete activo
}

// Colección de cosméticos desbloqueados por un usuario
export interface Inventario {
    IDusuario: number;
    avatares: string[];  // Lista de IDs de avatares desbloqueados
    reversos: string[];  // Lista de IDs de reversos de carta desbloqueados
    tapetes: string[];   // Lista de IDs de tapetes desbloqueados
}

// Estado global de autenticación del usuario en la sesión
export interface EstadoAutenticacion {
    usuario: Usuario | null; // null cuando no hay sesión iniciada
    estaAutenticado: boolean;
}

// Representa una carta individual de la baraja
export interface Carta {
    palo: 'hearts' | 'diamonds' | 'clubs' | 'spades'; // Palo de la carta
    valor: string;            // "A","2"…"K"
    estaVisible: boolean;     // false = carta boca abajo (no visible al jugador)
}

// Representa a un jugador dentro de una partida activa
export interface Jugador {
    id: number;                 // [1..8] posición en la mesa
    idUsuario: number;         // ID del usuario que controla este jugador
    cartas: Carta[];            // Siempre 4 cartas en Cubo
    estaSilenciado: boolean;     // Si tiene el audio silenciado
    estaEnsordecido: boolean; // Si no puede escuchar el audio de otros
}

// Configuración inicial de una sala de juego
export interface SalaConfig {
    nombre: string;
    maxJugadores: number;       // 2-8 jugadores por sala
    barajas: 1 | 2;             // Número de barajas a usar
    reglasEspeciales: boolean[]; // Cada posición activa una regla especial distinta
    esPrivada: boolean;
    codigo?: string;             // Código de acceso (solo si esPrivada es true)
}

// Estado completo de una sala (antes y durante la partida)
export interface Sala {
    id: string;
    config: SalaConfig;
    jugadores: Jugador[];
    estado: 'waiting' | 'playing' | 'finished'; // Fase actual de la sala
}

// Estado en tiempo real de una partida en curso
export interface EstadoPartida {
    idSala: string;
    turnoActual: number;          // ID del jugador que tiene el turno
    cartasRestantes: Carta[];     // Cartas restantes en el mazo
    ultimoDescarte: Carta | null; // Carta visible en la pila de descarte
    tiempoRestante: number;       // Segundos restantes del turno actual
    fase: 'waiting' | 'dealing' | 'playing' | 'finished';
    jugadorCubo: number;          // ID del jugador que ha cantado "Cubo" (0 si nadie)
}
