export default function BrandIcon({ small = false }: { small?: boolean }) {
  const outerSize = small ? 'h-9 w-9' : 'h-12 w-12';
  const iconSize = small ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div className={`flex items-center justify-center rounded-full bg-green-100 ${outerSize}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className={`text-green-600 ${iconSize}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21c-4.5-2-7.5-5.5-7.5-9.5A7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 7.5 7.5c0 4-3 7.5-7.5 9.5Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 13c-2-2-3-2-4.5-1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c2-2 3-2 4.5-1" />
      </svg>
    </div>
  );
}
