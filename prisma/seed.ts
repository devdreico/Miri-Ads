import { Prisma } from '@prisma/client';
import { db } from '../src/lib/db';
import { addDays, weekStartOf } from '../src/lib/format';
import { getPlan, type Plan } from '../src/lib/plans';

const now = new Date();
const weekStart = weekStartOf(now);
const weekEnd = addDays(weekStart, 6);
const printDate = addDays(weekStart, 5);
const distributeDate = addDays(weekStart, 6);
const prevWeekStart = addDays(weekStart, -7);
const prevWeekEnd = addDays(prevWeekStart, 6);
const dayIndex = Math.floor((now.getTime() - weekStart.getTime()) / 86_400_000);
const completedDate = addDays(weekStart, Math.min(dayIndex, 5));
const inProgressDate = addDays(weekStart, dayIndex);
const plannedDate = addDays(weekStart, Math.min(dayIndex + 1, 6));

function monthsAgo(months: number): Date {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

function atHour(date: Date, hour: number, minute = 0): Date {
  const d = new Date(date);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

function planOf(tier: 'essential' | 'pro' | 'growth'): Plan {
  const found = getPlan(tier);
  if (!found) throw new Error(`Plan desconocido: ${tier}`);
  return found;
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function demoHash(input: string): string {
  let out = '';
  let state = 2166136261;
  for (let chunk = 0; chunk < 8; chunk++) {
    let h = state;
    for (let i = 0; i < input.length; i++) {
      h = Math.imul(h ^ (input.charCodeAt(i) + chunk * 31), 16777619);
    }
    h = h ^ (h >>> 13);
    out += (h >>> 0).toString(16).padStart(8, '0');
    state = Math.imul(state ^ (h >>> 0), 3432918353) >>> 0;
  }
  return out;
}

const growthPlan = planOf('growth');
const proPlan = planOf('pro');
const essentialPlan = planOf('essential');

const users: Prisma.UserCreateManyInput[] = [
  {
    id: 'usr_central',
    email: 'central@miriads.com',
    name: 'Mirí Central',
    phone: '+51 900 000 001',
    role: 'MIRI_CENTRAL',
  },
  {
    id: 'usr_admin_lima',
    email: 'admin.lima@miriads.com',
    name: 'Carla Rojas',
    phone: '+51 900 000 002',
    role: 'CITY_ADMIN',
  },
  {
    id: 'usr_ana',
    email: 'ana.torres@miriads.com',
    name: 'Ana Torres',
    phone: '+51 987 111 222',
    role: 'CREW',
  },
  {
    id: 'usr_luis',
    email: 'luis.paredes@miriads.com',
    name: 'Luis Paredes',
    phone: '+51 987 333 444',
    role: 'CREW',
  },
  {
    id: 'usr_sofia',
    email: 'sofia.mena@miriads.com',
    name: 'Sofía Mena',
    phone: '+51 987 555 666',
    role: 'CREW',
  },
  {
    id: 'usr_campo',
    email: 'hola@estudiocampo.pe',
    name: 'Estudio Campo',
    phone: '+51 999 123 456',
    role: 'CLIENT',
  },
  {
    id: 'usr_trigal',
    email: 'compras@panaderiaeltrigal.com',
    name: 'Panadería El Trigal',
    phone: '+51 987 654 321',
    role: 'CLIENT',
  },
];

const cities: Prisma.CityCreateManyInput[] = [
  {
    id: 'city_lima',
    name: 'Lima',
    country: 'Perú',
    slug: 'lima',
    timezone: 'America/Lima',
    lat: -12.0464,
    lng: -77.0428,
    adminId: 'usr_admin_lima',
  },
  {
    id: 'city_cdmx',
    name: 'Ciudad de México',
    country: 'México',
    slug: 'ciudad-de-mexico',
    timezone: 'America/Mexico_City',
    lat: 19.4326,
    lng: -99.1332,
  },
  {
    id: 'city_bog',
    name: 'Bogotá',
    country: 'Colombia',
    slug: 'bogota',
    timezone: 'America/Bogota',
    lat: 4.711,
    lng: -74.0721,
  },
];

const crews: Prisma.CrewProfileCreateManyInput[] = [
  {
    id: 'crew_ana',
    handle: '@anatorres',
    status: 'AVAILABLE',
    bio: 'Reparto de Miraflores: volanteo y pegado de cartel de calle.',
    rating: 4.9,
    routesCompleted: 47,
    stopsCompleted: 612,
    score: 3820,
    joinedAt: monthsAgo(5),
    userId: 'usr_ana',
    cityId: 'city_lima',
  },
  {
    id: 'crew_luis',
    handle: '@luisparedes',
    status: 'ACTIVE',
    bio: 'Especialista en pegado de gran formato en Barranco y Bajada de Baños.',
    rating: 4.7,
    routesCompleted: 31,
    stopsCompleted: 428,
    score: 2610,
    joinedAt: monthsAgo(9),
    userId: 'usr_luis',
    cityId: 'city_lima',
  },
  {
    id: 'crew_sofia',
    handle: '@sofiamena',
    status: 'AVAILABLE',
    bio: 'Cobertura peatonal en San Isidro y Lince en horario de oficinas.',
    rating: 4.8,
    routesCompleted: 39,
    stopsCompleted: 501,
    score: 3150,
    joinedAt: monthsAgo(7),
    userId: 'usr_sofia',
    cityId: 'city_lima',
  },
];

const scores: Prisma.CrewScoreCreateManyInput[] = [
  {
    id: 'score_ana_01',
    crewId: 'crew_ana',
    awardedById: 'usr_admin_lima',
    points: 480,
    reason: 'Ruta LIM-042 cerrada con evidencias GPS al 100%',
    createdAt: addDays(now, -1),
  },
  {
    id: 'score_ana_02',
    crewId: 'crew_ana',
    awardedById: 'usr_admin_lima',
    points: 250,
    reason: 'Nueve evidencias aprobadas sin observaciones',
    createdAt: addDays(now, -2),
  },
  {
    id: 'score_ana_03',
    crewId: 'crew_ana',
    awardedById: 'usr_central',
    points: 310,
    reason: 'Semana completa sin paradas rechazadas',
    createdAt: addDays(now, -4),
  },
  {
    id: 'score_luis_01',
    crewId: 'crew_luis',
    awardedById: 'usr_admin_lima',
    points: 320,
    reason: 'Ruta LIM-043 iniciada con trazabilidad completa',
    createdAt: addDays(now, -1),
  },
  {
    id: 'score_luis_02',
    crewId: 'crew_luis',
    awardedById: 'usr_admin_lima',
    points: 180,
    reason: 'Devolución de insumos registrada a tiempo',
    createdAt: addDays(now, -3),
  },
  {
    id: 'score_luis_03',
    crewId: 'crew_luis',
    awardedById: 'usr_central',
    points: 140,
    reason: 'Cobertura ampliada hacia Barranco alto',
    createdAt: addDays(now, -6),
  },
  {
    id: 'score_sofia_01',
    crewId: 'crew_sofia',
    awardedById: 'usr_admin_lima',
    points: 260,
    reason: 'Cobertura de tres distritos en un solo día',
    createdAt: addDays(now, -2),
  },
  {
    id: 'score_sofia_02',
    crewId: 'crew_sofia',
    awardedById: 'usr_central',
    points: 190,
    reason: 'Alta en la ruta LIM-044 sin incidencias',
    createdAt: addDays(now, -5),
  },
];

const campoPaidAt = addDays(now, -12);
const trigalPaidAt = addDays(now, -3);

const orders: Prisma.OrderCreateManyInput[] = [
  {
    id: 'ord_campo_growth_annual',
    reference: 'MIRI-CAMPO-001',
    tier: 'GROWTH',
    cadence: 'ANNUAL',
    amountCents: growthPlan.price.annual * 100,
    currency: 'USD',
    status: 'PAID',
    planSnapshot: json(growthPlan),
    clientName: 'Estudio Campo',
    clientEmail: 'hola@estudiocampo.pe',
    clientPhone: '+51 999 123 456',
    clientCompany: 'Estudio Campo',
    mpPreferenceId: 'demo-pref-1001',
    mpPaymentId: 'mp_demo_1001',
    paidAt: campoPaidAt,
    createdAt: addDays(now, -15),
    clientId: 'usr_campo',
  },
  {
    id: 'ord_trigal_pro_monthly',
    reference: 'MIRI-TRIGAL-001',
    tier: 'PRO',
    cadence: 'MONTHLY',
    amountCents: proPlan.price.monthly * 100,
    currency: 'USD',
    status: 'PAID',
    planSnapshot: json(proPlan),
    clientName: 'Panadería El Trigal',
    clientEmail: 'compras@panaderiaeltrigal.com',
    clientPhone: '+51 987 654 321',
    clientCompany: 'Panadería El Trigal',
    mpPreferenceId: 'demo-pref-1002',
    mpPaymentId: 'mp_demo_1002',
    paidAt: trigalPaidAt,
    createdAt: addDays(now, -5),
    clientId: 'usr_trigal',
  },
  {
    id: 'ord_campo_essential_monthly',
    reference: 'MIRI-CAMPO-002',
    tier: 'ESSENTIAL',
    cadence: 'MONTHLY',
    amountCents: essentialPlan.price.monthly * 100,
    currency: 'USD',
    status: 'PENDING',
    planSnapshot: json(essentialPlan),
    clientName: 'Estudio Campo',
    clientEmail: 'hola@estudiocampo.pe',
    clientPhone: '+51 999 123 456',
    clientCompany: 'Estudio Campo',
    mpPreferenceId: 'demo-pref-pending',
    createdAt: addDays(now, -2),
    clientId: 'usr_campo',
  },
  {
    id: 'ord_campo_pro_quarterly',
    reference: 'MIRI-CAMPO-003',
    tier: 'PRO',
    cadence: 'QUARTERLY',
    amountCents: proPlan.price.quarterly * 100,
    currency: 'USD',
    status: 'REJECTED',
    planSnapshot: json(proPlan),
    clientName: 'Estudio Campo',
    clientEmail: 'hola@estudiocampo.pe',
    clientPhone: '+51 999 123 456',
    clientCompany: 'Estudio Campo',
    mpPreferenceId: 'demo-pref-1004',
    createdAt: addDays(now, -6),
    clientId: 'usr_campo',
  },
];

const payments: Prisma.PaymentCreateManyInput[] = [
  {
    id: 'pay_1001',
    provider: 'MERCADOPAGO',
    status: 'APPROVED',
    amountCents: growthPlan.price.annual * 100,
    currency: 'USD',
    externalId: 'mp_demo_1001',
    raw: { init_point: 'https://sandbox.mercadopago.com/checkout/demo-1001', type: 'payment' },
    createdAt: campoPaidAt,
    orderId: 'ord_campo_growth_annual',
  },
  {
    id: 'pay_1002',
    provider: 'MERCADOPAGO',
    status: 'APPROVED',
    amountCents: proPlan.price.monthly * 100,
    currency: 'USD',
    externalId: 'mp_demo_1002',
    raw: { init_point: 'https://sandbox.mercadopago.com/checkout/demo-1002', type: 'payment' },
    createdAt: trigalPaidAt,
    orderId: 'ord_trigal_pro_monthly',
  },
  {
    id: 'pay_1004',
    provider: 'MERCADOPAGO',
    status: 'REJECTED',
    amountCents: proPlan.price.quarterly * 100,
    currency: 'USD',
    externalId: 'mp_demo_1004',
    raw: { status_detail: 'cc_rejected_other_reason', type: 'payment' },
    createdAt: addDays(now, -6),
    orderId: 'ord_campo_pro_quarterly',
  },
];

const campaigns: Prisma.CampaignCreateManyInput[] = [
  {
    id: 'cmp_campo_q4',
    name: 'Lanzamiento Estudio Campo — Q4',
    status: 'ACTIVE',
    startsAt: campoPaidAt,
    endsAt: addDays(campoPaidAt, 90),
    orderId: 'ord_campo_growth_annual',
    clientId: 'usr_campo',
    cityId: 'city_lima',
  },
  {
    id: 'cmp_trigal_diario',
    name: 'Panadería El Trigal — Presencia diaria',
    status: 'ACTIVE',
    startsAt: trigalPaidAt,
    endsAt: addDays(trigalPaidAt, 30),
    orderId: 'ord_trigal_pro_monthly',
    clientId: 'usr_trigal',
    cityId: 'city_lima',
  },
];

const deliverables: Prisma.DeliverableCreateManyInput[] = [
  {
    id: 'dlv_campo_calendario',
    campaignId: 'cmp_campo_q4',
    type: 'CALENDAR',
    title: 'Calendario editorial Q4 — Estudio Campo',
    status: 'APPROVED',
    dueAt: addDays(now, -4),
    deliveredAt: addDays(now, -5),
    assetUrl: '/evidences/static-01.svg',
    content: {
      periodo: 'Octubre — Diciembre',
      piezas: 16,
      canales: ['Instagram', 'Meta Ads', 'LinkedIn'],
      paleta: { principal: '#2FE6C8', texto: '#05070A', fondo: '#FAFAFA' },
      semanas: ['Semana 41', 'Semana 42', 'Semana 43'],
    },
    notes: 'Calendario aprobado con 16 piezas para octubre y noviembre.',
  },
  {
    id: 'dlv_campo_estatica_1',
    campaignId: 'cmp_campo_q4',
    type: 'STATIC_IMAGE',
    title: 'Pieza estática — Portafolio de otoño',
    status: 'DELIVERED',
    dueAt: addDays(now, -1),
    deliveredAt: addDays(now, -1),
    assetUrl: '/evidences/static-01.svg',
    content: {
      formato: '1080×1080',
      copy: 'Tu próximo proyecto empieza con una idea bien pegada.',
      canales: ['Instagram', 'Meta Ads'],
      variantes: ['Claro', 'Oscuro'],
    },
    notes: 'Falta la aprobación final del cliente.',
  },
  {
    id: 'dlv_campo_copy',
    campaignId: 'cmp_campo_q4',
    type: 'COPY',
    title: 'Copy campaña — Historias de clientes',
    status: 'APPROVED',
    dueAt: addDays(now, -3),
    deliveredAt: addDays(now, -3),
    assetUrl: null,
    content: {
      texto: 'Este otoño, Estudio Campo lanza su nueva colección. Reserva hoy y recibe una consulta gratuita.',
      canal: 'Instagram',
      tono: 'Cercano y directo',
      caracteres: 128,
    },
  },
  {
    id: 'dlv_campo_reel',
    campaignId: 'cmp_campo_q4',
    type: 'MOTION_VIDEO',
    title: 'Reel 15s — Detrás de cámaras',
    status: 'IN_PROGRESS',
    dueAt: addDays(now, 3),
    deliveredAt: null,
    assetUrl: null,
    content: {
      duracionSeg: 15,
      formato: 'MP4 1080×1350',
      soundtrack: 'Beat minimal urbano',
      escenas: 3,
      estado: 'Animación en curso',
    },
  },
  {
    id: 'dlv_campo_spot',
    campaignId: 'cmp_campo_q4',
    type: 'VIDEO_AD',
    title: 'Spot 30s — Prueba social',
    status: 'PENDING',
    dueAt: addDays(now, 6),
    deliveredAt: null,
    assetUrl: null,
    content: {
      duracionSeg: 30,
      objetivo: 'Generación de leads',
      variaciones: ['A — Testimonio', 'B — Portafolio rápido'],
      cta: 'Agenda tu llamada',
    },
    notes: 'Brief confirmado; pendiente sesión de grabación.',
  },
  {
    id: 'dlv_campo_reporte',
    campaignId: 'cmp_campo_q4',
    type: 'PAID_MEDIA_REPORT',
    title: 'Reporte de pauta — Semana 1',
    status: 'PENDING',
    dueAt: addDays(now, 4),
    deliveredAt: null,
    assetUrl: null,
    content: {
      periodo: 'Semana 1',
      canales: ['Meta Ads', 'Google Ads'],
      presupuestoUSD: 450,
      kpis: ['CTR', 'CPC', 'Leads'],
    },
  },
  {
    id: 'dlv_campo_estatica_2',
    campaignId: 'cmp_campo_q4',
    type: 'STATIC_IMAGE',
    title: 'Pieza estática — CTA agendamiento',
    status: 'DELIVERED',
    dueAt: addDays(now, -2),
    deliveredAt: addDays(now, -2),
    assetUrl: '/evidences/static-01.svg',
    content: {
      formato: '1080×1080',
      copy: 'Agenda hoy. Espacios limitados.',
      canales: ['Instagram Stories'],
    },
  },
  {
    id: 'dlv_trigal_calendario',
    campaignId: 'cmp_trigal_diario',
    type: 'CALENDAR',
    title: 'Calendario diario — El Trigal',
    status: 'APPROVED',
    dueAt: addDays(now, -2),
    deliveredAt: addDays(now, -2),
    assetUrl: '/evidences/static-01.svg',
    content: {
      periodo: 'Mes en curso',
      piezas: 20,
      canales: ['Instagram', 'TikTok'],
      paleta: { principal: '#2FE6C8', texto: '#05070A', fondo: '#FAFAFA' },
    },
  },
  {
    id: 'dlv_trigal_estatica',
    campaignId: 'cmp_trigal_diario',
    type: 'STATIC_IMAGE',
    title: 'Pieza estática — Pan recién horneado',
    status: 'DELIVERED',
    dueAt: addDays(now, -1),
    deliveredAt: addDays(now, -1),
    assetUrl: '/evidences/static-01.svg',
    content: {
      formato: '1080×1080',
      copy: 'A las 6 a.m. ya huele a domingo.',
      canales: ['Instagram'],
    },
  },
  {
    id: 'dlv_trigal_copy',
    campaignId: 'cmp_trigal_diario',
    type: 'COPY',
    title: 'Copy diario — Apertura de tienda',
    status: 'IN_PROGRESS',
    dueAt: addDays(now, 2),
    deliveredAt: null,
    assetUrl: null,
    content: {
      texto: 'El Trigal amanece con pan caliente y café de especialidad.',
      canal: 'Instagram',
      tono: 'Cálido',
      caracteres: 74,
    },
  },
  {
    id: 'dlv_trigal_reel',
    campaignId: 'cmp_trigal_diario',
    type: 'MOTION_VIDEO',
    title: 'Reel 10s — Horno de las 5 a.m.',
    status: 'PENDING',
    dueAt: addDays(now, 5),
    deliveredAt: null,
    assetUrl: null,
    content: {
      duracionSeg: 10,
      formato: 'MP4 1080×1920',
      escenas: 2,
      cta: 'Visítanos hoy',
    },
  },
];

const staticPoints: Prisma.StaticPointCreateManyInput[] = [
  {
    id: 'sp_larco',
    name: 'Mural Av. Larco 780',
    address: 'Av. Larco 780, Miraflores, Lima',
    lat: -12.1215,
    lng: -77.03,
    partnerName: 'Café Tostado',
    surface: 'Fachada 4×3 m',
    status: 'ACTIVE',
    notes: 'Muro visible desde la esquina del parque; buena iluminación nocturna.',
    cityId: 'city_lima',
  },
  {
    id: 'sp_banos',
    name: 'Muro Bajada de Baños 165',
    address: 'Bajada de Baños 165, Barranco, Lima',
    lat: -12.1437,
    lng: -77.0213,
    partnerName: 'Librería El Epicentro',
    surface: 'Muro exterior 3×2.5 m',
    status: 'ACTIVE',
    notes: 'Alta afluencia de turistas y ciclistas los fines de semana.',
    cityId: 'city_lima',
  },
  {
    id: 'sp_conquistadores',
    name: 'Vitrina Conquistadores 1245',
    address: 'Av. Conquistadores 1245, San Isidro, Lima',
    lat: -12.0975,
    lng: -77.036,
    partnerName: 'Restaurante La Divina',
    surface: 'Vitrina 1.5×1 m',
    status: 'PROPOSED',
    notes: 'Pendiente contrato de exclusividad por seis meses.',
    cityId: 'city_lima',
  },
  {
    id: 'sp_mexico',
    name: 'Esquina Av. México 1450',
    address: 'Av. México 1450, Lince, Lima',
    lat: -12.0872,
    lng: -77.0452,
    partnerName: 'Bodega Don Pepe',
    surface: 'Esquina 4×3 m',
    status: 'ACTIVE',
    notes: 'Doble frente: calle y avenida.',
    cityId: 'city_lima',
  },
  {
    id: 'sp_palos',
    name: 'Muro Av. Palos de la Frontera 3050',
    address: 'Av. Palos de la Frontera 3050, Santiago de Surco, Lima',
    lat: -12.1405,
    lng: -77.0092,
    partnerName: 'Peluquería Estilo Surco',
    surface: 'Fachada 5×3 m',
    status: 'PAUSED',
    notes: 'Pausado por refachado de la edificación.',
    cityId: 'city_lima',
  },
  {
    id: 'sp_union',
    name: 'Jirón de la Unión 345',
    address: 'Jirón de la Unión 345, Centro Histórico, Lima',
    lat: -12.0467,
    lng: -77.034,
    partnerName: 'Zapatería Bata',
    surface: 'Fachada 3×2 m',
    status: 'PROPOSED',
    notes: 'Zona peatonal con permiso municipal pendiente.',
    cityId: 'city_lima',
  },
];

const zones: Prisma.AllowedZoneCreateManyInput[] = [
  {
    id: 'zone_miraflores',
    name: 'Zona Miraflores — Residencial',
    status: 'ACTIVE',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [-77.04, -12.112],
          [-77.025, -12.112],
          [-77.025, -12.13],
          [-77.04, -12.13],
          [-77.04, -12.112],
        ],
      ],
    },
    notes: 'Corredor residencial con permiso de volanteo de lunes a sábado.',
    cityId: 'city_lima',
  },
  {
    id: 'zone_barranco',
    name: 'Zona Barranco — Centro',
    status: 'PROPOSED',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [-77.026, -12.138],
          [-77.015, -12.138],
          [-77.015, -12.15],
          [-77.026, -12.15],
          [-77.026, -12.138],
        ],
      ],
    },
    notes: 'Pendiente acuerdo con la municipalidad para zonas peatonales.',
    cityId: 'city_lima',
  },
];

