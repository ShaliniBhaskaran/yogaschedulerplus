import { useEffect, useState } from 'react';
import axios from 'axios';
import { listInstructors, updateInstructor, deleteInstructor } from '../api/instructors';
import type { Instructor } from '../api/instructors';

type EditState = {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
};

function toEditState(inst: Instructor): EditState {
  return {
    firstName: inst.firstName,
    lastName: inst.lastName,
    address: inst.address,
    phone: inst.phone,
    email: inst.email,
    preferredContact: inst.preferredContact,
  };
}

export default function InstructorList({ refreshKey }: { refreshKey: number }) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listInstructors()
      .then(setInstructors)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function startEdit(inst: Instructor) {
    setEditingId(inst.instructorId);
    setEditState(toEditState(inst));
    setFieldErrors({});
    setDeletingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
    setFieldErrors({});
  }

  async function saveEdit(instructorId: string) {
    if (!editState) return;
    setFieldErrors({});
    setSaving(true);
    try {
      const result = await updateInstructor(instructorId, editState);
      setInstructors((prev) => prev.map((i) => (i.instructorId === instructorId ? result.instructor : i)));
      setEditingId(null);
      setEditState(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && Array.isArray(err.response.data?.missing)) {
        const missing: string[] = err.response.data.missing;
        setFieldErrors({
          phone: missing.includes('phone') ? 'Invalid format' : undefined,
          email: missing.includes('email') ? 'Invalid format' : undefined,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(instructorId: string) {
    setSaving(true);
    try {
      await deleteInstructor(instructorId);
      setInstructors((prev) => prev.filter((i) => i.instructorId !== instructorId));
      setDeletingId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Instructors</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : instructors.length === 0 ? (
        <p className="text-sm text-gray-500">No instructors yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide bg-indigo-50">
                <th className="py-2 pl-4 pr-4">Name</th>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Address</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Preferred contact</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instructors.map((inst) =>
                editingId === inst.instructorId && editState ? (
                  <tr key={inst._id} className="bg-indigo-50/60 align-top">
                    <td className="py-2 pl-4 pr-4">
                      <input
                        value={editState.firstName}
                        onChange={(e) => setEditState({ ...editState, firstName: e.target.value })}
                        className="w-24 rounded border border-gray-300 px-2 py-1"
                      />
                      <input
                        value={editState.lastName}
                        onChange={(e) => setEditState({ ...editState, lastName: e.target.value })}
                        className="w-24 rounded border border-gray-300 px-2 py-1 mt-1"
                      />
                    </td>
                    <td className="py-2 pr-4 text-gray-400 font-mono whitespace-nowrap">{inst.instructorId}</td>
                    <td className="py-2 pr-4">
                      <input
                        value={editState.address}
                        onChange={(e) => setEditState({ ...editState, address: e.target.value })}
                        className="w-32 rounded border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        value={editState.phone}
                        onChange={(e) => setEditState({ ...editState, phone: e.target.value })}
                        className="w-28 rounded border border-gray-300 px-2 py-1"
                      />
                      {fieldErrors.phone && <p className="text-xs text-red-600 mt-0.5">{fieldErrors.phone}</p>}
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        value={editState.email}
                        onChange={(e) => setEditState({ ...editState, email: e.target.value })}
                        className="w-36 rounded border border-gray-300 px-2 py-1"
                      />
                      {fieldErrors.email && <p className="text-xs text-red-600 mt-0.5">{fieldErrors.email}</p>}
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={editState.preferredContact}
                        onChange={(e) =>
                          setEditState({ ...editState, preferredContact: e.target.value as 'phone' | 'email' })
                        }
                        className="rounded border border-gray-300 px-2 py-1"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => saveEdit(inst.instructorId)}
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
                    </td>
                  </tr>
                ) : (
                  <tr key={inst._id} className="even:bg-indigo-50/40">
                    <td className="py-2.5 pl-4 pr-4 text-gray-800 font-medium whitespace-nowrap">
                      {inst.firstName} {inst.lastName}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 font-mono whitespace-nowrap">{inst.instructorId}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{inst.address}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{inst.phone}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{inst.email}</td>
                    <td className="py-2.5 pr-4 text-gray-600 capitalize whitespace-nowrap">{inst.preferredContact}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap space-x-2">
                      {deletingId === inst.instructorId ? (
                        <>
                          <span className="text-xs text-gray-600">Delete?</span>
                          <button
                            onClick={() => confirmDelete(inst.instructorId)}
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
                            onClick={() => startEdit(inst)}
                            className="text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-full px-3 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(inst.instructorId)}
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
