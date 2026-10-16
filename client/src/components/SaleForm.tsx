import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { createSale } from '../api/sales';
import { listCustomers } from '../api/customers';
import type { Customer } from '../api/customers';
import { listPackages } from '../api/packages';
import type { PackageItem } from '../api/packages';

type Step = 'form' | 'success';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

export default function SaleForm({ onCreated }: { onCreated: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState<'Cash' | 'Card' | 'Online' | ''>('');
  const [step, setStep] = useState<Step>('form');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCustomers().then(setCustomers);
    listPackages().then(setPackages);
  }, []);

  const selectedPackage = packages.find((p) => p.packageId === packageId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedPackage) return;
    setError('');
    setLoading(true);
    try {
      const result = await createSale({
        customerId,
        packageId,
        amountPaid: selectedPackage.price,
        modeOfPayment: modeOfPayment as 'Cash' | 'Card' | 'Online',
      });
      setConfirmationMessage(result.confirmationMessage);
      setStep('success');
      onCreated();
    } catch (err) {
      if (axios.isAxiosError(err) && typeof err.response?.data?.error === 'string') {
        setError(err.response.data.error);
      } else {
        setError('Something went wrong recording the sale');
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep('form');
    setCustomerId('');
    setPackageId('');
    setModeOfPayment('');
    setConfirmationMessage('');
    setError('');
  }

  if ((customers.length === 0 || packages.length === 0) && step === 'form') {
    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-md">
        <h2 className="text-lg font-semibold text-indigo-800 mb-2">Record a Sale</h2>
        <p className="text-sm text-gray-500">
          {customers.length === 0 ? 'Add a customer first.' : 'Add a package first.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-md">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Record a Sale</h2>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="saleCustomerId" className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              id="saleCustomerId"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select a customer</option>
              {customers.map((cust) => (
                <option key={cust._id} value={cust.customerId}>
                  {cust.firstName} {cust.lastName} ({cust.customerId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="salePackageId" className="block text-sm font-medium text-gray-700 mb-1">Type of package</label>
            <select
              id="salePackageId"
              required
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select a package</option>
              {packages.map((pkg) => (
                <option key={pkg._id} value={pkg.packageId}>
                  {pkg.packageName} (${pkg.price})
                </option>
              ))}
            </select>
          </div>

          {selectedPackage && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600 space-y-1">
              <p>Amount paid: <span className="font-medium text-gray-800">${selectedPackage.price}</span></p>
              <p>Validity: <span className="font-medium text-gray-800">{formatDate(selectedPackage.startDate)} – {formatDate(selectedPackage.endDate)}</span></p>
            </div>
          )}

          <div>
            <label htmlFor="modeOfPayment" className="block text-sm font-medium text-gray-700 mb-1">Mode of payment</label>
            <select
              id="modeOfPayment"
              required
              value={modeOfPayment}
              onChange={(e) => setModeOfPayment(e.target.value as 'Cash' | 'Card' | 'Online')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select a mode</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !selectedPackage}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Recording...' : 'Record sale'}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-4">
          <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            {confirmationMessage}
          </p>
          <button
            onClick={resetForm}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
          >
            Record another sale
          </button>
        </div>
      )}
    </div>
  );
}
