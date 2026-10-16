import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import type { ClassItem } from '../api/classes';
import { listCustomers } from '../api/customers';
import type { Customer } from '../api/customers';
import { checkAttendanceSchedule, createAttendance } from '../api/attendance';
import type { InsufficientBalanceEntry, AttendanceResultEntry } from '../api/attendance';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function nowForDateTimeLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

type Step = 'form' | 'confirmNegative' | 'success';

export default function AttendanceForm({ classItem, onDone }: { classItem: ClassItem; onDone: () => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sessionDateTime, setSessionDateTime] = useState(nowForDateTimeLocal());
  const [mismatch, setMismatch] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [step, setStep] = useState<Step>('form');
  const [insufficientBalance, setInsufficientBalance] = useState<InsufficientBalanceEntry[]>([]);
  const [results, setResults] = useState<AttendanceResultEntry[]>([]);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    if (!sessionDateTime) return;
    checkAttendanceSchedule(classItem._id, sessionDateTime)
      .then((res) => setMismatch(res.mismatch))
      .catch(() => setMismatch(false));
  }, [classItem._id, sessionDateTime]);

  function toggleCustomer(customerId: string) {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  }

  async function submitAttendance(confirmNegative: boolean) {
    setError('');
    setLoading(true);
    try {
      const result = await createAttendance({
        classId: classItem._id,
        sessionDateTime,
        customerIds: selectedCustomerIds,
        confirmNegative,
      });
      setResults(result.results);
      setConfirmationMessage(result.confirmationMessage);
      setStep('success');
      onDone();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setInsufficientBalance(err.response.data.insufficientBalance);
        setStep('confirmNegative');
      } else {
        setError('Something went wrong saving attendance');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selectedCustomerIds.length === 0) return;
    await submitAttendance(false);
  }

  function resetForm() {
    setStep('form');
    setSessionDateTime(nowForDateTimeLocal());
    setSelectedCustomerIds([]);
    setInsufficientBalance([]);
    setResults([]);
    setConfirmationMessage('');
    setError('');
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-gray-500">Add a customer first before recording attendance.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-md">
      <h2 className="text-lg font-semibold text-indigo-800 mb-1">Record Attendance</h2>
      <p className="text-sm text-gray-500 mb-4">
        {classItem.classType} class &middot; {DAY_NAMES[classItem.dayOfWeek]} at {classItem.startTime}
      </p>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sessionDateTime" className="block text-sm font-medium text-gray-700 mb-1">Date &amp; time <span className="text-red-600">*</span></label>
            <input
              id="sessionDateTime"
              type="datetime-local"
              required
              value={sessionDateTime}
              onChange={(e) => setSessionDateTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {mismatch && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                This date/time doesn't match the class's scheduled {DAY_NAMES[classItem.dayOfWeek]} at {classItem.startTime}.
              </p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Customers attending</span>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
              {customers.map((cust) => (
                <label key={cust._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50/40">
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.includes(cust.customerId)}
                    onChange={() => toggleCustomer(cust.customerId)}
                  />
                  <span>{cust.firstName} {cust.lastName}</span>
                  <span className="text-gray-400 font-mono ml-auto">{cust.customerId}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || selectedCustomerIds.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Saving...' : 'Save attendance'}
          </button>
        </form>
      )}

      {step === 'confirmNegative' && (
        <div className="space-y-4">
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            The following customer(s) don't have enough class balance. Continue anyway and let their balance go negative?
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {insufficientBalance.map((c) => (
              <li key={c.customerId}>{c.name} ({c.customerId}) &mdash; balance {c.classBalance}</li>
            ))}
          </ul>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => submitAttendance(true)}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
            >
              Yes, continue
            </button>
            <button
              onClick={() => setStep('form')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-4">
          <p className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            {confirmationMessage}
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {results.map((r) => (
              <li key={r.customerId}>{r.name} &mdash; new balance: {r.newBalance}</li>
            ))}
          </ul>
          <button
            onClick={resetForm}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
          >
            Record another session
          </button>
        </div>
      )}
    </div>
  );
}
