import { useEffect, useState } from 'react';
import { listSales } from '../api/sales';
import type { Sale } from '../api/sales';
import { listCustomers } from '../api/customers';
import { listPackages } from '../api/packages';

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

export default function SaleList({ refreshKey }: { refreshKey: number }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [packageNames, setPackageNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([listSales(), listCustomers(), listPackages()])
      .then(([saleList, customerList, packageList]) => {
        setSales(saleList);
        const custNames: Record<string, string> = {};
        customerList.forEach((c) => {
          custNames[c.customerId] = `${c.firstName} ${c.lastName}`;
        });
        setCustomerNames(custNames);
        const pkgNames: Record<string, string> = {};
        packageList.forEach((p) => {
          pkgNames[p.packageId] = p.packageName;
        });
        setPackageNames(pkgNames);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-indigo-800 mb-4">Sales</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : sales.length === 0 ? (
        <p className="text-sm text-gray-500">No sales recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide bg-indigo-50">
                <th className="py-2 pl-4 pr-4">Customer</th>
                <th className="py-2 pr-4">Package</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Mode</th>
                <th className="py-2 pr-4">Payment date</th>
                <th className="py-2 pr-4">Validity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale._id} className="even:bg-indigo-50/40">
                  <td className="py-2.5 pl-4 pr-4 text-gray-800 font-medium whitespace-nowrap">
                    {customerNames[sale.customerId] ?? 'Unknown'}{' '}
                    <span className="text-gray-400 font-mono">({sale.customerId})</span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {packageNames[sale.packageId] ?? 'Unknown'}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">${sale.amountPaid}</td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{sale.modeOfPayment}</td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{formatDateTime(sale.paymentDate)}</td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    {formatDate(sale.validityStartDate)} – {formatDate(sale.validityEndDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
