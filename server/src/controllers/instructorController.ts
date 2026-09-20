import { Request, Response } from 'express';
import { Instructor } from '../models/Instructor';
import { generateId } from '../services/idGenerator';
import { sendNotification } from '../services/notificationService';

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
  if (!phone) missing.push('phone');
  if (!email) missing.push('email');
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

  const instructor = await Instructor.create({
    instructorId,
    firstName,
    lastName,
    address,
    phone,
    email,
    preferredContact,
  });

  const message = `Welcome to Yoga'Hom! ... Your instructor id is ${instructorId}.`;
  await sendNotification('instructor', instructorId, preferredContact, message);

  res.status(201).json({ instructor, confirmationMessage: message });
}

export async function listInstructors(req: Request, res: Response) {
  const instructors = await Instructor.find();
  res.json(instructors);
}
