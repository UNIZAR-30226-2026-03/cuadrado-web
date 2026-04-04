// services/api.config.ts - URL base de la API compartida por todos los servicios
//
// Prioridad:
//   1) VITE_API_URL (si esta definida)
//   2) /api (misma origin; recomendado para evitar errores de CORS/mixed-content)

function normalizeBaseUrl(url: string): string {
	return url.endsWith('/') ? url.slice(0, -1) : url;
}

const envApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = normalizeBaseUrl(envApiUrl || '/api');
