export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen ">
      <div className="relative hidden w-[38%] shrink-0 items-center justify-center overflow-hidden bg-navy lg:flex">
        <div className="relative flex items-center gap-2.5">
        <div className="relative flex items-center justify-center z-10">
          {/* Same artwork as awabus.svg but with a transparent background, so the
              logo sits directly on the sidebar navy without a differently coloured box. */}
          <img src="/awabus-logo.png" alt="AWABUS Logo" className="h-auto w-52" />
        </div>

        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
