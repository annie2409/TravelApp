// src/routes/places.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { parseGoogleMapsUrl, dedupeKey } from '../lib/placeParser';
import { Prisma } from '@prisma/client';

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────────

const PlaceBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.string().optional(),
  googlePlaceId: z.string().optional(),
  openingHours: z.array(z.unknown()).optional(),
  seasonWindow: z.array(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const PlacePatchSchema = PlaceBodySchema.partial();

const ImportUrlSchema = z.object({
  url: z.string().min(1),
  hint: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      category: z.string().optional(),
    })
    .optional(),
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Upsert tags by (userId, name) and return their IDs. */
async function upsertTagIds(userId: string, tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });
    ids.push(tag.id);
  }
  return ids;
}

/** Standard place include clause. */
const placeListInclude = {
  _count: { select: { notes: true } },
  tags: { include: { tag: true } },
} as const;

/** Full place include (with notes). */
const placeDetailInclude = {
  tags: { include: { tag: true } },
  notes: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
  },
} as const;

// ── Routes ─────────────────────────────────────────────────────────────────────

// GET /api/places — list user's places
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { q, tag } = req.query as { q?: string; tag?: string };

  const where: Record<string, unknown> = { userId };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
      { notes: { some: { body: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  if (tag) {
    where.tags = { some: { tag: { userId, name: tag } } };
  }

  const places = await prisma.place.findMany({
    where,
    include: placeListInclude,
    orderBy: { updatedAt: 'desc' },
  });

  res.json(places);
});

// POST /api/places — manual create
router.post('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const parsed = PlaceBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
  }

  const { name, address, lat, lng, category, googlePlaceId, openingHours, seasonWindow, tags } =
    parsed.data;

  const key = dedupeKey({ googlePlaceId, name, lat, lng });

  try {
    const tagIds = tags ? await upsertTagIds(userId, tags) : [];

    const place = await prisma.place.create({
      data: {
        userId,
        name,
        address,
        lat,
        lng,
        category,
        googlePlaceId,
        openingHours: (openingHours as Prisma.InputJsonValue | undefined) ?? undefined,
        seasonWindow: (seasonWindow as Prisma.InputJsonValue | undefined) ?? undefined,
        hoursOverride: false,
        dedupeKey: key,
        tags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: placeListInclude,
    });

    return res.status(201).json(place);
  } catch (err: unknown) {
    // Unique constraint violation on (userId, dedupeKey)
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: string }).code === 'P2002'
    ) {
      const existing = await prisma.place.findFirst({
        where: { userId, dedupeKey: key },
        include: placeListInclude,
      });
      return res.status(409).json({ error: 'Place already exists', place: existing });
    }
    throw err;
  }
});

// POST /api/places/import-url
router.post('/import-url', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const parsed = ImportUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
  }

  const { url, hint } = parsed.data;
  const parsedUrl = parseGoogleMapsUrl(url);

  // Short link or unknown with no hint → 422
  if ((parsedUrl.kind === 'short' || parsedUrl.kind === 'unknown') && !hint?.name) {
    const message =
      parsedUrl.kind === 'short'
        ? 'Short Google Maps links cannot be resolved server-side. Please provide a full URL or supply a hint.name.'
        : 'Could not parse the provided URL. Please supply a hint with at least a name.';
    return res.status(422).json({ error: message, kind: parsedUrl.kind });
  }

  // Build payload: parser fields, then hint overrides
  const name = hint?.name ?? parsedUrl.name ?? '';
  if (!name) {
    return res.status(422).json({ error: 'Could not determine place name from URL or hint.' });
  }

  const googlePlaceId = parsedUrl.googlePlaceId;
  const lat = hint?.lat ?? parsedUrl.lat;
  const lng = hint?.lng ?? parsedUrl.lng;
  const address = hint?.address;
  const category = hint?.category;
  const key = dedupeKey({ googlePlaceId, name, lat, lng });

  try {
    const place = await prisma.place.create({
      data: {
        userId,
        name,
        address,
        lat,
        lng,
        category,
        googlePlaceId,
        importSourceUrl: url,
        hoursOverride: false,
        dedupeKey: key,
      },
      include: placeListInclude,
    });

    return res.status(201).json(place);
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: string }).code === 'P2002'
    ) {
      const existing = await prisma.place.findFirst({
        where: { userId, dedupeKey: key },
        include: placeListInclude,
      });
      return res.status(409).json({ error: 'Place already exists', place: existing });
    }
    throw err;
  }
});

// GET /api/places/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const place = await prisma.place.findFirst({
    where: { id: req.params.id, userId },
    include: placeDetailInclude,
  });
  if (!place) return res.status(404).json({ error: 'Place not found' });
  res.json(place);
});

// PUT /api/places/:id — partial update
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const parsed = PlacePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
  }

  // Verify ownership
  const existing = await prisma.place.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) return res.status(404).json({ error: 'Place not found' });

  const patch = parsed.data;
  const { name, address, lat, lng, category, googlePlaceId, openingHours, seasonWindow, tags } =
    patch;

  // Recompute dedupeKey only if relevant fields changed
  const dedupeChanged =
    name !== undefined || lat !== undefined || lng !== undefined || googlePlaceId !== undefined;
  const newDedupeKey = dedupeChanged
    ? dedupeKey({
        googlePlaceId: googlePlaceId ?? existing.googlePlaceId,
        name: name ?? existing.name,
        lat: lat ?? existing.lat,
        lng: lng ?? existing.lng,
      })
    : undefined;

  // If openingHours in patch → set hoursOverride=true
  const hoursOverride = openingHours !== undefined ? true : undefined;

  // Handle tags
  let tagConnect: { tagId: string }[] | undefined;
  if (tags !== undefined) {
    const tagIds = await upsertTagIds(userId, tags);
    tagConnect = tagIds.map((tagId) => ({ tagId }));
  }

  try {
    const updated = await prisma.place.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        ...(category !== undefined && { category }),
        ...(googlePlaceId !== undefined && { googlePlaceId }),
        ...(openingHours !== undefined && { openingHours: openingHours as Prisma.InputJsonValue }),
        ...(seasonWindow !== undefined && { seasonWindow: seasonWindow as Prisma.InputJsonValue }),
        ...(hoursOverride !== undefined && { hoursOverride }),
        ...(newDedupeKey !== undefined && { dedupeKey: newDedupeKey }),
        ...(tagConnect !== undefined && {
          tags: {
            deleteMany: {},
            create: tagConnect,
          },
        }),
      },
      include: placeListInclude,
    });
    res.json(updated);
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: string }).code === 'P2002'
    ) {
      return res.status(409).json({ error: 'Duplicate place with same dedupeKey' });
    }
    throw err;
  }
});

// DELETE /api/places/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  await prisma.place.deleteMany({ where: { id: req.params.id, userId } });
  res.status(204).send();
});

export default router;
