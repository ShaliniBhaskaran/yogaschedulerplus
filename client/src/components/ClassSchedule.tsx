import { useEffect, useState } from 'react';
import axios from 'axios';
import { listClasses, updateClass, deleteClass } from '../api/classes';
import type { ClassItem } from '../api/classes';
import { listInstructors } from '../api/instructors';
import type { Instructor } from '../api/instructors';
import { DAYS } from '../constants';

type EditState = {
  instructorId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  classType: 'General' | 'Special';
  payRate: number;
};

function toEditState(c: ClassItem): EditState {
  return {
    instructorId: c.instructorId,
    dayOfWeek: c.dayOfWeek,
    startTime: c.startTime,
    durationMinutes: c.durationMinutes,
    classType: c.classType,
    payRate: c.payRate,
  };
}

export default function ClassSchedule({ refreshKey }: { refreshKey: number }) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [conflictError, setConflictError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([listClasses(), listInstructors()])
      .then(([classList, instructorList]) => {
        setClasses(classList);
        setInstructors(instructorList);
        const names: Record<string, string> = {};
        instructorList.forEach((inst) => {
          names[inst.instructorId] = `${inst.firstName} ${inst.lastName}`;
        });
        setInstructorNames(names);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function startEdit(c: ClassItem) {
    setEditingId(c._id);
    setEditState(toEditState(c));
    setConflictError('');
    setDeletingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
    setConflictError('');
  }

  async function saveEdit(id: string) {
    if (!editState) return;
    setConflictError('');
    setSaving(true);
    try {
      const result = await updateClass(id, editState);
      setClasses((prev) => prev.map((c) => (c._id === id ? result.class : c)));
      setEditingId(null);
      setEditState(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const suggestions: string[] = err.response.data?.suggestions || [];
        setConflictError(
          suggestions.length > 0
            ? `That slot is taken. Open times that day: ${suggestions.join(', ')}`
            : 'That slot is taken and no open times were found that day.'
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    setSaving(true);
    try {
      await deleteClass(id);
      setClasses((prev) => prev.filter((c) => c._id !== id));
      setDeletingId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Class Schedule</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-gray-500">No classes scheduled yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide bg-indigo-50">
                <th className="py-2 pl-4 pr-4">Day</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Instructor</th>
                <th className="py-2 pr-4">Pay rate</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map((c) =>
                editingId === c._id && editState ? (
                  <tr key={c._id} className="bg-indigo-50/60 align-top">
                    <td className="py-2 pl-4 pr-4" colSpan={6}>
                      <div className="flex flex-wrap items-start gap-3">
                        <select
                          value={editState.dayOfWeek}
                          onChange={(e) => setEditState({ ...editState, dayOfWeek: Number(e.target.value) })}
                          className="rounded border border-gray-300 px-2 py-1"
                        >
                          {DAYS.map((day, i) => (
                            <option key={i} value={i}>{day}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={editState.startTime}
                          onChange={(e) => setEditState({ ...editState, startTime: e.target.value })}
                          className="rounded border border-gray-300 px-2 py-1"
                        />
                        <input
                          type="number"
                          min={15}
                          step={15}
                          value={editState.durationMinutes}
                          onChange={(e) => setEditState({ ...editState, durationMinutes: Number(e.target.value) })}
                          className="w-20 rounded border border-gray-300 px-2 py-1"
                          title="Duration (min)"
                        />
                        <select
                          value={editState.classType}
                          onChange={(e) => setEditState({ ...editState, classType: e.target.value as 'General' | 'Special' })}
                          className="rounded border border-gray-300 px-2 py-1"
                        >
                          <option value="General">General</option>
                          <option value="Special">Special</option>
                        </select>
                        <select
                          value={editState.instructorId}
                          onChange={(e) => setEditState({ ...editState, instructorId: e.target.value })}
                          className="rounded border border-gray-300 px-2 py-1"
                        >
                          {instructors.map((inst) => (
                            <option key={inst._id} value={inst.instructorId}>
                              {inst.firstName} {inst.lastName}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={editState.payRate}
                          onChange={(e) => setEditState({ ...editState, payRate: Number(e.target.value) })}
                          className="w-20 rounded border border-gray-300 px-2 py-1"
                          title="Pay rate ($)"
                        />
                        <button
                          onClick={() => saveEdit(c._id)}
                          disabled={saving}
                          className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full px-3 py-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                      {conflictError && <p className="text-xs text-red-600 mt-2">{conflictError}</p>}
                    </td>
                  </tr>
                ) : (
                  <tr key={c._id} className="even:bg-indigo-50/40">
                    <td className="py-2.5 pl-4 pr-4 text-gray-800 font-medium whitespace-nowrap">{DAYS[c.dayOfWeek]}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{c.startTime}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{c.durationMinutes} min</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{c.classType}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                      {instructorNames[c.instructorId] ?? 'Unknown'}{' '}
                      <span className="text-gray-400 font-mono">({c.instructorId})</span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">${c.payRate}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap space-x-2">
                      {deletingId === c._id ? (
                        <>
                          <span className="text-xs text-gray-600">Delete?</span>
                          <button
                            onClick={() => confirmDelete(c._id)}
                            disabled={saving}
                            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-full px-3 py-1"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            disabled={saving}
                            className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-full px-3 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(c._id)}
                            className="text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-full px-3 py-1"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
