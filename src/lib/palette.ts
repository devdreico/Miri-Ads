/**
 * Contrato de color compartido por TODOS los módulos (landing, escena 3D, dashboards).
 * Escala de grises (blanco/negro) + aguamarina vibrante como color base dominante.
 */
export const PALETTE = {
  aqua: '#2FE6C8',
  aquaDeep: '#0FB5A1',
  aquaDark: '#0A6E63',
  aquaGlow: 'rgba(47, 230, 200, 0.45)',
  aquaSoft: 'rgba(47, 230, 200, 0.12)',

  ink: '#05070A',
  inkRaised: '#0B0F14',
  inkLine: '#1A2129',
  paper: '#FAFAFA',
  paperRaised: '#FFFFFF',

  gray100: '#F2F4F5',
  gray200: '#E2E6E8',
  gray300: '#C7CDD1',
  gray400: '#9AA4AA',
  gray500: '#6B757C',
  gray600: '#48525A',
  gray700: '#2C343B',
  gray800: '#181E24',
  gray900: '#0D1216',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const HEX = {
  route: PALETTE.aqua,
  routeAlt: PALETTE.aquaDeep,
  globeBase: PALETTE.gray700,
  globeLand: '#39434B',
  atmosphere: PALETTE.aqua,
  stars: PALETTE.gray400,
} as const;

/** Nodos geográficos de la red Miri (lat, lng) — usados por la escena 3D y los mapas. */
export const NETWORK_NODES = [
  { id: 'lim', name: 'Lima', lat: -12.0464, lng: -77.0428, hub: true },
  { id: 'mex', name: 'Ciudad de México', lat: 19.4326, lng: -99.1332, hub: true },
  { id: 'bog', name: 'Bogotá', lat: 4.711, lng: -74.0721, hub: true },
  { id: 'scl', name: 'Santiago', lat: -33.4489, lng: -70.6693, hub: false },
  { id: 'eze', name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, hub: true },
  { id: 'bue2', name: 'Montevideo', lat: -34.9011, lng: -56.1645, hub: false },
  { id: 'sao', name: 'São Paulo', lat: -23.5505, lng: -46.6333, hub: true },
  { id: 'bog2', name: 'Medellín', lat: 6.2442, lng: -75.5812, hub: false },
  { id: 'mex2', name: 'Guadalajara', lat: 20.6597, lng: -103.3496, hub: false },
  { id: 'lim2', name: 'Arequipa', lat: -16.409, lng: -71.5375, hub: false },
  { id: 'lim3', name: 'Cusco', lat: -13.5319, lng: -71.9675, hub: false },
  { id: 'pan', name: 'Ciudad de Panamá', lat: 8.9824, lng: -79.5199, hub: false },
] as const;

export type NetworkNode = (typeof NETWORK_NODES)[number];
