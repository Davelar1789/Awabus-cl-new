import { ArrowLeft, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore.js';

// Standard navy app-bar. `back` shows a back arrow instead of the hamburger.
export default function Header({ title, back = false, right }) {
  const navigate = useNavigate();
  const openDrawer = useUiStore((s) => s.openDrawer);

  return (
    <header className="safe-top sticky top-0 z-30 flex h-16 items-center gap-3 bg-navy px-4 text-white">
      <button
        onClick={back ? () => navigate(-1) : openDrawer}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"
        aria-label={back ? 'Back' : 'Open menu'}
      >
        {back ? <ArrowLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right || (
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/10" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
      )}
    </header>
  );
}
