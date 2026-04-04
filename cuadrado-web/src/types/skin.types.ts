// types/skin.types.ts - Tipos del sistema de skins cosméticas

/** Categorías de skins disponibles en el juego */
export type SkinType = 'Tapete' | 'Carta' | 'Avatar';

/** Representa una skin cosmética tal como la devuelve el backend */
export interface Skin {
  id: string;      // Identificador único (PK en backend)
  name: string;    // Nombre visible de la skin
  type: SkinType;
  price: number;   // En cubitos
  url: string;     // URL de imagen (Supabase)
}
