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
  token = jwt.sign({ email: 'test-manager@yogahom.com', role: 'manager' }, process.env.JWT_SECRET as string);
  await Instructor.create({
    instructorId: 'I00001',
    firstName: 'Asha',
    lastName: 'Rao',
    address: '12 Lotus Lane',
    phone: '555-1234',
    email: 'asha@example.com',
    preferredContact: 'email',
    passwordHash: 'test-hash',
  });
  await Instructor.create({
    instructorId: 'I00002',
    firstName: 'Bala',
    lastName: 'Iyer',
    address: '5 Palm St',
    phone: '555-5678',
    email: 'bala@example.com',
    preferredContact: 'phone',
    passwordHash: 'test-hash',
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

describe('PUT /api/classes/:id', () => {
  let classId: string;
  let otherClassId: string;

  beforeAll(async () => {
    const res = await authed(request(app).post('/api/classes')).send({
      instructorId: 'I00001',
      dayOfWeek: 3,
      startTime: '09:00',
      durationMinutes: 60,
      classType: 'General',
      payRate: 30,
    });
    classId = res.body.class._id;

    const otherRes = await authed(request(app).post('/api/classes')).send({
      instructorId: 'I00002',
      dayOfWeek: 3,
      startTime: '14:00',
      durationMinutes: 60,
      classType: 'General',
      payRate: 30,
    });
    otherClassId = otherRes.body.class._id;
  });

  it('rejects a non-manager role', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: 'I00001' },
      process.env.JWT_SECRET as string
    );
    const res = await request(app)
      .put(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ instructorId: 'I00001', dayOfWeek: 3, startTime: '09:00', durationMinutes: 60, classType: 'General', payRate: 30 });
    expect(res.status).toBe(403);
  });

  it('allows updating a class to a non-conflicting slot on the same day', async () => {
    const res = await authed(request(app).put(`/api/classes/${classId}`)).send({
      instructorId: 'I00001',
      dayOfWeek: 3,
      startTime: '10:00',
      durationMinutes: 60,
      classType: 'Special',
      payRate: 35,
    });
    expect(res.status).toBe(200);
    expect(res.body.class.startTime).toBe('10:00');
    expect(res.body.class.payRate).toBe(35);
  });

  it('rejects moving a class into another class\'s slot, with suggestions', async () => {
    const res = await authed(request(app).put(`/api/classes/${classId}`)).send({
      instructorId: 'I00001',
      dayOfWeek: 3,
      startTime: '14:00',
      durationMinutes: 60,
      classType: 'General',
      payRate: 30,
    });
    expect(res.status).toBe(409);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('does not conflict with itself when the slot is left unchanged', async () => {
    const res = await authed(request(app).put(`/api/classes/${classId}`)).send({
      instructorId: 'I00001',
      dayOfWeek: 3,
      startTime: '10:00',
      durationMinutes: 60,
      classType: 'General',
      payRate: 30,
    });
    expect(res.status).toBe(200);
  });

  it('404s for an unknown class id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await authed(request(app).put(`/api/classes/${fakeId}`)).send({
      instructorId: 'I00001',
      dayOfWeek: 3,
      startTime: '10:00',
      durationMinutes: 60,
      classType: 'General',
      payRate: 30,
    });
    expect(res.status).toBe(404);
  });

  it('deletes an existing class as manager-only', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: 'I00002' },
      process.env.JWT_SECRET as string
    );
    const forbidden = await request(app)
      .delete(`/api/classes/${otherClassId}`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(forbidden.status).toBe(403);

    const res = await authed(request(app).delete(`/api/classes/${otherClassId}`));
    expect(res.status).toBe(200);
    expect(res.body.confirmationMessage).toContain('deleted');

    const notFound = await authed(request(app).delete(`/api/classes/${otherClassId}`));
    expect(notFound.status).toBe(404);
  });
});
