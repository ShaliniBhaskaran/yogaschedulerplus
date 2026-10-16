import client from './client';

export interface ScheduleCheckResult {
  mismatch: boolean;
  scheduledDayOfWeek: number;
  scheduledStartTime: string;
}

export interface InsufficientBalanceEntry {
  customerId: string;
  name: string;
  classBalance: number;
}

export interface AttendanceResultEntry {
  customerId: string;
  name: string;
  newBalance: number;
}

export interface AttendanceSuccess {
  attendance: { _id: string; classId: string; instructorId: string; sessionDateTime: string; customerIds: string[] };
  results: AttendanceResultEntry[];
  confirmationMessage: string;
}

export async function checkAttendanceSchedule(classId: string, sessionDateTime: string): Promise<ScheduleCheckResult> {
  const res = await client.get('/attendance/check-schedule', { params: { classId, sessionDateTime } });
  return res.data;
}

export async function createAttendance(data: {
  classId: string;
  sessionDateTime: string;
  customerIds: string[];
  confirmNegative?: boolean;
}): Promise<AttendanceSuccess> {
  const res = await client.post('/attendance', data);
  return res.data;
}
