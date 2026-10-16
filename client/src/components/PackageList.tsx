import { useEffect, useState } from 'react';
import axios from 'axios';
import { listPackages, updatePackage, deletePackage } from '../api/packages';
import type { PackageItem } from '../api/packages';

type EditState = {
  packageName: string;
  packageCategory: 'General' | 'Senior';
  numberOfClasses: '1' | '4' | '10' | 'unlimited';
  classType: 'General' | 'Special';
  startDate: string;
  endDate: string;
  price: number;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function toDateInputValue(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function toEditState(pkg: PackageItem): EditState {
  return {
    packageName: pkg.packageName,
    packageCategory: pkg.packageCategory,
    numberOfClasses: pkg.numberOfClasses,
    classType: pkg.classType,
    startDate: toDateInputValue(pkg.startDate),
    endDate: toDateInputValue(pkg.endDate),
    price: pkg.price,
  };
}

export default function PackageList({ refreshKey }: { refreshKey: number }) {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listPackages()
      .then(setPackages)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function startEdit(pkg: PackageItem) {
    setEditingId(pkg.packageId);
    setEditState(toEditState(pkg));
    setFieldError('');
    setDeletingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
    setFieldError('');
  }

  async function saveEdit(packageId: string) {
    if (!editState) return;
    setFieldError('');

    if (editState.endDate <= editState.startDate) {
      setFieldError('End date must be after the start date');
      return;
    }

    setSaving(true);
    try {
      const result = await updatePackage(packageId, editState);
      setPackages((prev) => prev.map((p) => (p.packageId === packageId ? result.package : p)));
      setEditingId(null);
      setEditState(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && Array.isArray(err.response.data?.missing)) {
        const missing: string[] = err.response.data.missing;
        if (missing.includes('endDate')) {
          setFieldError('End date must be after the start date');
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(packageId: string) {
    setSaving(true);
    try {
      await deletePackage(packageId);
      setPackages((prev) => prev.filter((p) => p.packageId !== packageId));
      setDeletingId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Packages</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : packages.length === 0 ? (
        <p className="text-sm text-gray-500">No packages yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide bg-indigo-50">
                <th className="py-2 pl-4 pr-4">Name</th>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4"># Classes</th>
                <th className="py-2 pr-4">Class type</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">End</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg) =>
                editingId === pkg.packageId && editState ? (
                  <tr key={pkg._id} className="bg-indigo-50/60 align-top">
                    <td className="py-2 pl-4 pr-4">
                      <input
                        value={editState.packageName}
                        onChange={(e) => setEditState({ ...editState, packageName: e.target.value })}
                        className="w-32 rounded border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="py-2 pr-4 text-gray-400 font-mono whitespace-nowrap">{pkg.packageId}</td>
                    <td className="py-2 pr-4">
                      <select
                        value={editState.packageCategory}
                        onChange={(e) =>
                          setEditState({ ...editState, packageCategory: e.target.value as 'General' | 'Senior' })
                        }
                        className="rounded border border-gray-300 px-2 py-1"
                      >
                        <option value="General">General</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={editState.numberOfClasses}
                        onChange={(e) =>
                          setEditState({
                            ...editState,
                            numberOfClasses: e.target.value as '1' | '4' | '10' | 'unlimited',
                          })
                        }
                        className="rounded border border-gray-300 px-2 py-1"
                      >
                        <option value="1">1</option>
                        <option value="4">4</option>
                        <option value="10">10</option>
                        <option value="unlimited">Unlimited</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={editState.classType}
                        onChange={(e) =>
                          setEditState({ ...editState, classType: e.target.value as 'General' | 'Special' })
                        }
                        className="rounded border border-gray-300 px-2 py-1"
                      >
                        <option value="General">General</option>
                        <option value="Special">Special</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="date"
                        value={editState.startDate}
                        onChange={(e) => setEditState({ ...editState, startDate: e.target.value })}
                        className="w-36 rounded border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="date"
                        value={editState.endDate}
                        onChange={(e) => setEditState({ ...editState, endDate: e.target.value })}
                        className="w-36 rounded border border-gray-300 px-2 py-1"
                      />
                      {fieldError && <p className="text-xs text-red-600 mt-0.5">{fieldError}</p>}
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        min={0}
                        value={editState.price}
                        onChange={(e) => setEditState({ ...editState, price: Number(e.target.value) })}
                        className="w-20 rounded border border-gray-300 px-2 py-1"
                      />
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => saveEdit(pkg.packageId)}
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
                  <tr key={pkg._id} className="even:bg-indigo-50/40">
                    <td className="py-2.5 pl-4 pr-4 text-gray-800 font-medium whitespace-nowrap">{pkg.packageName}</td>
                    <td className="py-2.5 pr-4 text-gray-400 font-mono whitespace-nowrap">{pkg.packageId}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{pkg.packageCategory}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap capitalize">{pkg.numberOfClasses}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{pkg.classType}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{formatDate(pkg.startDate)}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{formatDate(pkg.endDate)}</td>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">${pkg.price}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap space-x-2">
                      {deletingId === pkg.packageId ? (
                        <>
                          <span className="text-xs text-gray-600">Delete?</span>
                          <button
                            onClick={() => confirmDelete(pkg.packageId)}
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
                            onClick={() => startEdit(pkg)}
                            className="text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-full px-3 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(pkg.packageId)}
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
