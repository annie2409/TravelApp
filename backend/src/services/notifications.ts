// src/services/notifications.ts
import { prisma } from '../lib/prisma';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  tripId?: string;
  type: NotificationType;
  message: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({ data: params });
}
