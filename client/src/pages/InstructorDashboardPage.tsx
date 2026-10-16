import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AttendanceForm from '../components/AttendanceForm';
import { listMyClasses } from '../api/classes';
import type { ClassItem } from '../api/classes';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function InstructorDashboardPage() {
  const { logout, email } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    listMyClasses().then(setClasses);
  }, []);

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50 flex flex-col">
      <Header
        right={
          <div className="flex items-center gap-4">
            {email && <span className="text-sm text-gray-600">Signed in as {email}</span>}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Log out
            </button>
          </div>
        }
      />

      <main className="flex-1 p-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-indigo-800 mb-4">Choose a class</h2>
            {classes.length === 0 ? (
              <p className="text-sm text-gray-500">You don't have any classes assigned yet.</p>
            ) : (
              <select
                id="myClass"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.classType} &mdash; {DAY_NAMES[c.dayOfWeek]} at {c.startTime}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedClass && <AttendanceForm key={selectedClass._id} classItem={selectedClass} onDone={() => {}} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
