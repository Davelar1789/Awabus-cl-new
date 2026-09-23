import { Outlet } from 'react-router-dom';
import Drawer from './Drawer.jsx';

// Wraps every authenticated screen. Individual pages render their own
// <Header> (some need a back arrow, the active-trip screen needs a custom
// colored header) so this shell just owns the drawer + scroll container.
export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-dark">
      <Drawer />
      <div className="mx-auto min-h-screen max-w-md bg-slate-100 pb-8 dark:bg-navy-dark">
        <Outlet />
      </div>
    </div>
  );
}
