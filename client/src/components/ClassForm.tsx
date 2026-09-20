import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { createClass } from '../api/classes';
import { listInstructors } from '../api/instructors';
import type { Instructor } from '../api/instructors';
import { DAYS } from '../constants';

type Step = 'form' | 'conflict' | 'success';

export default function ClassForm({ onCreated }: { onCreated: () => void }) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorId, setInstructorId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [classType, setClassType] = useState<'General' | 'Special' | ''>('');
  const [payRate, setPayRate] = useState<number | ''>('');
  const [step, setStep] = useState<Step>('form');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listInstructors().then(setInstructors);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await createClass({
        instructorId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        durationMinutes: Number(durationMinutes),
        classType: classType as 'General' | 'Special',
        payRate: Number(payRate),
      });
      setConfirmationMessage(result.confirmationMessage);
      setStep('success');
      onCreated();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setSuggestions(err.response.data.suggestions || []);
        setStep('conflict');
      } else {
        setError('Something went wrong scheduling the class');
      }
    } finally {
      setLoading(false);
    }
  }

  function pickSuggestion(time: string) {
    setStartTime(time);
    setStep('form');
  }

  function resetForm() {
    setStep('form');
    setInstructorId('');
    setDayOfWeek('');
    setStartTime('');
    setDurationMinutes('');
    setClassType('');
    setPayRate('');
    setConfirmationMessage('');
    setError('');
  }

  if (instructors.length === 0 && step === 'form') {
    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-md">
        <h2 className="text-lg font-semibold text-indigo-800 mb-2">Add Class</h2>
        <p className="text-sm text-gray-500">Add an instructor first before scheduling a class.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-md">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Add Class</h2>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="instructorId" className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
            <select
              id="instructorId"
              required
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select an instructor</option>
              {instructors.map((inst) => (
                <option key={inst._id} value={inst.instructorId}>
                  {inst.firstName} {inst.lastName} ({inst.instructorId})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                id="dayOfWeek"
                required
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a day</option>
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
              <input
                id="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                id="durationMinutes"
                type="number"
                required
                min={15}
                step={15}
                placeholder="e.g. 60"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="payRate" className="block text-sm font-medium text-gray-700 mb-1">Pay rate ($)</label>
              <input
                id="payRate"
                type="number"
                required
                min={0}
                placeholder="e.g. 30"
                value={payRate}
                onChange={(e) => setPayRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="classType" className="block text-sm font-medium text-gray-700 mb-1">Class type</label>
            <select
              id="classType"
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Checking schedule...' : 'Schedule class'}
          </button>
        </form>
      )}

      {step === 'conflict' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            That slot is already taken on {DAYS[Number(dayOfWeek)]}. Here are some open times instead:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((time) => (
              <button
                key={time}
                onClick={() => pickSuggestion(time)}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-sm"
              >
                {time}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('form')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
          >
            Back
          </button>
        </div>
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
            Schedule another class
          </button>
        </div>
      )}
    </div>
  );
}
