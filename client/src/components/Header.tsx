import type { ReactNode } from 'react';
import BrandIcon from './BrandIcon';

export default function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="bg-gradient-to-r from-indigo-100 via-white to-green-100 border-b border-indigo-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandIcon small />
          <div>
            <p className="text-sm font-semibold text-indigo-800 leading-tight">Yoga Scheduler Plus</p>
            <p className="text-xs text-gray-500 leading-tight">Yoga'Hom Manager Portal</p>
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
