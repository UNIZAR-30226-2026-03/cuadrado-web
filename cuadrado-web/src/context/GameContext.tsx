/* eslint-disable react-refresh/only-export-components */
import {
    createContext, useContext, useState, useCallback,
    useEffect, useRef, type ReactNode,
} from 'react';
import type { EstadoPartida, Carta, Jugador } from '../types';

const PALOS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function randomCard(faceUp = false): Carta {
    return {
        palo: PALOS[Math.floor(Math.random() * 4)],
        valor: VALORES[Math.floor(Math.random() * 13)],
        estaVisible: false,
    };
}

function mockPlayers(count: number): Jugador[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        idUsuario: i + 1000,
        avatar: '',
        cartas: [randomCard(), randomCard(), randomCard(), randomCard()],
        estaSilenciado: true,
        estaEnsordecido: true,
    }));
}

interface TipoContextoPartida extends EstadoPartida {
    
    