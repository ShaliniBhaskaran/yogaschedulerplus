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
  token = jwt.sign({ email: 'test-manager@yogahom.com', role: 'manager' }, process.env.JWT_SECRET as string);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function authed(req: request.Test) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /api/packages', () => {
  it('rejects a request with missing fields', async () => {
    const res = await authed(request(app).post('/api/packages')).send({ packageName: 'Starter Pack' });
    expect(res.status).toBe(400);
    expect(res.body.missing).toContain('price');
  });

  it('rejects requests without a valid token', async () => {
    const res = await request(app).post('/api/packages').send({});
    expect(res.status).toBe(401);
  });

  it('rejects an end date that is on or before the start date', async () => {
    const res = await authed(request(app).post('/api/packages')).send({
      packageName: 'Backwards Pack',
      packageCategory: 'General',
      numberOfClasses: '10',
      classType: 'General',
      startDate: '2026-10-01',
      endDate: '2026-09-01',
      price: 150,
    });
    expect(res.status).toBe(400);
    expect(res.body.missing).toContain('endDate');
  });

  it('creates a package with a valid P-prefixed id and a confirmation message', async () => {
    const res = await authed(request(app).post('/api/packages')).send({
      packageName: 'General 10-Class Pack',
      packageCategory: 'General',
      numberOfClasses: '10',
      classType: 'General',
      startDate: '2026-10-01',
      endDate: '2027-01-01',
      price: 150,
    });
    expect(res.status).toBe(201);
    expect(res.body.package.packageId).toMatch(/^P\d{5}$/);
    expect(res.body.confirmationMessage).toContain(res.body.package.packageId);
  });

  it('lists created packages', async () => {
    const res = await authed(request(app).get('/api/packages/list'));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('PUT /api/packages/:packageId', () => {
  it('rejects a non-manager role', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: 'I00001' },
      process.env.JWT_SECRET as string
    );
    const res = await request(app)
      .put('/api/packages/P00001')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        packageName: 'Updated Pack',
        packageCategory: 'General',
        numberOfClasses: '10',
        classType: 'General',
        startDate: '2026-10-01',
        endDate: '2027-01-01',
        price: 150,
      });
    expect(res.status).toBe(403);
  });

  it('rejects an end date on or before the start date', async () => {
    const res = await authed(request(app).put('/api/packages/P00001')).send({
      packageName: 'Updated Pack',
      packageCategory: 'General',
      numberOfClasses: '10',
      classType: 'General',
      startDate: '2026-10-01',
      endDate: '2026-09-01',
      price: 150,
    });
    expect(res.status).toBe(400);
    expect(res.body.missing).toContain('endDate');
  });

  it('updates an existing package', async () => {
    const res = await authed(request(app).put('/api/packages/P00001')).send({
      packageName: 'Updated Pack',
      packageCategory: 'Senior',
      numberOfClasses: '4',
      classType: 'Special',
      startDate: '2026-10-01',
      endDate: '2027-01-01',
      price: 200,
    });
    expect(res.status).toBe(200);
    expect(res.body.package.packageName).toBe('Updated Pack');
    expect(res.body.package.price).toBe(200);
  });

  it('404s for an unknown package id', async () => {
    const res = await authed(request(app).put('/api/packages/P99999')).send({
      packageName: 'Nope',
      packageCategory: 'General',
      numberOfClasses: '10',
      classType: 'General',
      startDate: '2026-10-01',
      endDate: '2027-01-01',
      price: 150,
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/packages/:packageId', () => {
  it('rejects a non-manager role', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: 'I00001' },
      process.env.JWT_SECRET as string
    );
    const res = await request(app)
      .delete('/api/packages/P00001')
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes an existing package', async () => {
    const res = await authed(request(app).delete('/api/packages/P00001'));
    expect(res.status).toBe(200);
    expect(res.body.confirmationMessage).toContain('deleted');
  });

  it('404s for an unknown package id', async () => {
    const res = await authed(request(app).delete('/api/packages/P00001'));
    expect(res.status).toBe(404);
  });
});