const cycles: Prisma.BatchCycleCreateManyInput[] = [
  {
    id: 'cyc_lima_current',
    weekStart,
    weekEnd,
    phase: 'DEPLOYMENT',
    printDate,
    distributeDate,
    notes: 'Impresión el sábado y reparto el domingo; foco en Miraflores y Barranco con 3 rutas.',
    cityId: 'city_lima',
  },
  {
    id: 'cyc_lima_prev',
    weekStart: prevWeekStart,
    weekEnd: prevWeekEnd,
    phase: 'CLOSING',
    printDate: addDays(prevWeekStart, 5),
    distributeDate: addDays(prevWeekStart, 6),
    notes: 'Cierre de la semana anterior: 2 rutas completadas y evidencias revisadas por la ciudad.',
    cityId: 'city_lima',
  },
];

const routes: Prisma.RouteCreateManyInput[] = [
  {
    id: 'rt_lima_042',
    code: 'LIM-042',
    name: 'Miraflores Centro — Av. Larco',
    date: completedDate,
    status: 'COMPLETED',
    distanceM: 4200,
    estimatedQty: 350,
    notes: 'Ruta cerrada con una parada no accesible por seguridad del edificio.',
    completedAt: atHour(completedDate, 13, 10),
    cycleId: 'cyc_lima_current',
    cityId: 'city_lima',
    crewId: 'crew_ana',
  },
  {
    id: 'rt_lima_043',
    code: 'LIM-043',
    name: 'Barranco — Bajada de Baños',
    date: inProgressDate,
    status: 'IN_PROGRESS',
    distanceM: 3600,
    estimatedQty: 280,
    notes: 'Recorrido en curso; dos paradas no autorizadas por comercios.',
    cycleId: 'cyc_lima_current',
    cityId: 'city_lima',
    crewId: 'crew_luis',
  },
  {
    id: 'rt_lima_044',
    code: 'LIM-044',
    name: 'San Isidro y Lince — Javier Prado',
    date: plannedDate,
    status: 'PLANNED',
    distanceM: 5100,
    estimatedQty: 300,
    notes: 'Pendiente asignar crew; zona de oficinas con alto flujo de 7 a.m. a 9 a.m.',
    cycleId: 'cyc_lima_current',
    cityId: 'city_lima',
  },
];

