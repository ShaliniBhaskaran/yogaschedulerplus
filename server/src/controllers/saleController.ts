import { Request, Response } from 'express';
import { Sale } from '../models/Sale';
import { Customer } from '../models/Customer';
import { Package } from '../models/Package';

export async function createSale(req: Request, res: Response) {
  const { customerId, packageId, amountPaid, modeOfPayment } = req.body;

  const missing: string[] = [];
  if (!customerId) missing.push('customerId');
  if (!packageId) missing.push('packageId');
  if (amountPaid === undefined) missing.push('amountPaid');
  if (!modeOfPayment || !['Cash', 'Card', 'Online'].includes(modeOfPayment)) missing.push('modeOfPayment');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  const customer = await Customer.findOne({ customerId });
  if (!customer) {
    return res.status(400).json({ error: `No customer found with id ${customerId}` });
  }

  const pkg = await Package.findOne({ packageId });
  if (!pkg) {
    return res.status(400).json({ error: `No package found with id ${packageId}` });
  }

  if (Number(amountPaid) !== pkg.price) {
    return res.status(400).json({ error: `Amount paid must match the package price of $${pkg.price}` });
  }

  const now = new Date();
  if (now < pkg.startDate || now > pkg.endDate) {
    return res.status(400).json({ error: 'This package is not currently valid (outside its start/end date range)' });
  }

  const durationMs = pkg.endDate.getTime() - pkg.startDate.getTime();
  const validityStartDate = now;
  const validityEndDate = new Date(now.getTime() + durationMs);

  const sale = await Sale.create({
    customerId,
    packageId,
    amountPaid,
    modeOfPayment,
    paymentDate: now,
    validityStartDate,
    validityEndDate,
  });

  if (pkg.numberOfClasses === 'unlimited') {
    customer.isUnlimited = true;
  } else {
    customer.classBalance += Number(pkg.numberOfClasses);
  }
  await customer.save();

  res.status(201).json({
    sale,
    newClassBalance: customer.classBalance,
    isUnlimited: customer.isUnlimited,
    confirmationMessage: `Sale recorded for ${customer.firstName} ${customer.lastName}. New class balance: ${customer.isUnlimited ? 'Unlimited' : customer.classBalance}.`,
  });
}

export async function listSales(req: Request, res: Response) {
  const sales = await Sale.find().sort({ createdAt: -1 });
  res.json(sales);
}
