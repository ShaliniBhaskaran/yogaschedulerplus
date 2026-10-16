import { useEffect, useState } from 'react';
import axios from 'axios';
import { listCustomers, updateCustomer, deleteCustomer } from '../api/customers';
import type { Customer } from '../api/customers';

type EditState = {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
};

function toEditState(cust: Customer): EditState {
  return {
    firstName: cust.firstName,
    lastName: cust.lastName,
    address: cust.address,
    phone: cust.phone,
    email: cust.email,
    preferredContact: cust.preferredContact,
  };
}

export default function CustomerList({ refreshKey }: { refreshKey: number }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function startEdit(cust: Customer) {
    setEditingId(cust.customerId);
    setEditState(toEditState(cust));
    setFieldErrors({});
    setDeletingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
    setFieldErrors({});
  }

  async function saveEdit(customerId: string) {
    if (!editState) return;
    setFieldErrors({});
    setSaving(true);
    try {
      const result = await updateCustomer(customerId, editState);
      setCustomers((prev) => prev.map((c) => (c.customerId === customerId ? result.customer : c)));
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

  async function confirmDelete(customerId: string) {
    setSaving(true);
    try {
      await deleteCustomer(customerId);
      setCustomers((prev) => prev.filter((c) => c.customerId !== customerId));
      setDeletingId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Customers</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-gray-500">No customers yet.</p>
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
                <th className="py-2 pr-4">Class balance</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((cust) =>
                editingId === cust.customerId && editState ? (
                  <tr key={cust._id} className="bg-indigo-50/60 align-top">
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
                    <td className="py-2 pr-4 text-gray-400 font-mono whitespace-nowrap">{cust.customerId}</td>
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
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                      {cust.isUnlimited ? 'Unlimited' : cust.classBalance}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => saveEdit(cust.customerId)}
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
                  <tr key={cust._id} className="even:bg-indigo-50/40">
                    <td className="py-2.5 pl-4 pr-4 text-gray-800 font-medium whitespace-nowrap">
                      {cust.firstName} {cust.lastName}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 font-mono whitespace-nowrap">{cust.customerId}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{cust.address}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{cust.phone}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{cust.email}</td>
                    <td className="py-2.5 pr-4 text-gray-600 capitalize whitespace-nowrap">{cust.preferredContact}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                      {cust.isUnlimited ? 'Unlimited' : cust.classBalance}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap space-x-2">
                      {deletingId === cust.customerId ? (
                        <>
                          <span className="text-xs text-gray-600">Delete?</span>
                          <button
                            onClick={() => confirmDelete(cust.customerId)}
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
                            onClick={() => startEdit(cust)}
                            className="text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-full px-3 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(cust.customerId)}
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
