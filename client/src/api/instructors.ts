import client from './client';

export interface Instructor {
  _id: string;
  instructorId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
}

export async function checkInstructorName(firstName: string, lastName: string): Promise<boolean> {
  const res = await client.get('/instructors/check-name', { params: { firstName, lastName } });
  return res.data.exists;
}

export async function createInstructor(data: {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
  confirmDuplicate?: boolean;
}): Promise<{ instructor: Instructor; confirmationMessage: string }> {
  const res = await client.post('/instructors', data);
  return res.data;
}

export async function listInstructors(): Promise<Instructor[]> {
  const res = await client.get('/instructors/list');
  return res.data;
}
