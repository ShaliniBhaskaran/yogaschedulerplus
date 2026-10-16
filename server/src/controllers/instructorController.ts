import { Request, Response } from 'express';
import { Instructor } from '../models/Instructor';
import { generateId } from '../services/idGenerator';
import { sendNotification } from '../services/notificationService';
import bcrypt from 'bcrypt';
import { isValidEmail, isValidPhone } from '../utils/validators';

export async function checkInstructorName(req: Request, res: Response) {
  const { firstName, lastName } = req.query;
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required' });
  }
  const existing = await Instructor.findOne({
    firstName: new RegExp(`^${firstName}$`, 'i'),
    lastName: new RegExp(`^${lastName}$`, 'i'),
  });
  res.json({ exists: !!existing });
}

export async function createInstructor(req: Request, res: Response) {
  const { firstName, lastName, address, phone, email, preferredContact, confirmDuplicate } = req.body;

   const missing: string[] = [];
  if (!firstName) missing.push('firstName');
  if (!lastName) missing.push('lastName');
  if (!address) missing.push('address');
  if (!phone || !isValidPhone(phone)) missing.push('phone');
  if (!email || !isValidEmail(email)) missing.push('email');
  if (!preferredContact || !['phone', 'email'].includes(preferredContact)) missing.push('preferredContact');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  if (!confirmDuplicate) {
    const existing = await Instructor.findOne({
      firstName: new RegExp(`^${firstName}$`, 'i'),
      lastName: new RegExp(`^${lastName}$`, 'i'),
    });
    if (existing) {
      return res.status(409).json({ confirmNeeded: true, message: 'An instructor with this name already exists' });
    }
  }

  const instructorId = await generateId('I', 'instructorId');
  const passwordHash = await bcrypt.hash(instructorId, 10);

  const instructor = await Instructor.create({
    instructorId,
    firstName,
    lastName,
    address,
    phone,
    email,
    preferredContact,
    passwordHash,
  });

  const message = `Welcome to Yoga'Hom! ... Your instructor id is ${instructorId}. Login with your email and your instructor id as your password.`;
  await sendNotification('instructor', instructorId, preferredContact, message);

  res.status(201).json({ instructor, confirmationMessage: message });
}

export async function listInstructors(req: Request, res: Response) {
  const instructors = await Instructor.find();
  res.json(instructors);
}

export async function updateInstructor(req: Request, res: Response) {
  const { instructorId } = req.params;
  const { firstName, lastName, address, phone, email, preferredContact } = req.body;

  const missing: string[] = [];
  if (!firstName) missing.push('firstName');
  if (!lastName) missing.push('lastName');
  if (!address) missing.push('address');
  if (!phone || !isValidPhone(phone)) missing.push('phone');
  if (!email || !isValidEmail(email)) missing.push('email');
  if (!preferredContact || !['phone', 'email'].includes(preferredContact)) missing.push('preferredContact');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  const instructor = await Instructor.findOneAndUpdate(
    { instructorId },
    { firstName, lastName, address, phone, email, preferredContact },
    { returnDocument: 'after' }
  );

  if (!instructor) {
    return res.status(404).json({ error: `No instructor found with id ${instructorId}` });
  }

  res.json({ instructor, confirmationMessage: `Instructor ${instructor.firstName} ${instructor.lastName} has been updated.` });
}

export async function deleteInstructor(req: Request, res: Response) {
  const { instructorId } = req.params;
  const instructor = await Instructor.findOneAndDelete({ instructorId });

  if (!instructor) {
    return res.status(404).json({ error: `No instructor found with id ${instructorId}` });
  }

  res.json({ confirmationMessage: `Instructor ${instructor.firstName} ${instructor.lastName} has been deleted.` });
}
