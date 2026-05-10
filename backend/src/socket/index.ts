// src/socket/index.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface SocketUser {
  userId: string;
  name: string;
  avatar?: string | null;
}

const connectedUsers = new Map<string, SocketUser>(); // socketId -> user

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, avatar: true },
      });
      if (!user) return next(new Error('User not found'));

      (socket as any).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as SocketUser;
    connectedUsers.set(socket.id, user);

    console.log(`✅ User connected: ${user.name} (${socket.id})`);

    // Join personal room for notifications
    socket.join(`user:${user.userId}`);

    // Join trip room
    socket.on('trip:join', async (tripId: string) => {
      const member = await prisma.tripMember.findFirst({
        where: { tripId, userId: user.userId },
      });
      if (!member) {
        socket.emit('error', { message: 'Not a member of this trip' });
        return;
      }
      socket.join(`trip:${tripId}`);
      socket.to(`trip:${tripId}`).emit('presence:joined', {
        userId: user.userId,
        name: user.name,
        avatar: user.avatar,
      });

      // Send current online members in room
      const roomSockets = await io.in(`trip:${tripId}`).fetchSockets();
      const onlineUsers = roomSockets
        .map(s => connectedUsers.get(s.id))
        .filter(Boolean);
      socket.emit('presence:online', onlineUsers);
    });

    // Leave trip room
    socket.on('trip:leave', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
      socket.to(`trip:${tripId}`).emit('presence:left', { userId: user.userId });
    });

    // Real-time chat via socket
    socket.on('chat:send', async (data: { tripId: string; content: string }) => {
      if (!data.content?.trim()) return;

      try {
        const message = await prisma.message.create({
          data: {
            tripId: data.tripId,
            userId: user.userId,
            content: data.content.trim(),
          },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        });

        io.to(`trip:${data.tripId}`).emit('chat:message', message);

        // Notify offline members
        const members = await prisma.tripMember.findMany({
          where: { tripId: data.tripId, userId: { not: user.userId } },
        });
        for (const member of members) {
          await prisma.notification.create({
            data: {
              userId: member.userId,
              tripId: data.tripId,
              type: 'NEW_MESSAGE',
              message: `${user.name}: ${data.content.substring(0, 60)}`,
            },
          }).then(notif => {
            io.to(`user:${member.userId}`).emit('notification:new', notif);
          });
        }
      } catch (err) {
        console.error('Chat send error:', err);
      }
    });

    // Typing indicators
    socket.on('chat:typing', (data: { tripId: string; isTyping: boolean }) => {
      socket.to(`trip:${data.tripId}`).emit('chat:typing', {
        userId: user.userId,
        name: user.name,
        isTyping: data.isTyping,
      });
    });

    // Itinerary item being edited (live cursor)
    socket.on('itinerary:editing', (data: { tripId: string; itemId: string }) => {
      socket.to(`trip:${data.tripId}`).emit('itinerary:editing', {
        userId: user.userId,
        name: user.name,
        itemId: data.itemId,
      });
    });

    socket.on('disconnect', async () => {
      connectedUsers.delete(socket.id);
      console.log(`❌ User disconnected: ${user.name}`);

      // Notify all trip rooms this user was in
      const rooms = Array.from(socket.rooms);
      for (const room of rooms) {
        if (room.startsWith('trip:')) {
          socket.to(room).emit('presence:left', { userId: user.userId });
        }
      }
    });
  });

  return io;
}
