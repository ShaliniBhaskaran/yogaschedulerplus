import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Manager } from '../models/Manager';
import { Instructor } from '../models/Instructor';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const manager = await Manager.findOne({ email });
  if (manager) {
    const valid = await bcrypt.compare(password, manager.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { email: manager.email, role: 'manager' },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );
    return res.json({ token, role: 'manager' });
  }

  const instructor = await Instructor.findOne({ email });
  if (instructor) {
    const valid = await bcrypt.compare(password, instructor.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { email: instructor.email, role: 'instructor', instructorId: instructor.instructorId },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );
    return res.json({ token, role: 'instructor', instructorId: instructor.instructorId });
  }

  res.status(401).json({ error: 'Invalid credentials' });
}