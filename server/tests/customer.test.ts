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

describe('POST /api/customers', () => {
  it('rejects a request with missing fields', async () => {
    const res = await authed(request(app).post('/api/customers')).send({ firstName: 'Lena' });
    expect(res.status).toBe(400);
    expect(res.body.missing).toContain('lastName');
  });

  it('rejects requests without a valid token', async () => {
    const res = await request(app).post('/api/customers').send({});
    expect(res.status).toBe(401);
  });

  it('creates a customer with a valid C-prefixed id, classBalance 0, and a confirmation message', async () => {
    const res = await authed(request(app).post('/api/customers')).send({
      firstName: 'Lena',
      lastName: 'Ortiz',
      address: '22 River Rd',
      phone: '555-3001',
      email: 'lena.ortiz@example.com',
      preferredContact: 'email',
    });
    expect(res.status).toBe(201);
    expect(res.body.customer.customerId).toMatch(/^C\d{5}$/);
    expect(res.body.customer.classBalance).toBe(0);
    expect(res.body.confirmationMessage).toContain(res.body.customer.customerId);
  });

  it('requires confirmation when the same name is submitted again', async () => {
    await authed(request(app).post('/api/customers')).send({
      firstName: 'Marcus',
      lastName: 'Diallo',
      address: '9 Oak St',
      phone: '555-3002',
      email: 'marcus@example.com',
      preferredContact: 'phone',
    });
    const res = await authed(request(app).post('/api/customers')).send({
      firstName: 'Marcus',
      lastName: 'Diallo',
      address: '9 Oak St',
      phone: '555-3002',
      email: 'marcus@example.com',
      preferredContact: 'phone',
    });
    expect(res.status).toBe(409);
    expect(res.body.confirmNeeded).toBe(true);
  });

  it('creates the duplicate-named customer once confirmDuplicate is true', async () => {
    const res = await authed(request(app).post('/api/customers')).send({
      firstName: 'Marcus',
      lastName: 'Diallo',
      address: '9 Oak St',
      phone: '555-3002',
      email: 'marcus@example.com',
      preferredContact: 'phone',
      confirmDuplicate: true,
    });
    expect(res.status).toBe(201);
  });
});

describe('PUT /api/customers/:customerId', () => {
  it('rejects a non-manager role', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: 'I00001' },
      process.env.JWT_SECRET as string
    );
    const res = await request(app)
      .put('/api/customers/C00001')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        firstName: 'Lena',
        lastName: 'Ortiz',
        address: '22 River Rd',
        phone: '555-3001',
        email: 'lena.ortiz@example.com',
        preferredContact: 'email',
      });
    expect(res.status).toBe(403);
  });

  it('rejects an invalid phone/email format', async () => {
    const res = await authed(request(app).put('/api/customers/C00001')).send({
      firstName: 'Lena',
      lastName: 'Ortiz',
      address: '22 River Rd',
      phone: 'abc',
      email: 'not-an-email',
      preferredContact: 'email',
    });
    expect(res.status).toBe(400);
    expect(res.body.missing).toEqual(expect.arrayContaining(['phone', 'email']));
  });

  it('updates an existing customer', async () => {
    const res = await authed(request(app).put('/api/customers/C00001')).send({
      firstName: 'Lena',
      lastName: 'Ortiz-Updated',
      address: '99 New Rd',
      phone: '555-3001',
      email: 'lena.ortiz@example.com',
      preferredContact: 'phone',
    });
    expect(res.status).toBe(200);
    expect(res.body.customer.lastName).toBe('Ortiz-Updated');
    expect(res.body.customer.address).toBe('99 New Rd');
  });

  it('404s for an unknown customer id', async () => {
    const res = await authed(request(app).put('/api/customers/C99999')).send({
      firstName: 'Ghost',
      lastName: 'Customer',
      address: '1 Nowhere Ln',
      phone: '555-0000',
      email: 'ghost@example.com',
      preferredContact: 'email',
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/customers/:customerId', () => {
  it('rejects a non-manager role', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: 'I00001' },
      process.env.JWT_SECRET as string
    );
    const res = await request(app)
      .delete('/api/customers/C00001')
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes an existing customer', async () => {
    const res = await authed(request(app).delete('/api/customers/C00001'));
    expect(res.status).toBe(200);
    expect(res.body.confirmationMessage).toContain('deleted');
  });

  it('404s for an unknown customer id', async () => {
    const res = await authed(request(app).delete('/api/customers/C00001'));
    expect(res.status).toBe(404);
  });
});
