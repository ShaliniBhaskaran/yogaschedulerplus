import client from './client';

export interface ClassItem {
  _id: string;
  instructorId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  classType: 'General' | 'Special';
  payRate: number;
  status: 'draft' | 'published';
}

export interface ConflictResult {
  conflict: boolean;
  suggestions?: string[];
}

export async function checkClassConflict(
  dayOfWeek: number,
  startTime: string,
  durationMinutes: number
): Promise<ConflictResult> {
  const res = await client.get('/classes/check-conflict', {
    params: { dayOfWeek, startTime, durationMinutes },
  });
  return res.data;
}

export async function createClass(data: {
  instructorId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  classType: 'General' | 'Special';
  payRate: number;
}): Promise<{ class: ClassItem; confirmationMessage: string }> {
  const res = await client.post('/classes', data);
  return res.data;
}

export async function listClasses(): Promise<ClassItem[]> {
  const res = await client.get('/classes/list');
  return res.data;
}
