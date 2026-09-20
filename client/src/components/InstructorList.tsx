import { useEffect, useState } from 'react';
import { listInstructors } from '../api/instructors';
import type { Instructor } from '../api/instructors';

export default function InstructorList({ refreshKey }: { refreshKey: number }) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listInstructors()
      .then(setInstructors)
      .finally(() => setLoading(false));
  }, [refreshKey]);

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instructors.map((inst) => (
                <tr key={inst._id} className="even:bg-indigo-50/40">
                  <td className="py-2.5 pl-4 pr-4 text-gray-800 font-medium whitespace-nowrap">
                    {inst.firstName} {inst.lastName}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400 font-mono whitespace-nowrap">{inst.instructorId}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{inst.address}</td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{inst.phone}</td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{inst.email}</td>
                  <td className="py-2.5 pr-4 text-gray-600 capitalize whitespace-nowrap">{inst.preferredContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
