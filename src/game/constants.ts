/**
 * Constants and types for "El Bauti - Carrera por Calle Laurel"
 */

// Screen coordinates: Camera looks along +Z.
// In Three.js right-handed coordinates, when looking towards +Z:
// +X is visual LEFT on screen, -X is visual RIGHT on screen.
// Lane 0 = Screen Left (+2.3)
// Lane 1 = Screen Center (0)
// Lane 2 = Screen Right (-2.3)
export const LANES = [2.3, 0, -2.3] as const;
export type LaneIndex = 0 | 1 | 2; // 0 = Left, 1 = Center, 2 = Right

export const BASE_SPEED = 18; // units per second
export const MAX_SPEED = 36;
export const ACCELERATION = 0.15; // speed increase per 100m

export const JUMP_VELOCITY = 13.5;
export const GRAVITY = 36;
export const SUPER_JUMP_VELOCITY = 22;

export const SLIDE_DURATION = 0.75; // seconds
export const CHUNK_LENGTH = 36; // length of each Calle Laurel street chunk
export const NUM_ACTIVE_CHUNKS = 5;

export type PowerUpType = 'champi' | 'rioja' | 'pincho';

export interface PowerUpState {
  type: PowerUpType;
  remainingTime: number;
  duration: number;
}

export interface CollectibleItem {
  id: string;
  type: 'coin' | 'champi' | 'rioja' | 'pincho';
  lane: LaneIndex;
  z: number;
  y: number;
  collected: boolean;
}

export type ObstacleType = 
  | 'OAK_BARREL'       // Realistic Oak wine barrel (can jump or dodge)
  | 'TERRACE_TABLE'    // High tapas bar table with 2 bar stools and wine bottle (dodge)
  | 'DOUBLE_BARRELS'   // 2 oak barrels together (dodge or super jump)
  | 'BAR_AWNING';      // Low wooden tavern awning with hanging sign (slide/roll under)

export interface ObstacleInstance {
  id: string;
  type: ObstacleType;
  lane: LaneIndex;
  z: number;
  hitbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  tapas: number;
  wineGlasses: number;
  highScore: number;
  multiplier: number;
}

export interface RiojaRank {
  title: string;
  subtitle: string;
  badge: string;
  minScore: number;
}

export const RIOJA_RANKS: RiojaRank[] = [
  {
    title: 'Guiri Despistado',
    subtitle: 'Buscando la Calle Laurel en el mapa',
    badge: '🗺️',
    minScore: 0,
  },
  {
    title: 'Novato del Poteo',
    subtitle: 'Tu primer chiquito y tapa de jamón',
    badge: '🍷',
    minScore: 1500,
  },
  {
    title: 'Catador de Champiñones',
    subtitle: 'El Bar Soriano te saluda por tu nombre',
    badge: '🍄',
    minScore: 5000,
  },
  {
    title: 'Asiduo de las Barras',
    subtitle: 'Esquivas camareros con maestría riojana',
    badge: '🍢',
    minScore: 12000,
  },
  {
    title: 'Maestro Tabernero',
    subtitle: 'Te sabes de memoria cada bar del Laurel',
    badge: '🏅',
    minScore: 25000,
  },
  {
    title: 'Leyenda de Calle Laurel',
    subtitle: '¡Bauti imperial! Honor y gloria de Logroño',
    badge: '👑',
    minScore: 45000,
  },
];

export function getRankForScore(score: number): RiojaRank {
  for (let i = RIOJA_RANKS.length - 1; i >= 0; i--) {
    if (score >= RIOJA_RANKS[i].minScore) {
      return RIOJA_RANKS[i];
    }
  }
  return RIOJA_RANKS[0];
}
