import { useEffect, useState } from 'react';
import { listClasses } from '../api/classes';
import type { ClassItem } from '../api/classes';
import { listInstructors } from '../api/instructors';
import { DAYS } from '../constants';

export default function ClassSchedule({ refreshKey }: { refreshKey: number }) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([listClasses(), listInstructors()])
      .then(([classList, instructorList]) => {
        setClasses(classList);
        const names: Record<string, string> = {};
        instructorList.forEach((inst) => {
          names[inst.instructorId] = `${inst.firstName} ${inst.lastName}`;
        });
        setInstructorNames(names);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map((c) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
