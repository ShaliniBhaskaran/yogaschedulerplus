import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { createPackage } from '../api/packages';

type Step = 'form' | 'success';

export default function PackageForm({ onCreated }: { onCreated: () => void }) {
  const [packageName, setPackageName] = useState('');
  const [packageCategory, setPackageCategory] = useState<'General' | 'Senior' | ''>('');
  const [numberOfClasses, setNumberOfClasses] = useState<'1' | '4' | '10' | 'unlimited' | ''>('');
  const [classType, setClassType] = useState<'General' | 'Special' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [step, setStep] = useState<Step>('form');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ endDate?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (startDate && endDate && endDate <= startDate) {
      setFieldErrors({ endDate: 'End date must be after the start date' });
      return;
    }

    setLoading(true);
    try {
      const result = await createPackage({
        packageName,
        packageCategory: packageCategory as 'General' | 'Senior',
        numberOfClasses: numberOfClasses as '1' | '4' | '10' | 'unlimited',
        classType: classType as 'General' | 'Special',
        startDate,
        endDate,
        price: Number(price),
      });
      setConfirmationMessage(result.confirmationMessage);
      setStep('success');
      onCreated();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && Array.isArray(err.response.data?.missing)) {
        const missing: string[] = err.response.data.missing;
        if (missing.includes('endDate')) {
          setFieldErrors({ endDate: 'End date must be after the start date' });
        } else {
          setError('Something went wrong saving the package');
        }
      } else {
        setError('Something went wrong saving the package');
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep('form');
    setPackageName('');
    setPackageCategory('');
    setNumberOfClasses('');
    setClassType('');
    setStartDate('');
    setEndDate('');
    setPrice('');
    setConfirmationMessage('');
    setError('');
    setFieldErrors({});
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-md">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Add Package</h2>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="packageName" className="block text-sm font-medium text-gray-700 mb-1">Package name <span className="text-red-600">*</span></label>
            <input
              id="packageName"
              required
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="packageCategory" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-600">*</span></label>
              <select
                id="packageCategory"
                required
                value={packageCategory}
                onChange={(e) => setPackageCategory(e.target.value as 'General' | 'Senior')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a category</option>
                <option value="General">General</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div>
              <label htmlFor="numberOfClasses" className="block text-sm font-medium text-gray-700 mb-1"># of classes <span className="text-red-600">*</span></label>
              <select
                id="numberOfClasses"
                required
                value={numberOfClasses}
                onChange={(e) => setNumberOfClasses(e.target.value as '1' | '4' | '10' | 'unlimited')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select</option>
                <option value="1">1</option>
                <option value="4">4</option>
                <option value="10">10</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="packageClassType" className="block text-sm font-medium text-gray-700 mb-1">Class type <span className="text-red-600">*</span></label>
            <select
              id="packageClassType"
              required
              value={classType}
              onChange={(e) => setClassType(e.target.value as 'General' | 'Special')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select a type</option>
              <option value="General">General</option>
              <option value="Special">Special</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start date <span className="text-red-600">*</span></label>
              <input
                id="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End date <span className="text-red-600">*</span></label>
              <input
                id="endDate"
                type="date"
                required
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setFieldErrors({});
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.endDate && <p className="text-sm text-red-600 mt-1">{fieldErrors.endDate}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price ($) <span className="text-red-600">*</span></label>
            <input
              id="price"
              type="number"
              required
              min={0}
              placeholder="e.g. 150"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Saving...' : 'Add package'}
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
            Add another package
          </button>
        </div>
      )}
    </div>
  );
}
