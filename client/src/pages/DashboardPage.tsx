import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InstructorForm from '../components/InstructorForm';
import InstructorList from '../components/InstructorList';
import ClassForm from '../components/ClassForm';
import ClassSchedule from '../components/ClassSchedule';
import PackageForm from '../components/PackageForm';
import PackageList from '../components/PackageList';
import CustomerForm from '../components/CustomerForm';
import CustomerList from '../components/CustomerList';
import SaleForm from '../components/SaleForm';
import SaleList from '../components/SaleList';
import ReportsPanel from '../components/ReportsPanel';

type Tab = 'instructors' | 'classes' | 'packages' | 'customers' | 'sales' | 'reports';

const TABS: { key: Tab; label: string }[] = [
  { key: 'instructors', label: 'Instructors' },
  { key: 'classes', label: 'Classes' },
  { key: 'packages', label: 'Packages' },
  { key: 'customers', label: 'Customers' },
  { key: 'sales', label: 'Sales' },
  { key: 'reports', label: 'Reports' },
];

export default function DashboardPage() {
  const { logout, email } = useAuth();
  const [tab, setTab] = useState<Tab>('instructors');
  const [instructorRefreshKey, setInstructorRefreshKey] = useState(0);
  const [classRefreshKey, setClassRefreshKey] = useState(0);
  const [packageRefreshKey, setPackageRefreshKey] = useState(0);
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);
  const [saleRefreshKey, setSaleRefreshKey] = useState(0);

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
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage instructors, classes, packages, customers, and sales.</p>
          </div>

          <nav className="flex gap-2 flex-wrap" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-sm font-medium px-4 py-2 rounded-full transition ${
                  tab === t.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

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

          {tab === 'packages' && (
            <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
              <PackageForm onCreated={() => setPackageRefreshKey((k) => k + 1)} />
              <PackageList refreshKey={packageRefreshKey} />
            </div>
          )}

          {tab === 'customers' && (
            <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
              <CustomerForm onCreated={() => setCustomerRefreshKey((k) => k + 1)} />
              <CustomerList refreshKey={customerRefreshKey} />
            </div>
          )}

          {tab === 'sales' && (
            <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
              <SaleForm onCreated={() => setSaleRefreshKey((k) => k + 1)} />
              <SaleList refreshKey={saleRefreshKey} />
            </div>
          )}

          {tab === 'reports' && <ReportsPanel />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
