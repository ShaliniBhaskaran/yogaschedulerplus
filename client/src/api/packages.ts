import client from './client';

export interface PackageItem {
  _id: string;
  packageId: string;
  packageName: string;
  packageCategory: 'General' | 'Senior';
  numberOfClasses: '1' | '4' | '10' | 'unlimited';
  classType: 'General' | 'Special';
  startDate: string;
  endDate: string;
  price: number;
}

export async function createPackage(data: {
  packageName: string;
  packageCategory: 'General' | 'Senior';
  numberOfClasses: '1' | '4' | '10' | 'unlimited';
  classType: 'General' | 'Special';
  startDate: string;
  endDate: string;
  price: number;
}): Promise<{ package: PackageItem; confirmationMessage: string }> {
  const res = await client.post('/packages', data);
  return res.data;
}

export async function listPackages(): Promise<PackageItem[]> {
  const res = await client.get('/packages/list');
  return res.data;
}

export async function updatePackage(
  packageId: string,
  data: {
    packageName: string;
    packageCategory: 'General' | 'Senior';
    numberOfClasses: '1' | '4' | '10' | 'unlimited';
    classType: 'General' | 'Special';
    startDate: string;
    endDate: string;
    price: number;
  }
): Promise<{ package: PackageItem; confirmationMessage: string }> {
  const res = await client.put(`/packages/${packageId}`, data);
  return res.data;
}

export async function deletePackage(packageId: string): Promise<{ confirmationMessage: string }> {
  const res = await client.delete(`/packages/${packageId}`);
  return res.data;
}
