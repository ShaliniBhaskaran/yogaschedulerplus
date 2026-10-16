import { Request, Response } from 'express';
import { Package } from '../models/Package';
import { generateId } from '../services/idGenerator';

export async function createPackage(req: Request, res: Response) {
  const { packageName, packageCategory, numberOfClasses, classType, startDate, endDate, price } = req.body;

  const missing: string[] = [];
  if (!packageName) missing.push('packageName');
  if (!packageCategory || !['General', 'Senior'].includes(packageCategory)) missing.push('packageCategory');
  if (!numberOfClasses || !['1', '4', '10', 'unlimited'].includes(numberOfClasses)) missing.push('numberOfClasses');
  if (!classType || !['General', 'Special'].includes(classType)) missing.push('classType');
  if (!startDate) missing.push('startDate');
  if (!endDate) missing.push('endDate');
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) missing.push('endDate');
  if (price === undefined) missing.push('price');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  const packageId = await generateId('P', 'packageId');

  const pkg = await Package.create({
    packageId,
    packageName,
    packageCategory,
    numberOfClasses,
    classType,
    startDate,
    endDate,
    price,
  });

  res.status(201).json({
    package: pkg,
    confirmationMessage: `Package "${packageName}" has been added with id ${packageId}.`,
  });
}

export async function listPackages(req: Request, res: Response) {
  const packages = await Package.find().sort({ createdAt: -1 });
  res.json(packages);
}

export async function updatePackage(req: Request, res: Response) {
  const { packageId } = req.params;
  const { packageName, packageCategory, numberOfClasses, classType, startDate, endDate, price } = req.body;

  const missing: string[] = [];
  if (!packageName) missing.push('packageName');
  if (!packageCategory || !['General', 'Senior'].includes(packageCategory)) missing.push('packageCategory');
  if (!numberOfClasses || !['1', '4', '10', 'unlimited'].includes(numberOfClasses)) missing.push('numberOfClasses');
  if (!classType || !['General', 'Special'].includes(classType)) missing.push('classType');
  if (!startDate) missing.push('startDate');
  if (!endDate) missing.push('endDate');
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) missing.push('endDate');
  if (price === undefined) missing.push('price');

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Missing or invalid fields', missing });
  }

  const pkg = await Package.findOneAndUpdate(
    { packageId },
    { packageName, packageCategory, numberOfClasses, classType, startDate, endDate, price },
    { returnDocument: 'after' }
  );

  if (!pkg) {
    return res.status(404).json({ error: `No package found with id ${packageId}` });
  }

  res.json({ package: pkg, confirmationMessage: `Package "${pkg.packageName}" has been updated.` });
}

export async function deletePackage(req: Request, res: Response) {
  const { packageId } = req.params;
  const pkg = await Package.findOneAndDelete({ packageId });

  if (!pkg) {
    return res.status(404).json({ error: `No package found with id ${packageId}` });
  }

  res.json({ confirmationMessage: `Package "${pkg.packageName}" has been deleted.` });
}
