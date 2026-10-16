import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { generateId } from '../services/idGenerator';
import { sendNotification } from '../services/notificationService';
import { isValidEmail, isValidPhone } from '../utils/validators';

export async function checkCustomerName(req: Request, res: Response) {
  const { firstName, lastName } = req.query;
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required' });
  }
  const existing = await Customer.findOne({
    firstName: new RegExp(`^${firstName}$`, 'i'),
    lastName: new RegExp(`^${lastName}$`, 'i'),
  });
  res.json({ exists: !!existing });
}

export async function createCustomer(req: Request, res: Response) {
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
    const existing = await Customer.findOne({
      firstName: new RegExp(`^${firstName}$`, 'i'),
      lastName: new RegExp(`^${lastName}$`, 'i'),
    });
    if (existing) {
      return res.status(409).json({ confirmNeeded: true, message: 'A customer with this name already exists' });
    }
  }

  const customerId = await generateId('C', 'customerId');

  const customer = await Customer.create({
    customerId,
    firstName,
    lastName,
    address,
    phone,
    email,
    preferredContact,
  });

  const message = `Welcome to Yoga'Hom! ... Your customer id is ${customerId}.`;
  await sendNotification('customer', customerId, preferredContact, message);

  res.status(201).json({ customer, confirmationMessage: message });
}

export async function listCustomers(req: Request, res: Response) {
  const customers = await Customer.find();
  res.json(customers);
}

export async function updateCustomer(req: Request, res: Response) {
  const { customerId } = req.params;
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

  const customer = await Customer.findOneAndUpdate(
    { customerId },
    { firstName, lastName, address, phone, email, preferredContact },
    { returnDocument: 'after' }
  );

  if (!customer) {
    return res.status(404).json({ error: `No customer found with id ${customerId}` });
  }

  res.json({ customer, confirmationMessage: `Customer ${customer.firstName} ${customer.lastName} has been updated.` });
}

export async function deleteCustomer(req: Request, res: Response) {
  const { customerId } = req.params;
  const customer = await Customer.findOneAndDelete({ customerId });

  if (!customer) {
    return res.status(404).json({ error: `No customer found with id ${customerId}` });
  }

  res.json({ confirmationMessage: `Customer ${customer.firstName} ${customer.lastName} has been deleted.` });
}
