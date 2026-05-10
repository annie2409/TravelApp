// src/routes/chat.ts
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';
import { createNotification } from '../services/notifications';

const router = Router();

// Get messages for a trip (paginated)
router.get('/trip/:tripId', async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string | undefined;

  const messages = await prisma.message.findMany({
    where: {
      tripId: req.params.tripId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  res.json(messages.reverse());
});

// Send a message (also handled via Socket.io but REST fallback)
router.post('/trip/:tripId', async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Empty message' });

  const message = await prisma.message.create({
    data: {
      tripId: req.params.tripId,
      userId: req.userId!,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  io.to(`trip:${req.params.tripId}`).emit('chat:message', message);

  // Notify members
  const members = await prisma.tripMember.findMany({
    where: { tripId: req.params.tripId, userId: { not: req.userId! } },
  });
  for (const member of members) {
    const notif = await createNotification({
      userId: member.userId,
      tripId: req.params.tripId,
      type: 'NEW_MESSAGE',
      message: `${message.user.name}: ${content.substring(0, 60)}`,
    });
    io.to(`user:${member.userId}`).emit('notification:new', notif);
  }

  res.status(201).json(message);
});

export default router;
