import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usePageHeader from '../../hooks/usePageHeader.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Input, { Label, FieldError } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { SearchableSelect } from '../../components/ui/SearchableSelect.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { getBus, updateBus, deleteBus } from '../../api/buses.js';
import { getRouteOptions } from '../../api/routes.js';

export default function EditBus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  usePageHeader({ breadcrumb: ['AwaBus', 'Buses', 'Edit Bus'] });

  const [form, setForm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [routeError, setRouteError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['bus', id], queryFn: () => getBus(id) });
  const { data: routeOptions = [] } = useQuery({ queryKey: ['route-options'], queryFn: getRouteOptions });

  useEffect(() => {
    if (data?.data) {
      const bus = data.data;
      setForm({
        plateNumber: bus.plateNumber,
        name: bus.name,
        capacity: bus.capacity,
        assignedRoute: bus.assignedRoute?._id || null,
        status: bus.status,
      });
    }
  }, [data]);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (payload) => updateBus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['bus', id] });
      navigate(`/buses/${id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      navigate('/buses');
    },
  });

  if (isLoading || !form) return <PageLoader />;
  const bus = data.data;

  const handleSubmit = (e) => {
    e.preventDefault();
    setRouteError('');
    if (!form.assignedRoute) {
      setRouteError('A bus must remain assigned to a route');
      return;
    }
    updateMutation.mutate({ ...form, capacity: Number(form.capacity) });
  };

  return (
    <div>
      <PageHeader title={`Edit Bus ${bus.plateNumber}`} />
      <form onSubmit={handleSubmit}>
        <Card>
          {updateMutation.error && (
            <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              {updateMutation.error.message}
            </div>
          )}
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label required>Bus Plate Number</Label>
              <Input value={form.plateNumber} onChange={(e) => set('plateNumber')(e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label required>Bus Name/Nickname</Label>
              <Input value={form.name} onChange={(e) => set('name')(e.target.value)} />
            </div>
            <div>
              <Label required>Capacity (Seats)</Label>
              <Input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity')(e.target.value)} />
            </div>
            <div>
              <Label>Fleet Status</Label>
              <Select value={form.status} onChange={(e) => set('status')(e.target.value)}>
                <option>Active</option>
                <option>Idle</option>
                <option>Maintenance</option>
              </Select>
            </div>
            <div>
              <Label required>Assigned Route</Label>
              <SearchableSelect
                placeholder="Select route"
                value={form.assignedRoute}
                onChange={(val) => {
                  set('assignedRoute')(val);
                  setRouteError('');
                }}
                error={Boolean(routeError)}
                options={routeOptions.map((r) => ({ value: r._id, label: r.name }))}
              />
              <FieldError>{routeError}</FieldError>
            </div>
          </CardBody>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Delete Bus from Fleet
            </button>
            <div className="flex gap-3">
              <Button as={Link} to={`/buses/${id}`} variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this bus?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete Bus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">This action is permanent and cannot be undone.</p>
        {deleteMutation.error && (
          <p className="mt-3 text-sm font-medium text-red-600">{deleteMutation.error.message}</p>
        )}
      </Modal>
    </div>
  );
}
