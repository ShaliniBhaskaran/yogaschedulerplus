import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { Customer } from '../src/models/Customer';
import { Package } from '../src/models/Package';

let mongod: MongoMemoryServer;
let token: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  token = jwt.sign({ email: 'test-manager@yogahom.com' }, process.env.JWT_SECRET as string);

  await Customer.create({
    customerId: 'C00001',
    firstName: 'Lena',
    lastName: 'Ortiz',
    address: '22 River Rd',
    phone: '555-3001',
    email: 'lena.ortiz@example.com',
    preferredContact: 'email',
    classBalance: 0,
  });

  await Package.create({
    packageId: 'P00001',
    packageName: 'General 10-Class Pack',
    packageCategory: 'General',
    numberOfClasses: '10',
    classType: 'General',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    price: 150,
  });

  await Package.create({
    packageId: 'P00002',
    packageName: 'Unlimited Pack',
    packageCategory: 'General',
    numberOfClasses: 'unlimited',
    classType: 'General',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    price: 300,
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function authed(req: request.Test) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('POST /api/sales', () => {
  it('rejects a request with missing fields', async () => {
    const res = await authed(request(app).post('/api/sales')).send({ customerId: 'C00001' });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown customer', async () => {
    const res = await authed(request(app).post('/api/sales')).send({
      customerId: 'C99999',
      packageId: 'P00001',
      amountPaid: 150,
      modeOfPayment: 'Card',
    });
    expect(res.status).toBe(400);
  });

  it('rejects an amount that does not match the package price', async () => {
    const res = await authed(request(app).post('/api/sales')).send({
      customerId: 'C00001',
      packageId: 'P00001',
      amountPaid: 99,
      modeOfPayment: 'Card',
    });
    expect(res.status).toBe(400);
  });

  it('records a sale and updates the customer class balance (numeric package)', async () => {
    const res = await authed(request(app).post('/api/sales')).send({
      customerId: 'C00001',
      packageId: 'P00001',
      amountPaid: 150,
      modeOfPayment: 'Card',
    });
    expect(res.status).toBe(201);
    expect(res.body.newClassBalance).toBe(10);
  });

  it('sets isUnlimited true for an unlimited package, without touching classBalance', async () => {
    const res = await authed(request(app).post('/api/sales')).send({
      customerId: 'C00001',
      packageId: 'P00002',
      amountPaid: 300,
      modeOfPayment: 'Online',
    });
    expect(res.status).toBe(201);
    expect(res.body.isUnlimited).toBe(true);
    expect(res.body.newClassBalance).toBe(10);
  });
});
