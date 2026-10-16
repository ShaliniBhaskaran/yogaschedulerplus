import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { Instructor } from '../src/models/Instructor';
import { Class } from '../src/models/Class';
import { Customer } from '../src/models/Customer';

let mongod: MongoMemoryServer;
let instructorToken: string;
let managerToken: string;
let classId: string;
let otherClassId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  managerToken = jwt.sign({ email: 'test-manager@yogahom.com', role: 'manager' }, process.env.JWT_SECRET as string);
  instructorToken = jwt.sign(
    { email: 'instructor@test.com', role: 'instructor', instructorId: 'I00001' },
    process.env.JWT_SECRET as string
  );

  await Instructor.create({
    instructorId: 'I00001',
    firstName: 'Asha',
    lastName: 'Rao',
    address: '12 Lotus Lane',
    phone: '555-1234',
    email: 'instructor@test.com',
    preferredContact: 'email',
    passwordHash: 'test-hash',
  });

  await Instructor.create({
    instructorId: 'I00002',
    firstName: 'Bala',
    lastName: 'Iyer',
    address: '5 Palm St',
    phone: '555-5678',
    email: 'bala@test.com',
    preferredContact: 'email',
    passwordHash: 'test-hash',
  });

  const cls = await Class.create({
    instructorId: 'I00001',
    dayOfWeek: 3,
    startTime: '09:00',
    durationMinutes: 60,
    classType: 'General',
    payRate: 40,
    status: 'published',
  });
  classId = (cls._id as mongoose.Types.ObjectId).toString();

  const otherCls = await Class.create({
    instructorId: 'I00002',
    dayOfWeek: 1,
    startTime: '10:00',
    durationMinutes: 60,
    classType: 'General',
    payRate: 40,
    status: 'published',
  });
  otherClassId = (otherCls._id as mongoose.Types.ObjectId).toString();

  await Customer.create({
    customerId: 'C00001',
    firstName: 'Lena',
    lastName: 'Ortiz',
    address: '22 River Rd',
    phone: '555-3001',
    email: 'lena@test.com',
    preferredContact: 'email',
    classBalance: 5,
    isUnlimited: false,
  });

  await Customer.create({
    customerId: 'C00002',
    firstName: 'Zero',
    lastName: 'Balance',
    address: '1 Empty St',
    phone: '555-0000',
    email: 'zero@test.com',
    preferredContact: 'email',
    classBalance: 0,
    isUnlimited: false,
  });

  await Customer.create({
    customerId: 'C00003',
    firstName: 'Uma',
    lastName: 'Unlimited',
    address: '9 Infinity Ave',
    phone: '555-9999',
    email: 'uma@test.com',
    preferredContact: 'email',
    classBalance: 0,
    isUnlimited: true,
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function asInstructor(req: request.Test) {
  return req.set('Authorization', `Bearer ${instructorToken}`);
}

describe('GET /api/attendance/check-schedule', () => {
  it('reports no mismatch when the session matches the class schedule', async () => {
    const res = await asInstructor(
      request(app).get(`/api/attendance/check-schedule?classId=${classId}&sessionDateTime=2026-10-21T09:00:00`)
    );
    expect(res.status).toBe(200);
    expect(res.body.mismatch).toBe(false);
  });

  it('reports a mismatch when the session day differs from the class schedule', async () => {
    const res = await asInstructor(
      request(app).get(`/api/attendance/check-schedule?classId=${classId}&sessionDateTime=2026-10-22T09:00:00`)
    );
    expect(res.status).toBe(200);
    expect(res.body.mismatch).toBe(true);
  });
});

describe('POST /api/attendance', () => {
  it('rejects a request with missing fields', async () => {
    const res = await asInstructor(request(app).post('/api/attendance')).send({ classId });
    expect(res.status).toBe(400);
  });

  it('rejects requests without a valid token', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .send({ classId, sessionDateTime: '2026-10-21T09:00:00', customerIds: ['C00001'] });
    expect(res.status).toBe(401);
  });

  it('rejects a non-instructor role', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ classId, sessionDateTime: '2026-10-21T09:00:00', customerIds: ['C00001'] });
    expect(res.status).toBe(403);
  });

  it('rejects recording attendance for a class not led by the instructor', async () => {
    const res = await asInstructor(request(app).post('/api/attendance')).send({
      classId: otherClassId,
      sessionDateTime: '2026-10-19T10:00:00',
      customerIds: ['C00001'],
    });
    expect(res.status).toBe(403);
  });

  it('flags customers with insufficient balance and asks for confirmation', async () => {
    const res = await asInstructor(request(app).post('/api/attendance')).send({
      classId,
      sessionDateTime: '2026-10-21T09:00:00',
      customerIds: ['C00002'],
    });
    expect(res.status).toBe(409);
    expect(res.body.confirmNeeded).toBe(true);
    expect(res.body.insufficientBalance[0].customerId).toBe('C00002');
  });

  it('records attendance and allows a negative balance once confirmed', async () => {
    const res = await asInstructor(request(app).post('/api/attendance')).send({
      classId,
      sessionDateTime: '2026-10-21T09:00:00',
      customerIds: ['C00002'],
      confirmNegative: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.results[0].newBalance).toBe(-1);
  });

  it('decrements balance for a customer with sufficient balance', async () => {
    const res = await asInstructor(request(app).post('/api/attendance')).send({
      classId,
      sessionDateTime: '2026-10-21T09:00:00',
      customerIds: ['C00001'],
    });
    expect(res.status).toBe(201);
    expect(res.body.results[0].newBalance).toBe(4);
  });

  it('does not decrement balance for an unlimited customer, even at 0', async () => {
    const res = await asInstructor(request(app).post('/api/attendance')).send({
      classId,
      sessionDateTime: '2026-10-21T09:00:00',
      customerIds: ['C00003'],
    });
    expect(res.status).toBe(201);
    expect(res.body.results[0].newBalance).toBe(0);
  });
});
