import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma } from '@prisma/client';
import exifr from 'exifr';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { haversineMeters } from '@/components/admin/data';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

function errorJson(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function extensionOf(name: string, mime: string): string {
  const match = /\.([a-z0-9]{1,5})$/i.exec(name.trim());
  if (match?.[1]) return match[1].toLowerCase();
  const normalized = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  const found = Object.entries(MIME_BY_EXTENSION).find(([, type]) => type === normalized);
  return found ? found[0].slice(1) : 'bin';
}

interface ExifRead {
  lat: number | null;
  lng: number | null;
  capturedAt: Date | null;
}

async function readExif(buffer: Buffer, mime: string): Promise<ExifRead> {
  const result: ExifRead = { lat: null, lng: null, capturedAt: null };
  if (!mime.startsWith('image/')) return result;
  try {
    const parsed = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      gps: true,
      ifd0: {},
      xmp: false,
      iptc: false,
      translateKeys: true,
      reviveValues: true,
    });
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        result.lat = parsed.latitude;
        result.lng = parsed.longitude;
      }
      if (parsed.DateTimeOriginal instanceof Date) result.capturedAt = parsed.DateTimeOriginal;
      else if (parsed.CreateDate instanceof Date) result.capturedAt = parsed.CreateDate;
    }
  } catch {
    result.lat = null;
  }
  if (result.lat === null) {
    try {
      const gps = await exifr.gps(buffer);
      if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
        result.lat = gps.latitude;
        result.lng = gps.longitude;
      }
    } catch {
      result.lat = null;
    }
  }
  return result;
}

