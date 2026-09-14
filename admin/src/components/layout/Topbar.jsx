import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, UserCircle } from 'lucide-react';
import { useTopbarStore } from '../../store/topbarStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUiStore } from '../../store/uiStore.js';
import Avatar from '../ui/Avatar.jsx';

export default function Topbar() {
  const { breadcrumb, searchValue, searchPlaceholder, onSearchChange } = useTopbarStore();
  const { admin, logout } = useAuthStore();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-navy-light">
      <button
        onClick={toggleSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav className="hidden shrink-0 items-center gap-1.5 text-sm md:flex">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
            <span
              className={
                i === breadcrumb.length - 1
                  ? 'font-bold text-slate-900 dark:text-white'
                  : 'text-slate-400 dark:text-slate-500'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="mx-auto flex max-w-lg flex-1 items-center">
        {onSearchChange && (
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-navy dark:text-slate-100"
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-navy dark:text-slate-300 dark:hover:bg-slate-800">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                {admin?.name || 'Admin'}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <Avatar name={admin?.name} src={admin?.avatarUrl} size="sm" />
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-700 dark:bg-navy-light">
              <button
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy"
              >
                <UserCircle className="h-4 w-4" /> My profile
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy"
              >
                <Settings className="h-4 w-4" /> Account settings
              </button>
              <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}