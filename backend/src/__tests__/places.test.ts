// src/__tests__/places.test.ts
import express from 'express';
import request from 'supertest';

// ── Mock prisma singleton ──────────────────────────────────────────────────────
jest.mock('../lib/prisma', () => ({
  prisma: {
    place: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    placeNote: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tag: {
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';
import placesRoutes from '../routes/places';
import placeNotesRoutes from '../routes/placeNotes';

// ── Test app (bypasses JWT) ────────────────────────────────────────────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  // Inject userId without real JWT
  app.use((req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    next();
  });
  app.use('/api/places', placesRoutes);
  app.use('/api/places', placeNotesRoutes);
  return app;
}

const app = buildApp();

// Typed mock helpers
const mockPlace = prisma.place as jest.Mocked<typeof prisma.place>;
const mockNote = prisma.placeNote as jest.Mocked<typeof prisma.placeNote>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /api/places ────────────────────────────────────────────────────────────
describe('GET /api/places', () => {
  it('returns an array of places', async () => {
    const fakePlaces = [
      { id: 'p1', name: 'Eiffel Tower', userId: 'user-1', tags: [], _count: { notes: 0 } },
    ];
    (mockPlace.findMany as jest.Mock).mockResolvedValue(fakePlaces);

    const res = await request(app).get('/api/places');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakePlaces);
    expect(mockPlace.findMany).toHaveBeenCalledTimes(1);
  });
});

// ── POST /api/places ───────────────────────────────────────────────────────────
describe('POST /api/places', () => {
  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/places').send({ address: '123 Main St' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  it('creates a place and returns 201', async () => {
    const fakePlace = {
      id: 'p1',
      name: 'Louvre',
      userId: 'user-1',
      dedupeKey: 'n:louvre|noll',
      tags: [],
      _count: { notes: 0 },
    };
    (mockPlace.create as jest.Mock).mockResolvedValue(fakePlace);

    const res = await request(app).post('/api/places').send({ name: 'Louvre' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Louvre');
  });

  it('returns 409 on duplicate (P2002)', async () => {
    const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    (mockPlace.create as jest.Mock).mockRejectedValue(err);
    const existing = { id: 'p1', name: 'Louvre', userId: 'user-1', tags: [], _count: { notes: 0 } };
    (mockPlace.findFirst as jest.Mock).mockResolvedValue(existing);

    const res = await request(app).post('/api/places').send({ name: 'Louvre' });
    expect(res.status).toBe(409);
    expect(res.body.place).toEqual(existing);
  });
});

// ── POST /api/places/import-url ────────────────────────────────────────────────
describe('POST /api/places/import-url', () => {
  it('returns 422 for a short link without hint', async () => {
    const res = await request(app)
      .post('/api/places/import-url')
      .send({ url: 'https://maps.app.goo.gl/abc123' });
    expect(res.status).toBe(422);
    expect(res.body.kind).toBe('short');
  });

  it('returns 422 for an unknown URL without hint', async () => {
    const res = await request(app)
      .post('/api/places/import-url')
      .send({ url: 'https://example.com/not-maps' });
    expect(res.status).toBe(422);
    expect(res.body.kind).toBe('unknown');
  });

  it('parses a full maps URL and extracts lat/lng, returns 201', async () => {
    const fakePlace = {
      id: 'p2',
      name: 'Eiffel Tower',
      lat: 48.8583701,
      lng: 2.2944813,
      userId: 'user-1',
      tags: [],
      _count: { notes: 0 },
    };
    (mockPlace.create as jest.Mock).mockResolvedValue(fakePlace);

    const res = await request(app)
      .post('/api/places/import-url')
      .send({ url: 'https://www.google.com/maps/place/Eiffel+Tower/@48.8583701,2.2944813,17z' });

    expect(res.status).toBe(201);
    expect(res.body.lat).toBeCloseTo(48.8583701);
    expect(res.body.lng).toBeCloseTo(2.2944813);
  });

  it('accepts a short link when hint.name is provided', async () => {
    const fakePlace = { id: 'p3', name: 'My Place', userId: 'user-1', tags: [], _count: { notes: 0 } };
    (mockPlace.create as jest.Mock).mockResolvedValue(fakePlace);

    const res = await request(app)
      .post('/api/places/import-url')
      .send({ url: 'https://maps.app.goo.gl/xyz', hint: { name: 'My Place' } });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Place');
  });
});

// ── GET /api/places/:id ────────────────────────────────────────────────────────
describe('GET /api/places/:id', () => {
  it('returns 404 for a place belonging to a different user', async () => {
    (mockPlace.findFirst as jest.Mock).mockResolvedValue(null); // ownership filter returns nothing
    const res = await request(app).get('/api/places/foreign-place-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Place not found');
  });

  it('returns the place when found', async () => {
    const fakePlace = { id: 'p1', name: 'Test', userId: 'user-1', tags: [], notes: [] };
    (mockPlace.findFirst as jest.Mock).mockResolvedValue(fakePlace);
    const res = await request(app).get('/api/places/p1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p1');
  });
});

// ── DELETE /api/places/:id ─────────────────────────────────────────────────────
describe('DELETE /api/places/:id', () => {
  it('returns 204 on success', async () => {
    (mockPlace.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    const res = await request(app).delete('/api/places/p1');
    expect(res.status).toBe(204);
  });
});

// ── Notes ownership check ──────────────────────────────────────────────────────
describe('GET /api/places/:placeId/notes', () => {
  it('returns 404 when place does not belong to user', async () => {
    (mockPlace.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get('/api/places/foreign-id/notes');
    expect(res.status).toBe(404);
  });

  it('returns notes array when place belongs to user', async () => {
    (mockPlace.findFirst as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'user-1' });
    (mockNote.findMany as jest.Mock).mockResolvedValue([{ id: 'n1', body: 'great spot' }]);
    const res = await request(app).get('/api/places/p1/notes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
