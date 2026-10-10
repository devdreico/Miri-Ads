# Miri Ads

Plataforma phygital de publicidad: packs digitales + red física uberizada con evidencia geolocalizada (GPS + foto EXIF), panel de Administrador de Ciudad y app Miri Crew.

## Stack

- Next.js 16 (App Router, Cache Components, Partial Prerendering)
- React 19 · TypeScript · Tailwind v4
- Prisma 6 + PostgreSQL 16
- three / R3F / drei / postprocessing (globo 3D)
- GSAP ScrollTrigger + Lenis (scroll cinematográfico)
- Leaflet (mapas admin)
- MercadoPago (modo demo sin token; sandbox con `MP_ACCESS_TOKEN`)

## Requisitos

- Node.js 20+
- Docker (para la base de datos)

## Arranque rápido

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Base de datos + migraciones + seed
npm run db:setup

# 3. Dependencias (si no están ya)
npm install

# 4. Desarrollo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script              | Descripción                                              |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                                    |
| `npm run build`     | Build de producción                                      |
| `npm run start`     | Servir el build de producción                            |
| `npm run lint`      | ESLint                                                   |
| `npm run typecheck` | `tsc --noEmit`                                           |
| `npm run db:up`     | Levanta Postgres en Docker (puerto 5433)                 |
| `npm run db:down`   | Detiene el contenedor                                    |
| `npm run db:setup`  | `db:up` + `generate` + `migrate deploy` + seed           |
| `npm run db:seed`   | Seed idempotente (ciudades, usuarios, rutas, evidencias) |
| `npm run db:studio` | Prisma Studio                                             |

## Rutas

| Ruta                  | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| `/`                   | Landing cinematográfica con globo 3D               |
| `/checkout/[tier]`    | Checkout MercadoPago (`starter`, `pro`, `growth`)  |
| `/checkout/estado/…`  | Estado del pago (pendiente / aprobado)             |
| `/admin`              | Dashboard del Administrador de Ciudad (KPIs)       |
| `/admin/evidencias`   | Revisión anti-fraude de evidencias GPS             |
| `/admin/rutas`        | Rutas, crews y paradas                             |
| `/admin/puntos`       | Puntos geolocalizados y zonas de cobertura         |
| `/admin/insumos`      | Stock y asignación de insumos                      |
| `/crew`               | App Miri Crew (jornada, paradas, evidencia)        |
| `/crew/ranking`       | Leaderboard semanal de crews                       |

## Usuarios demo

No hay autenticación real: la sesión se simula con la cookie `miri_demo_user`. El selector de usuario en el pie de cada panel cambia el rol activo.

| Rol           | Email                          |
| ------------- | ------------------------------ |
| City Admin    | `admin.lima@miriads.com`       |
| Central       | `central@miriads.com`          |
| Crew          | `ana.torres@miriads.com`       |
| Crew          | `sofia.mena@miriads.com`       |
| Crew          | `luis.paredes@miriads.com`     |

## MercadoPago

- Sin `MP_ACCESS_TOKEN`, el checkout corre en **modo demo**: simula la preferencia y el webhook, y la página de estado muestra "Pago confirmado" sin cobrar.
- Con token de sandbox en la variable, se crea preferencia real y el webhook `/api/webhooks/mercadopago` actualiza el estado de la orden.

```bash
# .env
MP_ACCESS_TOKEN="TEST-..."
MP_PUBLIC_BASE_URL="http://localhost:3000"
```

## Evidencias GPS

La crew sube foto + coordenadas a `POST /api/evidence`. El servidor valida:

1. EXIF GPS de la foto (si existe)
2. Distancia Haversine contra la parada asignada (umbral 200 m)
3. Hash SHA-256 anti-duplicado

Las evidencias quedan en `uploads/` (gitignored) y se sirven desde el panel admin.

## Seed

`npm run db:seed` es idempotente: crea 3 ciudades (Lima, Bogotá, CDMX), usuarios demo, 6 puntos estáticos, 2 zonas, 3 rutas (28 paradas), 13 evidencias SVG, 4 insumos y órdenes de ejemplo.

## Notas de arquitectura

- **Contratos compartidos**: `src/lib/palette.ts`, `src/lib/plans.ts`, `src/lib/format.ts`, `src/lib/db.ts`.
- **Escena**: `SceneBackdrop` monta el globo fijo `-z-20`; cada sección declara `data-scene-stage` (`hero`, `digital`, `physical`, `logistics`, `proof`, `crew`, `cta`) que `ScrollDirector` observa para interpolar la cámara.
- **Acciones server**: `src/lib/actions/admin.ts` y `src/lib/actions/crew.ts` (`'use server'` + `revalidatePath`).
- **Prisma**: workflow clásico con `migrate deploy` en setup; no se usa Introspection Engine de Prisma 8.