export async function POST(request: NextRequest): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorJson(400, 'El cuerpo de la petición no es un formulario válido.');
  }

  const fileValue = form.get('file');
  if (!fileValue || typeof fileValue === 'string') {
    return errorJson(400, 'Falta el archivo de evidencia.');
  }
  const file = fileValue;
  const mime = (file.type ?? '').toLowerCase().split(';')[0]?.trim() ?? '';
  if (!mime.startsWith('image/') && !mime.startsWith('video/')) {
    return errorJson(400, 'Solo se admiten imágenes o vídeos como evidencia.');
  }
  const maxMegabytes = Number(process.env.MAX_UPLOAD_MB ?? 25);
  const maxBytes = Number.isFinite(maxMegabytes) && maxMegabytes > 0 ? maxMegabytes * 1024 * 1024 : 25 * 1024 * 1024;
  if (file.size <= 0) return errorJson(400, 'El archivo está vacío.');
  if (file.size > maxBytes) {
    return errorJson(413, `El archivo supera el máximo de ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }

  const uploaderId = readString(form.get('uploaderId'));
  const stopId = readString(form.get('stopId'));
  const staticPointId = readString(form.get('staticPointId'));
  const latRaw = Number(readString(form.get('lat')));
  const lngRaw = Number(readString(form.get('lng')));
  const accuracyRaw = Number(readString(form.get('accuracy')));
  const capturedAtRaw = readString(form.get('capturedAt'));

  if (!uploaderId) return errorJson(400, 'Falta el identificador del usuario que sube la evidencia.');
  const uploader = await db.user.findUnique({ where: { id: uploaderId }, select: { id: true } });
  if (!uploader) return errorJson(404, 'El usuario que sube la evidencia no existe.');

  let stop: { id: string; lat: number; lng: number; status: string; route: { id: string; crewId: string | null } | null } | null = null;
  if (stopId) {
    const found = await db.routeStop.findUnique({
      where: { id: stopId },
      include: { route: { select: { id: true, crewId: true } } },
    });
    if (!found) return errorJson(404, 'La parada indicada no existe.');
    if (!found.route) return errorJson(400, 'La parada no está vinculada a una ruta.');
    stop = {
      id: found.id,
      lat: found.lat,
      lng: found.lng,
      status: found.status,
      route: found.route ? { id: found.route.id, crewId: found.route.crewId } : null,
    };
  } else if (!staticPointId) {
    return errorJson(400, 'Indica la parada o el punto estático de la evidencia.');
  }

  if (staticPointId) {
    const point = await db.staticPoint.findUnique({ where: { id: staticPointId }, select: { id: true } });
    if (!point) return errorJson(404, 'El punto estático indicado no existe.');
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const digest = createHash('sha256').update(buffer).digest('hex');
    const exif = await readExif(buffer, mime);

    const lat = exif.lat ?? latRaw;
    const lng = exif.lng ?? lngRaw;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return errorJson(400, 'Coordenadas GPS inválidas.');
    }

    const accuracyM = Number.isFinite(accuracyRaw) && accuracyRaw >= 0 ? accuracyRaw : null;
    const parsedCapture = capturedAtRaw ? new Date(capturedAtRaw) : null;
    const capturedAt =
      exif.capturedAt ?? (parsedCapture && !Number.isNaN(parsedCapture.getTime()) ? parsedCapture : new Date());

    const offRoute = stop ? haversineMeters(lat, lng, stop.lat, stop.lng) > 200 : false;
    const distance = stop ? Math.round(haversineMeters(lat, lng, stop.lat, stop.lng)) : null;
    const watermarkText = `Miri Ads · ${capturedAt.toISOString()} · ${lat.toFixed(6)}, ${lng.toFixed(6)}${
      accuracyM !== null ? ` · ±${Math.round(accuracyM)} m` : ''
    }${distance !== null ? ` · ${distance} m al punto` : ''}`;

    const uploadDir = UPLOAD_DIR;
    await mkdir(uploadDir, { recursive: true });
    const originalName = file.name ?? '';
    const slug = originalName.replace(/\.[^.]+$/, '').toLowerCase();
    const safeSlug =
      slug
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'evidencia';
    const extension = extensionOf(originalName, mime);
    const fileName = `${randomUUID()}-${safeSlug}.${extension}`;
    await writeFile(path.join(uploadDir, fileName), buffer);
    const fileUrl = `/api/evidence?file=${encodeURIComponent(fileName)}`;

    const device = request.headers.get('user-agent') ?? 'desconocido';
    const metadata = {
      gps: { lat, lng, accuracy: accuracyM },
      capturedAt: capturedAt.toISOString(),
      device,
      hash: `sha256:${digest}`,
      offRoute,
      distanceM: distance,
      watermark: { text: watermarkText },
    };

    const evidence = await db.evidence.create({
      data: {
        kind: mime.startsWith('video/') ? 'VIDEO' : 'PHOTO',
        fileUrl,
        metadata: metadata as unknown as Prisma.InputJsonValue,
        lat,
        lng,
        accuracyM,
        capturedAt,
        status: 'PENDING',
        uploaderId,
        stopId: stop?.id ?? null,
        staticPointId: staticPointId || null,
      },
      select: { id: true },
    });

    if (stop && stop.status !== 'DONE' && stop.route) {
      await db.routeStop.update({
        where: { id: stop.id },
        data: { status: 'DONE', doneAt: new Date() },
      });
      const ownCrew = await db.crewProfile.findUnique({ where: { userId: uploaderId }, select: { id: true } });
      const crewId = ownCrew?.id ?? stop.route.crewId;
      if (crewId) {
        await db.crewProfile.update({
          where: { id: crewId },
          data: { stopsCompleted: { increment: 1 }, score: { increment: offRoute ? 5 : 10 } },
        });
        await db.crewScore.create({
          data: {
            crewId,
            points: offRoute ? 5 : 10,
            reason: offRoute
              ? 'Stop completado fuera de ruta (+5)'
              : 'Stop completado con evidencia GPS',
          },
        });
      }
    }

    return Response.json({ ok: true, evidenceId: evidence.id, offRoute });
  } catch {
    return errorJson(500, 'No se pudo procesar la evidencia. Intenta nuevamente.');
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const fileName = request.nextUrl.searchParams.get('file');
  if (!fileName) return errorJson(400, 'Falta el nombre del archivo.');
  if (!/^[a-zA-Z0-9-]+\.[a-z0-9]{1,5}$/.test(fileName)) {
    return errorJson(400, 'Nombre de archivo no válido.');
  }
  const uploadDir = UPLOAD_DIR;
  try {
    const data = await readFile(path.join(uploadDir, path.basename(fileName)));
    const contentType = MIME_BY_EXTENSION[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream';
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return errorJson(404, 'Archivo no encontrado.');
  }
}
