import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InstructorForm from '../components/InstructorForm';
import InstructorList from '../components/InstructorList';
import ClassForm from '../components/ClassForm';
import ClassSchedule from '../components/ClassSchedule';

type Tab = 'instructors' | 'classes';

export default function DashboardPage() {
  const { logout, email } = useAuth();
  const [tab, setTab] = useState<Tab>('instructors');
  const [instructorRefreshKey, setInstructorRefreshKey] = useState(0);
  const [classRefreshKey, setClassRefreshKey] = useState(0);

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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-6" aria-label="Sections">
              <button
                onClick={() => setTab('instructors')}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  tab === 'instructors'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Instructors
              </button>
              <button
                onClick={() => setTab('classes')}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  tab === 'classes'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Classes
              </button>
            </nav>
          </div>

          {tab === 'instructors' && (
            <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
              <InstructorForm onCreated={() => setInstructorRefreshKey((k) => k + 1)} />
              <InstructorList refreshKey={instructorRefreshKey} />
            </div>
          )}

          {tab === 'classes' && (
            <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
              <ClassForm onCreated={() => setClassRefreshKey((k) => k + 1)} />
              <ClassSchedule refreshKey={classRefreshKey} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
