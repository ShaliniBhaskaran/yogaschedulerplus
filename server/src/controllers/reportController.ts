import { Request, Response } from 'express';
import { Sale } from '../models/Sale';
import { Package } from '../models/Package';
import { Customer } from '../models/Customer';
import { Instructor } from '../models/Instructor';
import { Class } from '../models/Class';
import { Attendance } from '../models/Attendance';

export async function packageSalesReport(req: Request, res: Response) {
  const sales = await Sale.find();
  const packages = await Package.find();
  const pkgMap = new Map(packages.map((p) => [p.packageId, p]));

  const grouped = new Map<string, { packageId: string; packageName: string; timesSold: number; totalRevenue: number }>();
  for (const sale of sales) {
    const pkg = pkgMap.get(sale.packageId);
    const packageName = pkg?.packageName ?? 'Unknown package';
    if (!grouped.has(sale.packageId)) {
      grouped.set(sale.packageId, { packageId: sale.packageId, packageName, timesSold: 0, totalRevenue: 0 });
    }
    const row = grouped.get(sale.packageId)!;
    row.timesSold += 1;
    row.totalRevenue += sale.amountPaid;
  }

  const rows = Array.from(grouped.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  const totalRevenue = rows.reduce((sum, r) => sum + r.totalRevenue, 0);
  res.json({ rows, totalRevenue });
}

export async function instructorsReport(req: Request, res: Response) {
  const instructors = await Instructor.find();
  const classes = await Class.find();
  const attendance = await Attendance.find();

  const rows = instructors.map((instr) => {
    const myClasses = classes.filter((c) => c.instructorId === instr.instructorId);
    const classRows = myClasses.map((c) => {
      const classId = (c._id as { toString(): string }).toString();
      const checkIns = attendance
        .filter((a) => a.classId === classId)
        .reduce((sum, a) => sum + a.customerIds.length, 0);
      return {
        classId,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        classType: c.classType,
        checkIns,
      };
    });
    const totalCheckIns = classRows.reduce((sum, c) => sum + c.checkIns, 0);
    return {
      instructorId: instr.instructorId,
      name: `${instr.firstName} ${instr.lastName}`,
      classes: classRows,
      totalCheckIns,
    };
  });

  res.json(rows);
}

export async function customersReport(req: Request, res: Response) {
  const customers = await Customer.find();
  const sales = await Sale.find();
  const packages = await Package.find();
  const pkgMap = new Map(packages.map((p) => [p.packageId, p]));
  const now = new Date();

  const rows = customers.map((cust) => {
    const custSales = sales.filter((s) => s.customerId === cust.customerId);
    const packagesList = custSales.map((s) => {
      const pkg = pkgMap.get(s.packageId);
      let status: 'active' | 'future' | 'expired';
      if (now < s.validityStartDate) status = 'future';
      else if (now > s.validityEndDate) status = 'expired';
      else status = 'active';
      return {
        packageId: s.packageId,
        packageName: pkg?.packageName ?? 'Unknown package',
        validityStartDate: s.validityStartDate,
        validityEndDate: s.validityEndDate,
        status,
      };
    });
    return {
      customerId: cust.customerId,
      name: `${cust.firstName} ${cust.lastName}`,
      isUnlimited: cust.isUnlimited,
      classBalance: cust.classBalance,
      packages: packagesList,
    };
  });

  res.json(rows);
}

export async function teacherPaymentsReport(req: Request, res: Response) {
  const instructors = await Instructor.find();
  const classes = await Class.find();
  const attendance = await Attendance.find();
  const payRateByClassId = new Map(
    classes.map((c) => [(c._id as { toString(): string }).toString(), c.payRate])
  );

  const byInstructor = new Map<string, Map<string, number>>();
  for (const a of attendance) {
    const month = a.sessionDateTime.toISOString().slice(0, 7);
    const payRate = payRateByClassId.get(a.classId) ?? 0;
    if (!byInstructor.has(a.instructorId)) {
      byInstructor.set(a.instructorId, new Map());
    }
    const months = byInstructor.get(a.instructorId)!;
    months.set(month, (months.get(month) ?? 0) + payRate);
  }

  const rows = instructors.map((instr) => {
    const months = byInstructor.get(instr.instructorId) ?? new Map();
    const monthRows = Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, totalPay]) => ({ month, totalPay }));
    return {
      instructorId: instr.instructorId,
      name: `${instr.firstName} ${instr.lastName}`,
      months: monthRows,
    };
  });

  res.json(rows);
}