type StopSeed = {
  order: number;
  label: string;
  address: string;
  lat: number;
  lng: number;
  kind: 'FLYER' | 'PASTE' | 'STICKER';
  quantity: number;
  status: 'DONE' | 'PENDING' | 'MISSED';
  doneAt: Date | null;
  checkNote: string | null;
  evidence: null | {
    file: string;
    kind: 'PHOTO' | 'VIDEO';
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    rejectReason: string | null;
  };
};

function buildStops(
  prefix: string,
  routeId: string,
  uploaderId: string,
  campaignId: string | null,
  items: StopSeed[],
): { stops: Prisma.RouteStopCreateManyInput[]; evidences: Prisma.EvidenceCreateManyInput[] } {
  const stops: Prisma.RouteStopCreateManyInput[] = [];
  const evidences: Prisma.EvidenceCreateManyInput[] = [];
  const latOffsets = [0.0004, -0.0003, 0.0002, -0.0005];
  const lngOffsets = [-0.0003, 0.0004, -0.0005, 0.0002];
  for (const item of items) {
    const stopId = `stp_${prefix}_${String(item.order).padStart(2, '0')}`;
    stops.push({
      id: stopId,
      routeId,
      order: item.order,
      label: item.label,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      kind: item.kind,
      quantity: item.quantity,
      status: item.status,
      checkNote: item.checkNote,
      doneAt: item.doneAt,
    });
    if (!item.evidence || !item.doneAt) continue;
    const capturedAt = new Date(item.doneAt.getTime() + 60_000);
    const lat = Number((item.lat + latOffsets[item.order % 4]).toFixed(6));
    const lng = Number((item.lng + lngOffsets[item.order % 4]).toFixed(6));
    const accuracyM = Number((6.2 + (item.order % 5) * 2.7).toFixed(1));
    const reviewedAt =
      item.evidence.status === 'PENDING' ? null : new Date(capturedAt.getTime() + 2 * 3_600_000);
    evidences.push({
      id: `ev_${item.evidence.file}`,
      kind: item.evidence.kind,
      fileUrl: `/evidences/${item.evidence.file}.svg`,
      width: 640,
      height: 480,
      metadata: {
        gps: { lat, lng, accuracy: accuracyM },
        capturedAt: capturedAt.toISOString(),
        device: 'iPhone 15',
        hash: `sha256:${demoHash(`${stopId}:${item.evidence.file}`)}`,
        watermark: { text: 'Miri Ads · GPS verificado' },
      },
      lat,
      lng,
      accuracyM,
      capturedAt,
      status: item.evidence.status,
      rejectReason: item.evidence.rejectReason,
      reviewedAt,
      uploaderId,
      reviewerId: reviewedAt ? 'usr_admin_lima' : null,
      stopId,
      campaignId,
      createdAt: capturedAt,
    });
  }
  return { stops, evidences };
}

