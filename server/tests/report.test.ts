import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { Instructor } from '../src/models/Instructor';
import { Class } from '../src/models/Class';
import { Customer } from '../src/models/Customer';
import { Package } from '../src/models/Package';
import { Sale } from '../src/models/Sale';
import { Attendance } from '../src/models/Attendance';

let mongod: MongoMemoryServer;
let managerToken: string;
let instructorToken: string;
let classId: string;

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

  await Customer.create({
    customerId: 'C00001',
    firstName: 'Lena',
    lastName: 'Ortiz',
    address: '22 River Rd',
    phone: '555-3001',
    email: 'lena@test.com',
    preferredContact: 'email',
    classBalance: 10,
    isUnlimited: false,
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

  await Sale.create({
    customerId: 'C00001',
    packageId: 'P00001',
    amountPaid: 150,
    modeOfPayment: 'Card',
    paymentDate: new Date(),
    validityStartDate: new Date(Date.now() - 1000),
    validityEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });

  await Attendance.create({
    classId,
    instructorId: 'I00001',
    sessionDateTime: new Date(),
    customerIds: ['C00001'],
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function asManager(req: request.Test) {
  return req.set('Authorization', `Bearer ${managerToken}`);
}

describe('GET /api/reports/package-sales', () => {
  it('rejects a non-manager role', async () => {
    const res = await request(app)
      .get('/api/reports/package-sales')
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(res.status).toBe(403);
  });

  it('returns sales grouped by package with totals', async () => {
    const res = await asManager(request(app).get('/api/reports/package-sales'));
    expect(res.status).toBe(200);
    expect(res.body.rows[0]).toMatchObject({ packageId: 'P00001', timesSold: 1, totalRevenue: 150 });
    expect(res.body.totalRevenue).toBe(150);
  });
});

describe('GET /api/reports/instructors', () => {
  it('returns each instructor with their classes and check-in counts', async () => {
    const res = await asManager(request(app).get('/api/reports/instructors'));
    expect(res.status).toBe(200);
    const instr = res.body.find((r: { instructorId: string }) => r.instructorId === 'I00001');
    expect(instr.totalCheckIns).toBe(1);
    expect(instr.classes[0].checkIns).toBe(1);
  });
});

describe('GET /api/reports/customers', () => {
  it('returns each customer with their packages and active/future/expired status', async () => {
    const res = await asManager(request(app).get('/api/reports/customers'));
    expect(res.status).toBe(200);
    const cust = res.body.find((r: { customerId: string }) => r.customerId === 'C00001');
    expect(cust.packages[0]).toMatchObject({ packageId: 'P00001', status: 'active' });
  });
});

describe('GET /api/reports/teacher-payments', () => {
  it('returns each instructor with monthly pay totals based on sessions held', async () => {
    const res = await asManager(request(app).get('/api/reports/teacher-payments'));
    expect(res.status).toBe(200);
    const instr = res.body.find((r: { instructorId: string }) => r.instructorId === 'I00001');
    const currentMonth = new Date().toISOString().slice(0, 7);
    expect(instr.months).toEqual([{ month: currentMonth, totalPay: 40 }]);
  });
});
