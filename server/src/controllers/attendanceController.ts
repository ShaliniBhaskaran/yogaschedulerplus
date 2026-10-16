import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { Class } from '../models/Class';
import { Customer } from '../models/Customer';
import { sendNotification } from '../services/notificationService';

export async function checkAttendanceSchedule(req: Request, res: Response) {
  const { classId, sessionDateTime } = req.query;
  if (!classId || !sessionDateTime) {
    return res.status(400).json({ error: 'classId and sessionDateTime are required' });
  }

  const cls = await Class.findById(classId as string);
  if (!cls) {
    return res.status(400).json({ error: `No class found with id ${classId}` });
  }

  const session = new Date(sessionDateTime as string);
  const sessionDayOfWeek = session.getDay();
  const sessionTime = `${String(session.getHours()).padStart(2, '0')}:${String(session.getMinutes()).padStart(2, '0')}`;

  const mismatch = sessionDayOfWeek !== cls.dayOfWeek || sessionTime !== cls.startTime;

  res.json({
    mismatch,
    scheduledDayOfWeek: cls.dayOfWeek,
    scheduledStartTime: cls.startTime,
  });
}

export async function createAttendance(req: Request, res: Response) {
  const { classId, sessionDateTime, customerIds, confirmNegative } = req.body;

  const missing: string[] = [];
  if (!classId) missing.push('classId');
  if (!sessionDateTime) missing.push('sessionDateTime');
  if (!Array.isArray(customerIds) || customerIds.length === 0) missing.push('customerIds');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  const cls = await Class.findById(classId);
  if (!cls) {
    return res.status(400).json({ error: `No class found with id ${classId}` });
  }

  if (cls.instructorId !== req.user!.instructorId) {
    return res.status(403).json({ error: 'You can only record attendance for your own classes' });
  }

  const customers = await Customer.find({ customerId: { $in: customerIds } });
  if (customers.length !== customerIds.length) {
    return res.status(400).json({ error: 'One or more customer ids were not found' });
  }

  const insufficientBalance = customers
    .filter((c) => !c.isUnlimited && c.classBalance <= 0)
    .map((c) => ({ customerId: c.customerId, name: `${c.firstName} ${c.lastName}`, classBalance: c.classBalance }));

  if (insufficientBalance.length > 0 && !confirmNegative) {
    return res.status(409).json({ confirmNeeded: true, insufficientBalance });
  }

  const session = new Date(sessionDateTime);

  const attendance = await Attendance.create({
    classId,
    instructorId: req.user!.instructorId,
    sessionDateTime: session,
    customerIds,
  });

  const results: { customerId: string; name: string; newBalance: number }[] = [];
  for (const customer of customers) {
    if (!customer.isUnlimited) {
      customer.classBalance -= 1;
    }
    await customer.save();

    const balanceText = customer.isUnlimited ? 'Unlimited' : String(customer.classBalance);
    const dateStr = session.toLocaleDateString();
    const timeStr = session.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `Hello ${customer.firstName}! You are checked-in for a class on ${dateStr} at ${timeStr}. Your class-balance is ${balanceText}.`;
    await sendNotification('customer', customer.customerId, customer.preferredContact, message);

    results.push({ customerId: customer.customerId, name: `${customer.firstName} ${customer.lastName}`, newBalance: customer.classBalance });
  }

  res.status(201).json({
    attendance,
    results,
    confirmationMessage: `Attendance recorded for ${results.length} customer(s).`,
  });
}

export async function listMyAttendance(req: Request, res: Response) {
  const records = await Attendance.find({ instructorId: req.user!.instructorId }).sort({ sessionDateTime: -1 });
  res.json(records);
}
