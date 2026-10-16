import client from './client';

export interface PackageSalesRow {
  packageId: string;
  packageName: string;
  timesSold: number;
  totalRevenue: number;
}

export interface PackageSalesReport {
  rows: PackageSalesRow[];
  totalRevenue: number;
}

export interface InstructorClassRow {
  classId: string;
  dayOfWeek: number;
  startTime: string;
  classType: 'General' | 'Special';
  checkIns: number;
}

export interface InstructorReportRow {
  instructorId: string;
  name: string;
  classes: InstructorClassRow[];
  totalCheckIns: number;
}

export interface CustomerPackageRow {
  packageId: string;
  packageName: string;
  validityStartDate: string;
  validityEndDate: string;
  status: 'active' | 'future' | 'expired';
}

export interface CustomerReportRow {
  customerId: string;
  name: string;
  isUnlimited: boolean;
  classBalance: number;
  packages: CustomerPackageRow[];
}

export interface TeacherPaymentMonth {
  month: string;
  totalPay: number;
}

export interface TeacherPaymentRow {
  instructorId: string;
  name: string;
  months: TeacherPaymentMonth[];
}

export async function getPackageSalesReport(): Promise<PackageSalesReport> {
  const res = await client.get('/reports/package-sales');
  return res.data;
}

export async function getInstructorsReport(): Promise<InstructorReportRow[]> {
  const res = await client.get('/reports/instructors');
  return res.data;
}

export async function getCustomersReport(): Promise<CustomerReportRow[]> {
  const res = await client.get('/reports/customers');
  return res.data;
}

export async function getTeacherPaymentsReport(): Promise<TeacherPaymentRow[]> {
  const res = await client.get('/reports/teacher-payments');
  return res.data;
}
