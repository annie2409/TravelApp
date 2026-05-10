// src/routes/trips.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notifications';

const router = Router();

const TripSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImage: z.string().optional(),
});

// Get all trips for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { ownerId: req.userId! },
        { members: { some: { userId: req.userId! } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { itineraryItems: true, messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(trips);
});

// Get single trip
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { ownerId: req.userId! },
        { members: { some: { userId: req.userId! } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// Create trip
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = TripSchema.parse(req.body);
    const trip = await prisma.trip.create({
      data: {
        ...data,
        ownerId: req.userId!,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        members: {
          create: { userId: req.userId!, role: 'OWNER' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });
    res.status(201).json(trip);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Update trip
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const data = TripSchema.partial().parse(req.body);
  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
  res.json(trip);
});

// Delete trip
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.trip.delete({ where: { id: req.params.id, ownerId: req.userId! } });
  res.status(204).send();
});

// Join trip via invite code
router.post('/join/:inviteCode', async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findUnique({ where: { inviteCode: req.params.inviteCode } });
  if (!trip) return res.status(404).json({ error: 'Invalid invite code' });

  const existing = await prisma.tripMember.findUnique({
    where: { userId_tripId: { userId: req.userId!, tripId: trip.id } },
  });
  if (existing) return res.json({ tripId: trip.id, alreadyMember: true });

  await prisma.tripMember.create({
    data: { userId: req.userId!, tripId: trip.id, role: 'MEMBER' },
  });

  // Notify all trip members
  const members = await prisma.tripMember.findMany({
    where: { tripId: trip.id, userId: { not: req.userId! } },
  });
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });

  for (const member of members) {
    await createNotification({
      userId: member.userId,
      tripId: trip.id,
      type: 'MEMBER_JOINED',
      message: `${user?.name} joined "${trip.name}"`,
    });
  }

  res.json({ tripId: trip.id });
});

// Get trip members
router.get('/:id/members', async (req: AuthRequest, res: Response) => {
  const members = await prisma.tripMember.findMany({
    where: { tripId: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  res.json(members);
});

export default router;
