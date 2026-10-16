import { Request, Response } from 'express';
import { Class } from '../models/Class';
import { Instructor } from '../models/Instructor';
import { findConflict, suggestAlternatives } from '../services/scheduleService';
import { sendNotification } from '../services/notificationService';

export async function checkClassConflict(req: Request, res: Response) {
  const dayOfWeek = Number(req.query.dayOfWeek);
  const startTime = String(req.query.startTime);
  const durationMinutes = Number(req.query.durationMinutes) || 60;

  const conflict = await findConflict(dayOfWeek, startTime, durationMinutes);
  if (!conflict) {
    return res.json({ conflict: false });
  }
  const suggestions = await suggestAlternatives(dayOfWeek, durationMinutes);
  res.json({ conflict: true, suggestions });
}

export async function createClass(req: Request, res: Response) {
  const { instructorId, dayOfWeek, startTime, durationMinutes, classType, payRate } = req.body;

  const missing: string[] = [];
  if (!instructorId) missing.push('instructorId');
  if (dayOfWeek === undefined) missing.push('dayOfWeek');
  if (!startTime) missing.push('startTime');
  if (!classType || !['General', 'Special'].includes(classType)) missing.push('classType');
  if (payRate === undefined) missing.push('payRate');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  const instructor = await Instructor.findOne({ instructorId });
  if (!instructor) {
    return res.status(400).json({ error: `No instructor found with id ${instructorId}` });
  }

  const duration = durationMinutes || 60;
  const conflict = await findConflict(dayOfWeek, startTime, duration);
  if (conflict) {
    const suggestions = await suggestAlternatives(dayOfWeek, duration);
    return res.status(409).json({ conflict: true, suggestions });
  }

  const newClass = await Class.create({
    instructorId,
    dayOfWeek,
    startTime,
    durationMinutes: duration,
    classType,
    payRate,
    status: 'published',
  });

  const message = `New class scheduled: ${classType} on day ${dayOfWeek} at ${startTime}.`;
  await sendNotification('manager', 'MANAGER', 'email', message);
  await sendNotification('instructor', instructorId, instructor.preferredContact, message);

  res.status(201).json({ class: newClass, confirmationMessage: message });
}

export async function listClasses(req: Request, res: Response) {
  const classes = await Class.find().sort({ dayOfWeek: 1, startTime: 1 });
  res.json(classes);
}

export async function listMyClasses(req: Request, res: Response) {
  const classes = await Class.find({ instructorId: req.user!.instructorId }).sort({ dayOfWeek: 1, startTime: 1 });
  res.json(classes);
}

export async function updateClass(req: Request, res: Response) {
  const { id } = req.params;
  const { instructorId, dayOfWeek, startTime, durationMinutes, classType, payRate } = req.body;

  const missing: string[] = [];
  if (!instructorId) missing.push('instructorId');
  if (dayOfWeek === undefined) missing.push('dayOfWeek');
  if (!startTime) missing.push('startTime');
  if (!classType || !['General', 'Special'].includes(classType)) missing.push('classType');
  if (payRate === undefined) missing.push('payRate');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  const existing = await Class.findById(id);
  if (!existing) {
    return res.status(404).json({ error: 'No class found with that id' });
  }

  const instructor = await Instructor.findOne({ instructorId });
  if (!instructor) {
    return res.status(400).json({ error: `No instructor found with id ${instructorId}` });
  }

  const duration = durationMinutes || 60;
  const conflict = await findConflict(dayOfWeek, startTime, duration, String(id));
  if (conflict) {
    const suggestions = await suggestAlternatives(dayOfWeek, duration);
    return res.status(409).json({ conflict: true, suggestions });
  }

  existing.set({ instructorId, dayOfWeek, startTime, durationMinutes: duration, classType, payRate });
  await existing.save();

  res.json({ class: existing, confirmationMessage: 'Class has been updated.' });
}

export async function deleteClass(req: Request, res: Response) {
  const { id } = req.params;
  const deleted = await Class.findByIdAndDelete(id);

  if (!deleted) {
    return res.status(404).json({ error: 'No class found with that id' });
  }

  res.json({ confirmationMessage: 'Class has been deleted.' });
}
