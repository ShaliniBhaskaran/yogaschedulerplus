import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';

let mongod: MongoMemoryServer;
let token: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  token = jwt.sign({ email: 'test-manager@yogahom.com' }, process.env.JWT_SECRET as string);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function authed(req: request.Test) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /api/instructors', () => {
  it('rejects a request with missing fields', async () => {
    const res = await authed(request(app).post('/api/instructors')).send({ firstName: 'Asha' });
    expect(res.status).toBe(400);
    expect(res.body.missing).toContain('lastName');
  });

  it('creates an instructor with a valid I-prefixed id and a confirmation message', async () => {
    const res = await authed(request(app).post('/api/instructors')).send({
      firstName: 'Asha',
      lastName: 'Rao',
      address: '12 Lotus Lane',
      phone: '555-1234',
      email: 'asha@example.com',
      preferredContact: 'email',
    });
    expect(res.status).toBe(201);
    expect(res.body.instructor.instructorId).toMatch(/^I\d{5}$/);
    expect(res.body.confirmationMessage).toContain(res.body.instructor.instructorId);
  });

  it('requires confirmation when the same name is submitted again', async () => {
    await authed(request(app).post('/api/instructors')).send({
      firstName: 'Bala',
      lastName: 'Iyer',
      address: '5 Palm St',
      phone: '555-5678',
      email: 'bala@example.com',
      preferredContact: 'phone',
    });
    const res = await authed(request(app).post('/api/instructors')).send({
      firstName: 'Bala',
      lastName: 'Iyer',
      address: '5 Palm St',
      phone: '555-5678',
      email: 'bala@example.com',
      preferredContact: 'phone',
    });
    expect(res.status).toBe(409);
    expect(res.body.confirmNeeded).toBe(true);
  });

  it('creates the duplicate-named instructor once confirmDuplicate is true', async () => {
    const res = await authed(request(app).post('/api/instructors')).send({
      firstName: 'Bala',
      lastName: 'Iyer',
      address: '5 Palm St',
      phone: '555-5678',
      email: 'bala@example.com',
      preferredContact: 'phone',
      confirmDuplicate: true,
    });
    expect(res.status).toBe(201);
  });

  it('rejects requests without a valid token', async () => {
    const res = await request(app).get('/api/instructors/check-name?firstName=Asha&lastName=Rao');
    expect(res.status).toBe(401);
  });
});
