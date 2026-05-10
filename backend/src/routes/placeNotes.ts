// src/routes/placeNotes.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────────

const NoteBodySchema = z.object({
  body: z.string().min(1),
  sourceUrl: z.string().optional(),
});

const NotePatchSchema = z.object({
  body: z.string().min(1).optional(),
  sourceUrl: z.string().optional(),
});

// ── Routes ─────────────────────────────────────────────────────────────────────

// GET /api/places/:placeId/notes
router.get('/:placeId/notes', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { placeId } = req.params;

  const place = await prisma.place.findFirst({ where: { id: placeId, userId } });
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const notes = await prisma.placeNote.findMany({
    where: { placeId, userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(notes);
});

// POST /api/places/:placeId/notes
router.post('/:placeId/notes', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { placeId } = req.params;

  const place = await prisma.place.findFirst({ where: { id: placeId, userId } });
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const parsed = NoteBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
  }

  const note = await prisma.placeNote.create({
    data: {
      placeId,
      userId,
      body: parsed.data.body,
      sourceUrl: parsed.data.sourceUrl,
    },
  });
  res.status(201).json(note);
});

// PUT /api/places/notes/:noteId
router.put('/notes/:noteId', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { noteId } = req.params;

  const note = await prisma.placeNote.findFirst({
    where: { id: noteId },
    include: { place: { select: { userId: true } } },
  });
  if (!note || note.place.userId !== userId) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const parsed = NotePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
  }

  const updated = await prisma.placeNote.update({
    where: { id: noteId },
    data: {
      ...(parsed.data.body !== undefined && { body: parsed.data.body }),
      ...(parsed.data.sourceUrl !== undefined && { sourceUrl: parsed.data.sourceUrl }),
    },
  });
  res.json(updated);
});

// DELETE /api/places/notes/:noteId
router.delete('/notes/:noteId', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { noteId } = req.params;

  const note = await prisma.placeNote.findFirst({
    where: { id: noteId },
    include: { place: { select: { userId: true } } },
  });
  if (!note || note.place.userId !== userId) {
    return res.status(404).json({ error: 'Note not found' });
  }

  await prisma.placeNote.delete({ where: { id: noteId } });
  res.status(204).send();
});

export default router;
