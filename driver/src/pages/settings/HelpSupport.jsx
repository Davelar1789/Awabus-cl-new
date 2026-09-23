import { Phone, Mail, MessageCircleQuestion } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Card from '../../components/ui/Card.jsx';

const FAQS = [
  {
    q: "What happens if I lose signal during a trip?",
    a: "Keep driving as normal. Scans and GPS updates are queued on your phone and sync automatically the moment you're back online.",
  },
  {
    q: 'How do I mark a student absent before the trip starts?',
    a: 'On the Home screen, tap a student\'s row to toggle between Attending and Not attending before you start the trip.',
  },
  {
    q: 'Can I send more than one delay broadcast per trip?',
    a: 'Yes — use the Delay SMS button as many times as needed; every broadcast is logged under Broadcast history.',
  },
];

export default function HelpSupport() {
  return (
    <div>
      <Header title="Help & support" back />
      <div className="space-y-4 p-4">
        <Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Contact support</p>
          <a href="tel:+233302123456" className="flex items-center gap-3 py-2 text-slate-800 dark:text-slate-100">
            <Phone className="h-4 w-4 text-brand-600" /> +233 30 212 3456
          </a>
          <a href="mailto:support@awabus.com" className="flex items-center gap-3 py-2 text-slate-800 dark:text-slate-100">
            <Mail className="h-4 w-4 text-brand-600" /> support@awabus.com
          </a>
        </Card>

        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            <MessageCircleQuestion className="h-4 w-4" /> Frequently asked questions
          </p>
          <div className="space-y-2">
            {FAQS.map((f) => (
              <Card key={f.q}>
                <p className="font-bold text-slate-800 dark:text-slate-100">{f.q}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{f.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
