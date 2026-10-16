import client from './client';

export interface Sale {
  _id: string;
  customerId: string;
  packageId: string;
  amountPaid: number;
  modeOfPayment: 'Cash' | 'Card' | 'Online';
  paymentDate: string;
  validityStartDate: string;
  validityEndDate: string;
}

export async function createSale(data: {
  customerId: string;
  packageId: string;
  amountPaid: number;
  modeOfPayment: 'Cash' | 'Card' | 'Online';
}): Promise<{ sale: Sale; newClassBalance: number; confirmationMessage: string }> {
  const res = await client.post('/sales', data);
  return res.data;
}

export async function listSales(): Promise<Sale[]> {
  const res = await client.get('/sales/list');
  return res.data;
}
