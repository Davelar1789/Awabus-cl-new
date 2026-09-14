export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-navy-dark">
      <div className="relative hidden w-[38%] shrink-0 items-center justify-center overflow-hidden bg-navy lg:flex">
        <div className="absolute -left-10 top-1/3 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <svg width="44" height="38" viewBox="0 0 32 28" fill="none">
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
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