const routeA = buildStops('042', 'rt_lima_042', 'usr_ana', 'cmp_campo_q4', [
  {
    order: 1,
    label: 'Parque Kennedy — Av. Pardo',
    address: 'Av. Pardo 420, Miraflores, Lima',
    lat: -12.1177,
    lng: -77.0326,
    kind: 'FLYER',
    quantity: 60,
    status: 'DONE',
    doneAt: atHour(completedDate, 9, 15),
    checkNote: 'Entregado junto al parque; alto tránsito peatonal.',
    evidence: { file: 'miri-01', kind: 'PHOTO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 2,
    label: 'Av. Larco 780',
    address: 'Av. Larco 780, Miraflores, Lima',
    lat: -12.121,
    lng: -77.0305,
    kind: 'PASTE',
    quantity: 15,
    status: 'DONE',
    doneAt: atHour(completedDate, 9, 40),
    checkNote: 'Cartel pegado en muro lateral; superficie limpia y seca.',
    evidence: { file: 'miri-02', kind: 'PHOTO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 3,
    label: 'Av. La Marina 800',
    address: 'Av. La Marina 800, Miraflores, Lima',
    lat: -12.1136,
    lng: -77.0289,
    kind: 'FLYER',
    quantity: 55,
    status: 'DONE',
    doneAt: atHour(completedDate, 10, 5),
    checkNote: 'Reparto frente a la parada de buses.',
    evidence: { file: 'miri-03', kind: 'PHOTO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 4,
    label: 'Av. Larco 1120',
    address: 'Av. Larco 1120, Miraflores, Lima',
    lat: -12.1238,
    lng: -77.03,
    kind: 'STICKER',
    quantity: 25,
    status: 'DONE',
    doneAt: atHour(completedDate, 10, 30),
    checkNote: 'Sticker en puerta de comercio con autorización del dueño.',
    evidence: { file: 'miri-04', kind: 'PHOTO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 5,
    label: 'Av. Benavides 1250',
    address: 'Av. Benavides 1250, Miraflores, Lima',
    lat: -12.13,
    lng: -77.0304,
    kind: 'FLYER',
    quantity: 50,
    status: 'DONE',
    doneAt: atHour(completedDate, 10, 55),
    checkNote: 'Entregado en esquina; sin incidencias.',
    evidence: { file: 'miri-05', kind: 'VIDEO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 6,
    label: 'Calle Berlín 500',
    address: 'Calle Berlín 500, Miraflores, Lima',
    lat: -12.1196,
    lng: -77.0351,
    kind: 'PASTE',
    quantity: 12,
    status: 'DONE',
    doneAt: atHour(completedDate, 11, 20),
    checkNote: 'Muro de callejón; se limpió el área antes de pegar.',
    evidence: { file: 'miri-06', kind: 'PHOTO', status: 'PENDING', rejectReason: null },
  },
  {
    order: 7,
    label: 'Av. Reducto 460',
    address: 'Av. Reducto 460, Miraflores, Lima',
    lat: -12.1162,
    lng: -77.0355,
    kind: 'STICKER',
    quantity: 30,
    status: 'DONE',
    doneAt: atHour(completedDate, 11, 45),
    checkNote: 'Vinil adherido en vidrio de vitrina.',
    evidence: { file: 'miri-07', kind: 'PHOTO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 8,
    label: 'Av. Petit Thouars 4400',
    address: 'Av. Petit Thouars 4400, Miraflores, Lima',
    lat: -12.1087,
    lng: -77.0347,
    kind: 'FLYER',
    quantity: 45,
    status: 'DONE',
    doneAt: atHour(completedDate, 12, 10),
    checkNote: 'Reparto en el ingreso de un edificio residencial.',
    evidence: { file: 'miri-08', kind: 'PHOTO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 9,
    label: 'Av. La Marina 1300',
    address: 'Av. La Marina 1300, Miraflores, Lima',
    lat: -12.1101,
    lng: -77.0283,
    kind: 'FLYER',
    quantity: 40,
    status: 'MISSED',
    doneAt: null,
    checkNote: 'Acceso restringido por seguridad del edificio.',
    evidence: null,
  },
  {
    order: 10,
    label: 'Av. El Bosque 900',
    address: 'Av. El Bosque 900, Miraflores, Lima',
    lat: -12.1117,
    lng: -77.037,
    kind: 'PASTE',
    quantity: 10,
    status: 'DONE',
    doneAt: atHour(completedDate, 12, 35),
    checkNote: 'Cartel en muro de parking; superficie irregular.',
    evidence: {
      file: 'miri-09',
      kind: 'PHOTO',
      status: 'REJECTED',
      rejectReason: 'La foto no muestra el cartel completo; falta el borde inferior.',
    },
  },
]);

const routeB = buildStops('043', 'rt_lima_043', 'usr_luis', 'cmp_trigal_diario', [
  {
    order: 1,
    label: 'Bajada de Baños 165',
    address: 'Bajada de Baños 165, Barranco, Lima',
    lat: -12.1437,
    lng: -77.0213,
    kind: 'PASTE',
    quantity: 12,
    status: 'DONE',
    doneAt: atHour(inProgressDate, 10, 10),
    checkNote: 'Cartel pegado en muro de la librería; autorización del socio.',
    evidence: { file: 'miri-10', kind: 'PHOTO', status: 'APPROVED', rejectReason: null },
  },
  {
    order: 2,
    label: 'Av. Pedro de Osma 240',
    address: 'Av. Pedro de Osma 240, Barranco, Lima',
    lat: -12.146,
    lng: -77.0195,
    kind: 'FLYER',
    quantity: 50,
    status: 'DONE',
    doneAt: atHour(inProgressDate, 10, 45),
    checkNote: 'Reparto frente al museo; flujo alto de visitantes.',
    evidence: { file: 'miri-11', kind: 'PHOTO', status: 'PENDING', rejectReason: null },
  },
  {
    order: 3,
    label: 'Plaza de Armas de Barranco',
    address: 'Plaza de Armas de Barranco, Lima',
    lat: -12.1462,
    lng: -77.0217,
    kind: 'FLYER',
    quantity: 45,
    status: 'DONE',
    doneAt: atHour(inProgressDate, 11, 20),
    checkNote: 'Distribución en la plaza; público familiar.',
    evidence: {
      file: 'miri-12',
      kind: 'PHOTO',
      status: 'REJECTED',
      rejectReason: 'La foto está movida y no se lee el mensaje del cartel.',
    },
  },
  {
    order: 4,
    label: 'Puente de los Suspiros',
    address: 'Puente de los Suspiros, Barranco, Lima',
    lat: -12.1446,
    lng: -77.0196,
    kind: 'STICKER',
    quantity: 20,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 5,
    label: 'Jr. Manuel Arosemena 180',
    address: 'Jr. Manuel Arosemena 180, Barranco, Lima',
    lat: -12.1455,
    lng: -77.0235,
    kind: 'FLYER',
    quantity: 40,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 6,
    label: 'Av. Sáenz Peña 360',
    address: 'Av. Sáenz Peña 360, Barranco, Lima',
    lat: -12.1451,
    lng: -77.0263,
    kind: 'PASTE',
    quantity: 10,
    status: 'MISSED',
    doneAt: null,
    checkNote: 'Muro con mural comunitario; se respetó el arte urbano.',
    evidence: null,
  },
  {
    order: 7,
    label: 'Av. San Martín 450',
    address: 'Av. San Martín 450, Barranco, Lima',
    lat: -12.1429,
    lng: -77.028,
    kind: 'FLYER',
    quantity: 35,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 8,
    label: 'Jr. Centenario 90',
    address: 'Jr. Centenario 90, Barranco, Lima',
    lat: -12.1457,
    lng: -77.0247,
    kind: 'STICKER',
    quantity: 25,
    status: 'MISSED',
    doneAt: null,
    checkNote: 'Comercio cerrado durante el recorrido.',
    evidence: null,
  },
  {
    order: 9,
    label: 'Bajada de Baños 400',
    address: 'Bajada de Baños 400, Barranco, Lima',
    lat: -12.1467,
    lng: -77.019,
    kind: 'FLYER',
    quantity: 30,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
]);

const routeC = buildStops('044', 'rt_lima_044', 'usr_sofia', null, [
  {
    order: 1,
    label: 'Av. Conquistadores 1245',
    address: 'Av. Conquistadores 1245, San Isidro, Lima',
    lat: -12.0975,
    lng: -77.036,
    kind: 'PASTE',
    quantity: 15,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 2,
    label: 'Av. Javier Prado Este 3100',
    address: 'Av. Javier Prado Este 3100, San Isidro, Lima',
    lat: -12.0957,
    lng: -77.047,
    kind: 'FLYER',
    quantity: 50,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 3,
    label: 'Av. Carlos Isola 1600',
    address: 'Av. Carlos Isola 1600, San Isidro, Lima',
    lat: -12.1006,
    lng: -77.04,
    kind: 'FLYER',
    quantity: 45,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 4,
    label: 'Av. Camino Real 1350',
    address: 'Av. Camino Real 1350, San Isidro, Lima',
    lat: -12.1024,
    lng: -77.0407,
    kind: 'STICKER',
    quantity: 25,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 5,
    label: 'Av. Gregorio Escobedo 560',
    address: 'Av. Gregorio Escobedo 560, Lince, Lima',
    lat: -12.0798,
    lng: -77.0503,
    kind: 'FLYER',
    quantity: 40,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 6,
    label: 'Av. México 1500',
    address: 'Av. México 1500, Lince, Lima',
    lat: -12.0872,
    lng: -77.0452,
    kind: 'PASTE',
    quantity: 12,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 7,
    label: 'Av. Jaime Baca Pinto 400',
    address: 'Av. Jaime Baca Pinto 400, Lince, Lima',
    lat: -12.0841,
    lng: -77.0437,
    kind: 'FLYER',
    quantity: 40,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 8,
    label: 'Av. Rafael Escardó 700',
    address: 'Av. Rafael Escardó 700, San Isidro, Lima',
    lat: -12.0958,
    lng: -77.0368,
    kind: 'STICKER',
    quantity: 30,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
  {
    order: 9,
    label: 'Av. Petit Thouars 5000',
    address: 'Av. Petit Thouars 5000, San Isidro, Lima',
    lat: -12.103,
    lng: -77.037,
    kind: 'FLYER',
    quantity: 35,
    status: 'PENDING',
    doneAt: null,
    checkNote: null,
    evidence: null,
  },
]);

const staticCapturedAt = atHour(addDays(now, -1), 16, 5);

const staticEvidences: Prisma.EvidenceCreateManyInput[] = [
  {
    id: 'ev_static_01',
    kind: 'PHOTO',
    fileUrl: '/evidences/static-01.svg',
    width: 640,
    height: 480,
    metadata: {
      gps: { lat: -12.1215, lng: -77.03, accuracy: 5.8 },
      capturedAt: staticCapturedAt.toISOString(),
      device: 'iPhone 15',
      hash: `sha256:${demoHash('sp_larco:static-01')}`,
      watermark: { text: 'Miri Ads · GPS verificado' },
    },
    lat: -12.1215,
    lng: -77.03,
    accuracyM: 5.8,
    capturedAt: staticCapturedAt,
    status: 'APPROVED',
    reviewedAt: new Date(staticCapturedAt.getTime() + 2 * 3_600_000),
    uploaderId: 'usr_admin_lima',
    reviewerId: 'usr_central',
    staticPointId: 'sp_larco',
    createdAt: staticCapturedAt,
  },
];

const supplies: Prisma.SupplyItemCreateManyInput[] = [
  { id: 'sup_afiche', name: 'Afiche Bond A4', unit: 'un', stock: 1240, minStock: 300, cityId: 'city_lima' },
  { id: 'sup_volante', name: 'Volante 1/8', unit: 'un', stock: 4580, minStock: 1000, cityId: 'city_lima' },
  { id: 'sup_sticker', name: 'Sticker 10×10', unit: 'un', stock: 1820, minStock: 400, cityId: 'city_lima' },
  { id: 'sup_pegamento', name: 'Pegamento en barra', unit: 'un', stock: 46, minStock: 20, cityId: 'city_lima' },
];

const assignments: Prisma.SupplyAssignmentCreateManyInput[] = [
  {
    id: 'sa_ana_volante',
    cycleId: 'cyc_lima_current',
    crewId: 'crew_ana',
    supplyId: 'sup_volante',
    quantity: 500,
    returned: 120,
    notes: 'Sobrantes devueltos tras la ruta LIM-042.',
    createdAt: printDate,
  },
  {
    id: 'sa_ana_pegamento',
    cycleId: 'cyc_lima_current',
    crewId: 'crew_ana',
    supplyId: 'sup_pegamento',
    quantity: 20,
    returned: 16,
    notes: 'Cuatro barras gastadas en pegado de cartel.',
    createdAt: printDate,
  },
  {
    id: 'sa_luis_sticker',
    cycleId: 'cyc_lima_current',
    crewId: 'crew_luis',
    supplyId: 'sup_sticker',
    quantity: 250,
    returned: 40,
    notes: 'Insumos para la ruta LIM-043 en Barranco.',
    createdAt: printDate,
  },
];

const stopRows = [...routeA.stops, ...routeB.stops, ...routeC.stops];
const evidenceRows = [...routeA.evidences, ...routeB.evidences, ...routeC.evidences, ...staticEvidences];

async function main(): Promise<void> {
  await db.$transaction([
    db.evidence.deleteMany({}),
    db.routeStop.deleteMany({}),
    db.route.deleteMany({}),
    db.supplyAssignment.deleteMany({}),
    db.supplyItem.deleteMany({}),
    db.allowedZone.deleteMany({}),
    db.staticPoint.deleteMany({}),
    db.batchCycle.deleteMany({}),
    db.deliverable.deleteMany({}),
    db.campaign.deleteMany({}),
    db.payment.deleteMany({}),
    db.order.deleteMany({}),
    db.crewScore.deleteMany({}),
    db.crewProfile.deleteMany({}),
    db.user.deleteMany({}),
    db.city.deleteMany({}),
  ]);

  await db.$transaction([
    db.user.createMany({ data: users }),
    db.city.createMany({ data: cities }),
    db.crewProfile.createMany({ data: crews }),
    db.crewScore.createMany({ data: scores }),
    db.order.createMany({ data: orders }),
    db.payment.createMany({ data: payments }),
    db.campaign.createMany({ data: campaigns }),
    db.deliverable.createMany({ data: deliverables }),
    db.staticPoint.createMany({ data: staticPoints }),
    db.allowedZone.createMany({ data: zones }),
    db.batchCycle.createMany({ data: cycles }),
    db.route.createMany({ data: routes }),
    db.routeStop.createMany({ data: stopRows }),
    db.evidence.createMany({ data: evidenceRows }),
    db.supplyItem.createMany({ data: supplies }),
    db.supplyAssignment.createMany({ data: assignments }),
  ]);

  console.log('Seed completado:', {
    cities: cities.length,
    users: users.length,
    crews: crews.length,
    orders: orders.length,
    payments: payments.length,
    campaigns: campaigns.length,
    deliverables: deliverables.length,
    staticPoints: staticPoints.length,
    zones: zones.length,
    cycles: cycles.length,
    routes: routes.length,
    stops: stopRows.length,
    evidences: evidenceRows.length,
    supplies: supplies.length,
    assignments: assignments.length,
    scores: scores.length,
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
