// src/routes/voting.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();

const SuggestionSchema = z.object({
  tripId: z.string(),
  title: z.string().min(1),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().optional(),
  description: z.string().optional(),
});

// Get suggestions for a trip
router.get('/trip/:tripId', async (req: AuthRequest, res: Response) => {
  const suggestions = await prisma.suggestion.findMany({
    where: { tripId: req.params.tripId },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      votes: { select: { userId: true, value: true } },
    },
    orderBy: { score: 'desc' },
  });
  res.json(suggestions);
});

// Add suggestion
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = SuggestionSchema.parse(req.body);
    const suggestion = await prisma.suggestion.create({
      data: { ...data, userId: req.userId! },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        votes: { select: { userId: true, value: true } },
      },
    });
    io.to(`trip:${data.tripId}`).emit('voting:suggestion_added', suggestion);
    res.status(201).json(suggestion);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to add suggestion' });
  }
});

// Vote on a suggestion
router.post('/:id/vote', async (req: AuthRequest, res: Response) => {
  const { value } = req.body; // +1 or -1
  if (value !== 1 && value !== -1) return res.status(400).json({ error: 'Value must be +1 or -1' });

  const suggestion = await prisma.suggestion.findUnique({ where: { id: req.params.id } });
  if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

  // Upsert vote
  const existing = await prisma.vote.findUnique({
    where: { suggestionId_userId: { suggestionId: req.params.id, userId: req.userId! } },
  });

  let scoreDelta = value;
  if (existing) {
    if (existing.value === value) {
      // Toggle off (remove vote)
      await prisma.vote.delete({
        where: { suggestionId_userId: { suggestionId: req.params.id, userId: req.userId! } },
      });
      scoreDelta = -value;
    } else {
      // Change vote
      await prisma.vote.update({
        where: { suggestionId_userId: { suggestionId: req.params.id, userId: req.userId! } },
        data: { value },
      });
      scoreDelta = value * 2;
    }
  } else {
    await prisma.vote.create({
      data: { suggestionId: req.params.id, userId: req.userId!, value },
    });
  }

  const updated = await prisma.suggestion.update({
    where: { id: req.params.id },
    data: { score: { increment: scoreDelta } },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      votes: { select: { userId: true, value: true } },
    },
  });

  io.to(`trip:${suggestion.tripId}`).emit('voting:updated', updated);
  res.json(updated);
});

// Delete suggestion
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const suggestion = await prisma.suggestion.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!suggestion) return res.status(403).json({ error: 'Not authorized' });
  
  await prisma.suggestion.delete({ where: { id: req.params.id } });
  io.to(`trip:${suggestion.tripId}`).emit('voting:deleted', { id: req.params.id });
  res.status(204).send();
});

export default router;
