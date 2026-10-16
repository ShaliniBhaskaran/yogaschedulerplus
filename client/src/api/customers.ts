import client from './client';

export interface Customer {
  _id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
  classBalance: number;
  isUnlimited: boolean;
}

export async function checkCustomerName(firstName: string, lastName: string): Promise<boolean> {
  const res = await client.get('/customers/check-name', { params: { firstName, lastName } });
  return res.data.exists;
}

export async function createCustomer(data: {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
  confirmDuplicate?: boolean;
}): Promise<{ customer: Customer; confirmationMessage: string }> {
  const res = await client.post('/customers', data);
  return res.data;
}

export async function listCustomers(): Promise<Customer[]> {
  const res = await client.get('/customers/list');
  return res.data;
}

export async function updateCustomer(
  customerId: string,
  data: {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    email: string;
    preferredContact: 'phone' | 'email';
  }
): Promise<{ customer: Customer; confirmationMessage: string }> {
  const res = await client.put(`/customers/${customerId}`, data);
  return res.data;
}

export async function deleteCustomer(customerId: string): Promise<{ confirmationMessage: string }> {
  const res = await client.delete(`/customers/${customerId}`);
  return res.data;
}
