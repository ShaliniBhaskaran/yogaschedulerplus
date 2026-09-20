import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { Instructor } from '../src/models/Instructor';

let mongod: MongoMemoryServer;
let token: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  token = jwt.sign({ email: 'test-manager@yogahom.com' }, process.env.JWT_SECRET as string);
  await Instructor.create({
    instructorId: 'I00001',
    firstName: 'Asha',
    lastName: 'Rao',
    address: '12 Lotus Lane',
    phone: '555-1234',
    email: 'asha@example.com',
    preferredContact: 'email',
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function authed(req: request.Test) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /api/classes', () => {
  it('rejects a request with missing fields', async () => {
    const res = await authed(request(app).post('/api/classes')).send({ instructorId: 'I00001' });
    expect(res.status).toBe(400);
  });

  it('rejects a request with an unknown instructor', async () => {
    const res = await authed(request(app).post('/api/classes')).send({
      instructorId: 'I99999',
      dayOfWeek: 1,
      startTime: '10:00',
      classType: 'General',
      payRate: 30,
    });
    expect(res.status).toBe(400);
  });

  it('creates a class in a free slot', async () => {
    const res = await authed(request(app).post('/api/classes')).send({
      instructorId: 'I00001',
      dayOfWeek: 1,
      startTime: '10:00',
      durationMinutes: 60,
      classType: 'General',
      payRate: 30,
    });
    expect(res.status).toBe(201);
    expect(res.body.class.status).toBe('published');
  });

  it('detects a conflict and suggests alternatives', async () => {
    const res = await authed(request(app).post('/api/classes')).send({
      instructorId: 'I00001',
      dayOfWeek: 1,
      startTime: '10:00',
      durationMinutes: 60,
      classType: 'Special',
      payRate: 40,
    });
    expect(res.status).toBe(409);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('succeeds when booked at a suggested free slot', async () => {
    const conflictRes = await authed(request(app).post('/api/classes')).send({
      instructorId: 'I00001',
      dayOfWeek: 2,
      startTime: '10:00',
      durationMinutes: 60,
      classType: 'General',
      payRate: 30,
    });
    expect(conflictRes.status).toBe(201);

    const res = await authed(request(app).post('/api/classes')).send({
      instructorId: 'I00001',
      dayOfWeek: 2,
      startTime: '11:00',
      durationMinutes: 60,
      classType: 'Special',
      payRate: 40,
    });
    expect(res.status).toBe(201);
  });
});
