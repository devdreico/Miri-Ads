/**
 * Contrato comercial compartido: landing (cards), checkout y backoffice.
 * Precios en USD/mes. `tier` define el orden visual y el nivel de servicio.
 */
export type PlanTier = 'essential' | 'pro' | 'growth';
export type PlanCadence = 'monthly' | 'quarterly' | 'annual';

export interface PlanFeature {
  text: string;
  highlight?: boolean;
}

export interface Plan {
  id: PlanTier;
  name: string;
  tagline: string;
  price: Record<PlanCadence, number>;
  currency: 'USD';
  featured: boolean;
  audience: string;
  deliverables: PlanFeature[];
  digital: string[];
  physical: string[];
  cta: string;
}

export const CADENCE_LABEL: Record<PlanCadence, { label: string; note: string }> = {
  monthly: { label: 'Mensual', note: 'Facturación mes a mes' },
  quarterly: { label: 'Trimestral', note: 'Ahorra 15% · 3 meses' },
  annual: { label: 'Anual', note: 'Ahorra 25% · 12 meses' },
};

export const CADENCE_DISCOUNT: Record<PlanCadence, number> = {
  monthly: 1,
  quarterly: 0.85,
  annual: 0.75,
};

export const PLANS: Plan[] = [
  {
    id: 'essential',
    name: 'Essential Pack',
    tagline: 'Presencia constante, sin fricción.',
    price: { monthly: 149, quarterly: 379, annual: 1349 },
    currency: 'USD',
    featured: false,
    audience: 'Negocios locales que empiezan a publicar con orden.',
    deliverables: [
      { text: 'Calendario editorial mensual (16 piezas)' },
      { text: 'Piezas gráficas estáticas ilimitadas por marca' },
      { text: 'Copys persuasivos optimizados por canal' },
      { text: '1 ronda de ajustes por pieza' },
    ],
    digital: ['Calendario editorial', 'Diseño estático', 'Copywriting'],
    physical: ['1 punto estático geolocalizado', 'Foto 1:1 con GPS'],
    cta: 'Empezar con Essential',
  },
  {
    id: 'pro',
    name: 'Pro Motion Pack',
    tagline: 'Contenido que detiene el scroll.',
    price: { monthly: 349, quarterly: 889, annual: 3149 },
    currency: 'USD',
    featured: true,
    audience: 'Marcas en crecimiento que necesitan movimiento y conversión.',
    deliverables: [
      { text: 'Todo lo de Essential' },
      { text: 'Motion graphics y animación 2D/3B básica' },
      { text: 'Video Ads optimizados para conversión' },
      { text: 'Variaciones A/B de creatividades' },
      { text: 'Soporte prioritario por WhatsApp' },
    ],
    digital: ['Motion graphics', 'Video ads', 'A/B testing creativo'],
    physical: ['3 puntos estáticos', '1 ruta street/mes', '20 micro-vídeos + checklist'],
    cta: 'Escalar con Pro Motion',
  },
  {
    id: 'growth',
    name: 'Growth Pack',
    tagline: 'Estrategia, pauta y ROI medible.',
    price: { monthly: 749, quarterly: 1899, annual: 6749 },
    currency: 'USD',
    featured: false,
    audience: 'Empresas que exigen pipeline y analítica de rendimiento.',
    deliverables: [
      { text: 'Todo lo de Pro Motion' },
      { text: 'Estrategia integral + funnel de conversión' },
      { text: 'Campañas de pauta digital gestionadas' },
      { text: 'Analítica de rendimiento y reporte ROI' },
      { text: 'QR dinámicos con trazabilidad físico → digital' },
    ],
    digital: ['Gestión de pauta', 'Analítica y dashboards', 'QR dinámicos'],
    physical: ['6 puntos estáticos', '2 rutas street/mes', 'Reporte de evidencias GPS'],
    cta: 'Hablar con Growth',
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function planPrice(plan: Plan, cadence: PlanCadence): number {
  return plan.price[cadence];
}
