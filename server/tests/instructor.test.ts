import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';

let mongod: MongoMemoryServer;
let token: string;
let createdInstructorId: string;

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
    createdInstructorId = res.body.instructor.instructorId;
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

describe('PUT /api/instructors/:instructorId', () => {
  it('rejects a non-manager role', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: createdInstructorId },
      process.env.JWT_SECRET as string
    );
    const res = await request(app)
      .put(`/api/instructors/${createdInstructorId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        firstName: 'Asha',
        lastName: 'Rao',
        address: '12 Lotus Lane',
        phone: '555-1234',
        email: 'asha@example.com',
        preferredContact: 'email',
      });
    expect(res.status).toBe(403);
  });

  it('rejects an invalid phone/email format', async () => {
    const res = await authed(request(app).put(`/api/instructors/${createdInstructorId}`)).send({
      firstName: 'Asha',
      lastName: 'Rao',
      address: '12 Lotus Lane',
      phone: 'abc',
      email: 'not-an-email',
      preferredContact: 'email',
    });
    expect(res.status).toBe(400);
    expect(res.body.missing).toEqual(expect.arrayContaining(['phone', 'email']));
  });

  it('updates an existing instructor', async () => {
    const res = await authed(request(app).put(`/api/instructors/${createdInstructorId}`)).send({
      firstName: 'Asha',
      lastName: 'Rao-Updated',
      address: '99 New Lane',
      phone: '555-1234',
      email: 'asha@example.com',
      preferredContact: 'phone',
    });
    expect(res.status).toBe(200);
    expect(res.body.instructor.lastName).toBe('Rao-Updated');
    expect(res.body.instructor.address).toBe('99 New Lane');
  });

  it('404s for an unknown instructor id', async () => {
    const res = await authed(request(app).put('/api/instructors/I99999')).send({
      firstName: 'Ghost',
      lastName: 'Instructor',
      address: '1 Nowhere Ln',
      phone: '555-0000',
      email: 'ghost@example.com',
      preferredContact: 'email',
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/instructors/:instructorId', () => {
  it('rejects a non-manager role', async () => {
    const instructorToken = jwt.sign(
      { email: 'instructor@test.com', role: 'instructor', instructorId: createdInstructorId },
      process.env.JWT_SECRET as string
    );
    const res = await request(app)
      .delete(`/api/instructors/${createdInstructorId}`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes an existing instructor', async () => {
    const res = await authed(request(app).delete(`/api/instructors/${createdInstructorId}`));
    expect(res.status).toBe(200);
    expect(res.body.confirmationMessage).toContain('deleted');
  });

  it('404s for an unknown instructor id', async () => {
    const res = await authed(request(app).delete(`/api/instructors/${createdInstructorId}`));
    expect(res.status).toBe(404);
  });
});
