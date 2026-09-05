import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-dark">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
