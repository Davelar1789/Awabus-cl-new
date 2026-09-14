import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import usePageHeader from '../../hooks/usePageHeader.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Input, { Label } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { SearchableSelect } from '../../components/ui/SearchableSelect.jsx';
import { getRouteOptions } from '../../api/routes.js';
import { getDriverOptions } from '../../api/drivers.js';
import { createBus } from '../../api/buses.js';

const initial = { plateNumber: '', name: '', type: 'Standard', capacity: '', assignedRoute: null, assignedDriver: null };

export default function RegisterBus() {
  usePageHeader({ breadcrumb: ['AwaBus', 'Buses', 'Register Bus'] });
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const [created, setCreated] = useState(null);
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const { data: routeOptions = [] } = useQuery({ queryKey: ['route-options'], queryFn: getRouteOptions });
  const { data: driverOptions = [] } = useQuery({ queryKey: ['driver-options'], queryFn: () => getDriverOptions() });

  const mutation = useMutation({
    mutationFn: (payload) => createBus(payload),
    onSuccess: (bus) => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setCreated(bus);
    },
  });

  if (created) {
    return (
      <div>
        <PageHeader title="Register Bus" />
        <Card className="mx-auto max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-brand-500" />
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Bus Registered Successfully</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            The new vehicle has been added to the AwaBus school fleet records.
          </p>
          <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-left text-sm dark:bg-navy">
            <Row label="Plate Number" value={created.plateNumber} />
            <Row label="Bus Nickname" value={created.name} />
            <Row label="Capacity" value={`${created.capacity} Seats`} />
            <Row label="Assigned Route" value={created.assignedRoute?.name || '—'} />
            <Row label="Assigned Driver" value={created.assignedDriver ? `${created.assignedDriver.firstName} ${created.assignedDriver.lastName}` : '—'} />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button as={Link} to="/buses" variant="outline">
              Back to Bus List
            </Button>
            <Button as={Link} to={`/buses/${created._id}`}>
              View Bus Profile
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link to="/buses" className="mb-3 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
        ← Back to Bus List
      </Link>
      <PageHeader title="Register Bus" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ ...form, capacity: Number(form.capacity) });
        }}
      >
        <Card>
          <CardHeader title="Vehicle Information" />
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label required>Bus Plate Number</Label>
              <Input value={form.plateNumber} onChange={(e) => set('plateNumber')(e.target.value.toUpperCase())} placeholder="e.g. GC-102-21" required />
            </div>
            <div>
              <Label required>Bus Name/Nickname</Label>
              <Input value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Bus A / Yellow Submarine" required />
            </div>
            <div>
              <Label required>Capacity (Seats)</Label>
              <Input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity')(e.target.value)} placeholder="e.g. 45" required />
            </div>
            <div>
              <Label>Assigned Route</Label>
              <SearchableSelect
                placeholder="Select assigned transit route"
                value={form.assignedRoute}
                onChange={set('assignedRoute')}
                options={routeOptions.map((r) => ({ value: r._id, label: `${r.routeId} - ${r.name}` }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Assigned Driver</Label>
              <SearchableSelect
                placeholder="Search authorized driver..."
                value={form.assignedDriver}
                onChange={set('assignedDriver')}
                options={driverOptions.map((d) => ({
                  value: d._id,
                  label: `${d.firstName} ${d.lastName}`,
                  description: `${d.phone} • License: ${d.licenseNumber}`,
                }))}
              />
            </div>
          </CardBody>

          <div className="flex justify-end gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
            <Button as={Link} to="/buses" variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Register Bus
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
  </div>
);
