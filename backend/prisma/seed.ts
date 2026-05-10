// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice Chen', passwordHash: hash },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob Martin', passwordHash: hash },
  });

  const trip = await prisma.trip.create({
    data: {
      name: 'Paris Summer Trip',
      description: 'Exploring the city of lights together!',
      destination: 'Paris, France',
      startDate: new Date('2025-07-10'),
      endDate: new Date('2025-07-17'),
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.itineraryItem.createMany({
    data: [
      { tripId: trip.id, createdById: alice.id, title: 'Arrive at CDG Airport', location: 'Charles de Gaulle Airport', lat: 49.0097, lng: 2.5479, dayIndex: 0, order: 0 },
      { tripId: trip.id, createdById: alice.id, title: 'Check-in Hotel', location: 'Le Marais, Paris', lat: 48.8566, lng: 2.3522, dayIndex: 0, order: 1 },
      { tripId: trip.id, createdById: bob.id, title: 'Eiffel Tower Visit', location: 'Eiffel Tower, Paris', lat: 48.8584, lng: 2.2945, dayIndex: 1, order: 0, startTime: '10:00', endTime: '12:00' },
      { tripId: trip.id, createdById: bob.id, title: 'Louvre Museum', location: 'Musée du Louvre', lat: 48.8606, lng: 2.3376, dayIndex: 1, order: 1, startTime: '14:00', endTime: '17:00' },
    ],
  });

  await prisma.message.createMany({
    data: [
      { tripId: trip.id, userId: alice.id, content: "So excited for this trip! 🗼" },
      { tripId: trip.id, userId: bob.id, content: "Same! I've been looking up great restaurants near the hotel" },
      { tripId: trip.id, userId: alice.id, content: "Should we visit Versailles on day 3?" },
    ],
  });

  await prisma.suggestion.createMany({
    data: [
      { tripId: trip.id, userId: bob.id, title: 'Palace of Versailles', location: 'Versailles, France', lat: 48.8049, lng: 2.1204, description: 'Stunning palace gardens — worth the day trip!', score: 2 },
      { tripId: trip.id, userId: alice.id, title: 'Montmartre & Sacré-Cœur', location: 'Montmartre, Paris', lat: 48.8867, lng: 2.3431, description: 'Great views of the city from the top', score: 1 },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('   alice@example.com / password123');
  console.log('   bob@example.com   / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
