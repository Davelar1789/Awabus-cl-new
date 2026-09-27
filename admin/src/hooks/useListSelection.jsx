import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckSquare, Trash2, X } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { cn } from '../lib/utils.js';

const HOLD_MS = 500;

function SelectBox({ checked, indeterminate = false, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'flex h-5 w-5 items-center justify-center rounded border transition-colors',
        checked || indeterminate
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-300 bg-white hover:border-brand-500 dark:border-slate-600 dark:bg-navy-light'
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5l3 3 7-7" />
        </svg>
      )}
      {!checked && indeterminate && <span className="h-0.5 w-2.5 rounded bg-white" />}
    </button>
  );
}

/**
 * Multi-select for a list page. Select mode starts from the "Select" button or
 * by pressing and holding a row. While selecting, clicking a row ticks it
 * instead of opening it, and a bar at the bottom offers Delete.
 *
 * Deletes run one by one through the page's normal delete call, so every
 * existing safety rule still applies; anything that can't be deleted is
 * reported with the reason.
 */
export default function useListSelection({ items, getLabel, deleteOne, noun, singular, invalidate = [] }) {
  const queryClient = useQueryClient();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Map()); // id -> item (kept across pages)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(null); // { done, total }
  const [report, setReport] = useState(null); // { deleted, failed: [{ label, message }] }
  const holdTimer = useRef(null);
  const heldRef = useRef(false);

  const stop = useCallback(() => {
    setSelecting(false);
    setSelected(new Map());
  }, []);

  // Esc leaves select mode.
  useEffect(() => {
    if (!selecting) return undefined;
    const onKey = (e) => e.key === 'Escape' && !confirmOpen && stop();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selecting, confirmOpen, stop]);

  const toggle = (item, on) =>
    setSelected((prev) => {
      const next = new Map(prev);
      const want = on ?? !next.has(item._id);
      if (want) next.set(item._id, item);
      else next.delete(item._id);
      return next;
    });

  const pageIds = items.map((i) => i._id);
  const pageSelected = pageIds.filter((id) => selected.has(id)).length;
  const allOnPage = pageIds.length > 0 && pageSelected === pageIds.length;
  const setAllOnPage = (on) =>
    setSelected((prev) => {
      const next = new Map(prev);
      items.forEach((i) => (on ? next.set(i._id, i) : next.delete(i._id)));
      return next;
    });

  const cancelHold = () => clearTimeout(holdTimer.current);

  /** Props for a <Tr>: click opens (or ticks, while selecting); press-and-hold starts selecting. */
  const rowProps = (item, open) => ({
    className: cn('cursor-pointer select-none', selected.has(item._id) && 'bg-brand-50/70 dark:bg-brand-500/10'),
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      heldRef.current = false;
      cancelHold();
      holdTimer.current = setTimeout(() => {
        heldRef.current = true;
        setSelecting(true);
        toggle(item, true);
        if (navigator.vibrate) navigator.vibrate(30);
      }, HOLD_MS);
    },
    onPointerUp: cancelHold,
    onPointerLeave: cancelHold,
    onPointerCancel: cancelHold,
    onContextMenu: (e) => {
      // A long press on a phone opens the context menu; keep it for selecting.
      if (heldRef.current || selecting) e.preventDefault();
    },
    onClick: () => {
      if (heldRef.current) {
        heldRef.current = false; // this click ends the long press
        return;
      }
      if (selecting) toggle(item);
      else open();
    },
  });

  const headerCell = selecting ? (
    <th className="w-10 px-4 py-3">
      <SelectBox
        checked={allOnPage}
        indeterminate={!allOnPage && pageSelected > 0}
        onChange={setAllOnPage}
        label="Select all on this page"
      />
    </th>
  ) : null;

  const cell = (item) =>
    selecting ? (
      <td className="w-10 px-4 py-3.5">
        <SelectBox checked={selected.has(item._id)} onChange={(on) => toggle(item, on)} label={`Select ${getLabel(item)}`} />
      </td>
    ) : null;

  const toolbarButton = (
    <Button
      variant="outline"
      onClick={() => (selecting ? stop() : setSelecting(true))}
      title="Select several items, e.g. to delete them together. You can also press and hold a row."
    >
      <CheckSquare className="h-4 w-4" /> {selecting ? 'Cancel selection' : 'Select'}
    </Button>
  );

  const runDelete = async () => {
    const targets = [...selected.values()];
    const failed = [];
    const keep = new Map();
    let deleted = 0;
    setRunning({ done: 0, total: targets.length });
    for (const item of targets) {
      try {
        // One at a time: deleting one record can change what the next is allowed to do.
        // eslint-disable-next-line no-await-in-loop
        await deleteOne(item._id);
        deleted += 1;
      } catch (err) {
        failed.push({ label: getLabel(item), message: err.message });
        keep.set(item._id, item);
      }
      setRunning({ done: deleted + failed.length, total: targets.length });
    }
    [...invalidate, 'dashboard'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    setRunning(null);
    setReport({ deleted, failed });
    setSelected(keep); // failed ones stay selected so they can be retried
    if (!failed.length) setSelecting(false);
  };

  const count = selected.size;
  const names = [...selected.values()].map(getLabel);

  const bar = selecting ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:pl-64">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl dark:border-slate-700 dark:bg-navy-light">
        <span className="mr-auto text-sm font-semibold text-slate-800 dark:text-slate-100">
          {count ? `${count} selected` : `Tap ${noun} to select them`}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setAllOnPage(!allOnPage)} disabled={!items.length}>
          {allOnPage ? 'Unselect this page' : 'Select all on this page'}
        </Button>
        {count > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Map())}>
            Clear
          </Button>
        )}
        <Button size="sm" variant="danger" disabled={!count} onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4" /> Delete{count ? ` (${count})` : ''}
        </Button>
        <button
          type="button"
          onClick={stop}
          aria-label="Done selecting"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  ) : null;

  const dialog = (
    <>
      <Modal
        open={confirmOpen}
        onClose={running ? undefined : () => setConfirmOpen(false)}
        title={`Delete ${count} ${count === 1 ? singular : noun}?`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={Boolean(running)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={Boolean(running)}
              onClick={async () => {
                await runDelete();
                setConfirmOpen(false);
              }}
            >
              {running ? `Deleting ${running.done}/${running.total}...` : `Yes, delete ${count}`}
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <p>This is permanent and can&apos;t be undone.</p>
            <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-slate-800 dark:text-slate-100">
              {names.slice(0, 8).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            {names.length > 8 && <p className="mt-1 text-slate-500">…and {names.length - 8} more</p>}
          </div>
        </div>
      </Modal>
      <Modal
        open={Boolean(report)}
        onClose={() => setReport(null)}
        title={report?.failed.length ? 'Some items were not deleted' : 'Deleted'}
        size="sm"
        footer={<Button onClick={() => setReport(null)}>OK</Button>}
      >
        {report && (
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              {report.deleted} {report.deleted === 1 ? singular : noun} deleted.
            </p>
            {report.failed.length > 0 && (
              <div>
                <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">Not deleted ({report.failed.length}):</p>
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {report.failed.map((f, i) => (
                    <li key={i} className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                      <span className="font-semibold">{f.label}:</span> {f.message}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">They are still selected, so you can try again after fixing them.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );

  return { selecting, rowProps, headerCell, cell, toolbarButton, bar, dialog };
}
