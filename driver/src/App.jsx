// Placeholder entry point. The AwaBus Driver App screens (login, today's trip,
// live GPS sharing, student check-in/drop-off) have not been designed/built
// yet — this scaffold exists so the project can be picked up without any
// tooling setup, wired straight into the already-live server API at
// /api/driver-app (see src/api/driverApp.js).
export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex items-center gap-2">
        <svg width="36" height="30" viewBox="0 0 32 28" fill="none">
          <path
            d="M4 20V11a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2h-1a3 3 0 0 1-6 0h-6a3 3 0 0 1-6 0H6a2 2 0 0 1-2-2Z"
            fill="#3ed6ac"
          />
          <circle cx="10.5" cy="22.5" r="2" fill="#0b1b2b" />
          <circle cx="21.5" cy="22.5" r="2" fill="#0b1b2b" />
        </svg>
        <span className="text-2xl font-extrabold tracking-wide text-brand-300">AWABUS</span>
      </div>
      <h1 className="text-xl font-bold text-white">Driver App — Coming Soon</h1>
      <p className="max-w-sm text-sm text-slate-400">
        This app isn't built yet. The server API it will talk to (auth, today's trip, GPS
        streaming, student attendance) is already live at <code>/api/driver-app</code>.
      </p>
    </div>
  );
}
