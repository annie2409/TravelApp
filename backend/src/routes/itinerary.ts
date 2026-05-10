// src/routes/itinerary.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';
import { createNotification } from '../services/notifications';

const router = Router();

const ItemSchema = z.object({
  tripId: z.string(),
  title: z.string().min(1),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  order: z.number().optional(),
  dayIndex: z.number().optional(),
});

// Get all itinerary items for a trip
router.get('/trip/:tripId', async (req: AuthRequest, res: Response) => {
  const items = await prisma.itineraryItem.findMany({
    where: { tripId: req.params.tripId },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: [{ dayIndex: 'asc' }, { order: 'asc' }],
  });
  res.json(items);
});

// Add itinerary item
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = ItemSchema.parse(req.body);
    const item = await prisma.itineraryItem.create({
      data: {
        ...data,
        createdById: req.userId!,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Broadcast to trip room
    io.to(`trip:${data.tripId}`).emit('itinerary:added', item);

    // Notify members
    const members = await prisma.tripMember.findMany({
      where: { tripId: data.tripId, userId: { not: req.userId! } },
    });
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    for (const member of members) {
      const notif = await createNotification({
        userId: member.userId,
        tripId: data.tripId,
        type: 'ACTIVITY_ADDED',
        message: `${user?.name} added "${item.title}" to the itinerary`,
      });
      io.to(`user:${member.userId}`).emit('notification:new', notif);
    }

    res.status(201).json(item);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update itinerary item
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = ItemSchema.partial().parse(req.body);
    const item = await prisma.itineraryItem.update({
      where: { id: req.params.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    io.to(`trip:${item.tripId}`).emit('itinerary:updated', item);

    // Notify members
    const members = await prisma.tripMember.findMany({
      where: { tripId: item.tripId, userId: { not: req.userId! } },
    });
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    for (const member of members) {
      const notif = await createNotification({
        userId: member.userId,
        tripId: item.tripId,
        type: 'ITINERARY_EDITED',
        message: `${user?.name} edited "${item.title}"`,
      });
      io.to(`user:${member.userId}`).emit('notification:new', notif);
    }

    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete itinerary item
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const item = await prisma.itineraryItem.delete({ where: { id: req.params.id } });
  io.to(`trip:${item.tripId}`).emit('itinerary:deleted', { id: item.id });
  res.status(204).send();
});

// Reorder items (bulk update)
router.put('/reorder/bulk', async (req: AuthRequest, res: Response) => {
  const { items }: { items: { id: string; order: number; dayIndex: number }[] } = req.body;
  
  await prisma.$transaction(
    items.map(({ id, order, dayIndex }) =>
      prisma.itineraryItem.update({ where: { id }, data: { order, dayIndex } })
    )
  );

  // Broadcast reorder to all trip members
  const firstItem = await prisma.itineraryItem.findUnique({ where: { id: items[0]?.id } });
  if (firstItem) {
    io.to(`trip:${firstItem.tripId}`).emit('itinerary:reordered', items);
  }

  res.json({ success: true });
});

export default router;
