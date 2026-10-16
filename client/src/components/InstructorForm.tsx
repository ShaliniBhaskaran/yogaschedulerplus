import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { checkInstructorName, createInstructor } from '../api/instructors';

type Step = 'name' | 'confirm-duplicate' | 'details' | 'success';

export default function InstructorForm({ onCreated }: { onCreated: () => void }) {
  const [step, setStep] = useState<Step>('name');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState<'phone' | 'email'>('email');
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const exists = await checkInstructorName(firstName, lastName);
      setStep(exists ? 'confirm-duplicate' : 'details');
    } catch {
      setError('Something went wrong checking the name');
    } finally {
      setLoading(false);
    }
  }

  async function handleDetailsSubmit(e: FormEvent, confirmDuplicate = false) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await createInstructor({
        firstName,
        lastName,
        address,
        phone,
        email,
        preferredContact,
        confirmDuplicate,
      });
      setConfirmationMessage(result.confirmationMessage);
      setStep('success');
      onCreated();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setStep('confirm-duplicate');
      } else if (axios.isAxiosError(err) && err.response?.status === 400 && Array.isArray(err.response.data?.missing)) {
        const missing: string[] = err.response.data.missing;
        setFieldErrors({
          phone: missing.includes('phone') ? 'Invalid format' : undefined,
          email: missing.includes('email') ? 'Invalid format' : undefined,
        });
      } else {
        setError('Something went wrong saving the instructor');
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep('name');
    setFirstName('');
    setLastName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setPreferredContact('email');
    setDuplicateConfirmed(false);
    setConfirmationMessage('');
    setError('');
    setFieldErrors({});
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-md">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Add Instructor</h2>

      {step === 'name' && (
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First name <span className="text-red-600">*</span></label>
            <input
              id="firstName"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last name <span className="text-red-600">*</span></label>
            <input
              id="lastName"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'confirm-duplicate' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            An instructor named <strong>{firstName} {lastName}</strong> already exists. Is this a different person?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDuplicateConfirmed(true);
                setStep('details');
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
            >
              Yes, continue
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'details' && (
        <form onSubmit={(e) => handleDetailsSubmit(e, duplicateConfirmed)} className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-600">*</span></label>
            <input
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-600">*</span></label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {fieldErrors.phone && <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-600">*</span></label>
            <input
              id="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700 mb-1">Preferred contact <span className="text-red-600">*</span></label>
            <select
              id="preferredContact"
              value={preferredContact}
              onChange={(e) => setPreferredContact(e.target.value as 'phone' | 'email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Saving...' : 'Save instructor'}
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
            Add another instructor
          </button>
        </div>
      )}
    </div>
  );
}
