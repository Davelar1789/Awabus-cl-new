export default function AuthLayout({ children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white dark:bg-navy-dark">
      <div className="safe-top flex h-48 shrink-0 items-center justify-center bg-navy">
        <div className="flex items-center gap-2">
          <svg width="40" height="34" viewBox="0 0 32 28" fill="none">
            <path
              d="M4 20V11a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2h-1a3 3 0 0 1-6 0h-6a3 3 0 0 1-6 0H6a2 2 0 0 1-2-2Z"
              fill="#3ed6ac"
            />
            <circle cx="10.5" cy="22.5" r="2" fill="#0b1b2b" />
            <circle cx="21.5" cy="22.5" r="2" fill="#0b1b2b" />
          </svg>
          <span className="text-3xl font-extrabold tracking-wide text-brand-300">AWABUS</span>
        </div>
      </div>
      <div className="safe-bottom flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
