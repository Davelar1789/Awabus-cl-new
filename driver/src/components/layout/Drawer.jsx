import { NavLink } from 'react-router-dom';
import {
  Home,
  Waypoints,
  History,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useConnectionStore } from '../../store/connectionStore.js';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { cn } from '../../lib/utils.js';

const NAV_ITEMS = [
  { to: '/', label: 'Home (pre-trip)', icon: Home, end: true },
  { to: '/trip/active', label: 'Active trip', icon: Waypoints },
  { to: '/trip-history', label: 'Trip history', icon: History },
  { to: '/broadcast-history', label: 'Broadcast history', icon: MessageSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help & support', icon: HelpCircle },
];

export default function Drawer() {
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const { driver, logout } = useAuthStore();
  const isOnline = useConnectionStore((s) => s.isOnline);

  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={closeDrawer} aria-hidden="true" />
      )}
      <aside
        className={cn(
          'safe-top safe-bottom fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-navy text-white transition-transform duration-300 ease-in-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-start justify-between px-5 pt-6">
          <Avatar name={driver?.name} src={driver?.profilePhotoUrl} size="md" />
          <div className="flex items-center gap-2">
            <Badge tone={isOnline ? 'success' : 'neutral'} className={isOnline ? '' : 'bg-white/15 text-white'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <button onClick={closeDrawer} className="rounded-lg p-1 hover:bg-white/10" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-4 pt-3">
          <p className="text-lg font-bold">{driver?.name || 'Driver'}</p>
          <p className="text-sm text-slate-400">
            Primary Driver{driver?.assignedBus ? ` • Bus ${driver.assignedBus.plateNumber}` : ''}
          </p>
        </div>

        <div className="h-px bg-white/10" />

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeDrawer}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'bg-white/10 text-brand-300' : 'text-slate-200 hover:bg-white/5'
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="h-px bg-white/10" />

        <button
          onClick={logout}
          className="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-red-400 hover:bg-white/5"
        >
          <LogOut className="h-[18px] w-[18px]" /> Log out
        </button>
        <p className="px-5 pb-4 text-xs text-slate-500">AwaBus Driver v1.0.0</p>
      </aside>
    </>
  );
}
