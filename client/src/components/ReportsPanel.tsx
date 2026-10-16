import { useEffect, useState } from 'react';
import {
  getPackageSalesReport,
  getInstructorsReport,
  getCustomersReport,
  getTeacherPaymentsReport,
} from '../api/reports';
import type {
  PackageSalesReport,
  InstructorReportRow,
  CustomerReportRow,
  TeacherPaymentRow,
} from '../api/reports';

type ReportTab = 'package-sales' | 'instructors' | 'customers' | 'teacher-payments';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  future: 'bg-blue-100 text-blue-700',
  expired: 'bg-gray-200 text-gray-600',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function formatMonth(month: string) {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl p-4 border ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-500 py-6 text-center">{message}</p>;
}

function PackageSalesTable() {
  const [report, setReport] = useState<PackageSalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPackageSalesReport()
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyState message="Loading..." />;
  if (!report || report.rows.length === 0) return <EmptyState message="No package sales yet." />;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Total revenue" value={`$${report.totalRevenue.toFixed(2)}`} accent="bg-indigo-50 border-indigo-200 text-indigo-800" />
        <StatCard label="Packages sold" value={String(report.rows.reduce((s, r) => s + r.timesSold, 0))} accent="bg-green-50 border-green-200 text-green-800" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide bg-indigo-50">
              <th className="py-2 pl-4 pr-4">Package</th>
              <th className="py-2 pr-4">Times sold</th>
              <th className="py-2 pr-4">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {report.rows.map((row) => (
              <tr key={row.packageId} className="even:bg-indigo-50/40">
                <td className="py-2.5 pl-4 pr-4 text-gray-800 font-medium whitespace-nowrap">
                  {row.packageName} <span className="text-gray-400 font-mono">({row.packageId})</span>
                </td>
                <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{row.timesSold}</td>
                <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">${row.totalRevenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InstructorsTable() {
  const [rows, setRows] = useState<InstructorReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getInstructorsReport()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyState message="Loading..." />;
  if (rows.length === 0) return <EmptyState message="No instructors yet." />;

  return (
    <div className="space-y-4">
      {rows.map((instr) => (
        <div key={instr.instructorId} className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-indigo-50 px-4 py-2.5">
            <p className="font-semibold text-indigo-800">
              {instr.name} <span className="text-gray-400 font-mono text-xs">({instr.instructorId})</span>
            </p>
            <span className="text-xs font-semibold text-indigo-700 bg-white rounded-full px-3 py-1 border border-indigo-200">
              {instr.totalCheckIns} total check-ins
            </span>
          </div>
          {instr.classes.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-3">No classes scheduled.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pl-4 pr-4">Day</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Check-ins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instr.classes.map((c) => (
                  <tr key={c.classId} className="even:bg-gray-50">
                    <td className="py-2 pl-4 pr-4 text-gray-700 whitespace-nowrap">{DAY_NAMES[c.dayOfWeek]}</td>
                    <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">{c.startTime}</td>
                    <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">{c.classType}</td>
                    <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">{c.checkIns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

function CustomersTable() {
  const [rows, setRows] = useState<CustomerReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCustomersReport()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyState message="Loading..." />;
  if (rows.length === 0) return <EmptyState message="No customers yet." />;

  return (
    <div className="space-y-4">
      {rows.map((cust) => (
        <div key={cust.customerId} className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-indigo-50 px-4 py-2.5">
            <p className="font-semibold text-indigo-800">
              {cust.name} <span className="text-gray-400 font-mono text-xs">({cust.customerId})</span>
            </p>
            <span className="text-xs font-semibold text-indigo-700 bg-white rounded-full px-3 py-1 border border-indigo-200">
              Balance: {cust.isUnlimited ? 'Unlimited' : cust.classBalance}
            </span>
          </div>
          {cust.packages.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-3">No packages purchased.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pl-4 pr-4">Package</th>
                  <th className="py-2 pr-4">Valid from</th>
                  <th className="py-2 pr-4">Valid to</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cust.packages.map((p, i) => (
                  <tr key={`${p.packageId}-${i}`} className="even:bg-gray-50">
                    <td className="py-2 pl-4 pr-4 text-gray-700 whitespace-nowrap">{p.packageName}</td>
                    <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">{formatDate(p.validityStartDate)}</td>
                    <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">{formatDate(p.validityEndDate)}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 capitalize ${STATUS_STYLES[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

function TeacherPaymentsTable() {
  const [rows, setRows] = useState<TeacherPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTeacherPaymentsReport()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyState message="Loading..." />;
  if (rows.length === 0) return <EmptyState message="No instructors yet." />;

  return (
    <div className="space-y-4">
      {rows.map((instr) => (
        <div key={instr.instructorId} className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-indigo-50 px-4 py-2.5">
            <p className="font-semibold text-indigo-800">
              {instr.name} <span className="text-gray-400 font-mono text-xs">({instr.instructorId})</span>
            </p>
            <span className="text-xs font-semibold text-indigo-700 bg-white rounded-full px-3 py-1 border border-indigo-200">
              Total: ${instr.months.reduce((s, m) => s + m.totalPay, 0).toFixed(2)}
            </span>
          </div>
          {instr.months.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-3">No classes held yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pl-4 pr-4">Month</th>
                  <th className="py-2 pr-4">Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instr.months.map((m) => (
                  <tr key={m.month} className="even:bg-gray-50">
                    <td className="py-2 pl-4 pr-4 text-gray-700 whitespace-nowrap">{formatMonth(m.month)}</td>
                    <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">${m.totalPay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

const SUB_TABS: { key: ReportTab; label: string }[] = [
  { key: 'package-sales', label: 'Package Sales' },
  { key: 'instructors', label: 'Instructors' },
  { key: 'customers', label: 'Customers' },
  { key: 'teacher-payments', label: 'Teacher Payments' },
];

export default function ReportsPanel() {
  const [subTab, setSubTab] = useState<ReportTab>('package-sales');

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Studio Reports</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`text-sm font-medium px-3.5 py-1.5 rounded-full transition ${
              subTab === t.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {subTab === 'package-sales' && <PackageSalesTable />}
      {subTab === 'instructors' && <InstructorsTable />}
      {subTab === 'customers' && <CustomersTable />}
      {subTab === 'teacher-payments' && <TeacherPaymentsTable />}
    </div>
  );
}
