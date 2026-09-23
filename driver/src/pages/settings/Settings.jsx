import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Card from '../../components/ui/Card.jsx';
import Switch from '../../components/ui/Switch.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import { useUiStore } from '../../store/uiStore.js';
import { cn } from '../../lib/utils.js';

const SectionLabel = ({ children }) => (
  <p className="mb-2 mt-6 px-1 text-xs font-bold uppercase tracking-wide text-slate-400 first:mt-0">{children}</p>
);

const Row = ({ label, right, onClick, className }) => {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between border-b border-slate-100 px-4 py-4 text-left last:border-0 dark:border-slate-800',
        className
      )}
    >
      <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
      {right}
    </Comp>
  );
};

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const CACHE_OPTIONS = [20, 50, 100];

export default function Settings() {
  const prefs = useUiStore();
  const { setPref } = prefs;
  const [themeOpen, setThemeOpen] = useState(false);
  const [cacheOpen, setCacheOpen] = useState(false);
  const [legal, setLegal] = useState(null); // 'terms' | 'privacy' | null

  return (
    <div>
      <Header title="Settings" back />
      <div className="p-4">
        <SectionLabel>General</SectionLabel>
        <Card className="p-0">
          <Row label="Notification sounds" right={<Switch checked={prefs.notificationSounds} onChange={(v) => setPref('notificationSounds', v)} />} />
          <Row label="Vibration" right={<Switch checked={prefs.vibration} onChange={(v) => setPref('vibration', v)} />} />
          <Row
            label="Theme"
            onClick={() => setThemeOpen(true)}
            right={
              <span className="flex items-center gap-1 text-slate-400">
                {THEME_OPTIONS.find((t) => t.value === prefs.theme)?.label}
                <ChevronRight className="h-4 w-4" />
              </span>
            }
          />
        </Card>

        <SectionLabel>Data &amp; sync</SectionLabel>
        <Card className="p-0">
          <Row
            label="Auto-sync on mobile data"
            right={<Switch checked={prefs.autoSyncOnMobileData} onChange={(v) => setPref('autoSyncOnMobileData', v)} />}
          />
          <Row
            label="Offline cache limit"
            onClick={() => setCacheOpen(true)}
            right={
              <span className="flex items-center gap-1 text-slate-400">
                {prefs.offlineCacheLimitTrips} trips
                <ChevronRight className="h-4 w-4" />
              </span>
            }
          />
        </Card>

        <SectionLabel>About</SectionLabel>
        <Card className="p-0">
          <Row label="App version" right={<span className="text-slate-400">v1.0.0 (Production)</span>} />
          <Row label="Terms and conditions" onClick={() => setLegal('terms')} right={<ChevronRight className="h-4 w-4 text-slate-400" />} />
          <Row label="Privacy policy" onClick={() => setLegal('privacy')} right={<ChevronRight className="h-4 w-4 text-slate-400" />} />
        </Card>

        <p className="mt-4 px-1 text-xs text-slate-400">
          Your offline logs use standard secure device cache. Mobile data parameters can be adjusted in Data &amp;
          sync above.
        </p>
      </div>

      <Modal open={themeOpen} onClose={() => setThemeOpen(false)}>
        <h2 className="mb-4 text-lg font-extrabold text-slate-900 dark:text-white">Theme</h2>
        <div className="space-y-2">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setPref('theme', t.value);
                setThemeOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
            >
              {t.label}
              {prefs.theme === t.value && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={cacheOpen} onClose={() => setCacheOpen(false)}>
        <h2 className="mb-4 text-lg font-extrabold text-slate-900 dark:text-white">Offline cache limit</h2>
        <div className="space-y-2">
          {CACHE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => {
                setPref('offlineCacheLimitTrips', n);
                setCacheOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
            >
              {n} trips
              {prefs.offlineCacheLimitTrips === n && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={Boolean(legal)} onClose={() => setLegal(null)}>
        <h2 className="mb-3 text-lg font-extrabold capitalize text-slate-900 dark:text-white">
          {legal === 'terms' ? 'Terms and conditions' : 'Privacy policy'}
        </h2>
        <p className="max-h-64 overflow-y-auto text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {legal === 'terms'
            ? 'By using the AwaBus Driver app you agree to operate assigned vehicles safely, keep student attendance and trip records accurate, and use in-app broadcast tools only for legitimate trip-related communication with parents.'
            : 'AwaBus collects trip GPS data, attendance records, and broadcast logs solely to keep parents and school administrators informed of student transport status. Location data is only recorded while a trip is active.'}
        </p>
        <Button className="mt-5 w-full" variant="outline" onClick={() => setLegal(null)}>
          Close
        </Button>
      </Modal>
    </div>
  );
}
