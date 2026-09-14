import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usePageHeader from '../../hooks/usePageHeader.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Input, { Label } from '../../components/ui/Input.jsx';
import PhoneInput from '../../components/ui/PhoneInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { SearchableSelect } from '../../components/ui/SearchableSelect.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { getDriver, updateDriver, deleteDriver } from '../../api/drivers.js';
import { getBusOptions } from '../../api/buses.js';
import { getRouteOptions } from '../../api/routes.js';

export default function EditDriver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  usePageHeader({ breadcrumb: ['AwaBus', 'Drivers', 'Edit Driver'] });

  const [form, setForm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: driver, isLoading } = useQuery({ queryKey: ['driver', id], queryFn: () => getDriver(id) });
  const { data: busOptions = [] } = useQuery({ queryKey: ['bus-options'], queryFn: getBusOptions });
  const { data: routeOptions = [] } = useQuery({ queryKey: ['route-options'], queryFn: getRouteOptions });

  useEffect(() => {
    if (driver) {
      setForm({
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone?.replace('+233', '') || '',
        email: driver.email || '',
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.slice(0, 10) : '',
        assignedBus: driver.assignedBus?._id || null,
        assignedRoute: driver.assignedRoute?._id || null,
        status: driver.status,
      });
    }
  }, [driver]);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (payload) => updateDriver(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', id] });
      navigate(`/drivers/${id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      navigate('/drivers');
    },
  });

  if (isLoading || !form) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Edit Driver" subtitle="Update personal information, licensing status, and assigned fleet assets." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate({ ...form, phone: `+233${form.phone}` });
        }}
      >
        <Card>
          <CardHeader title="Personal Information" />
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} />
            </div>
            <div>
              <Label>Phone Number</Label>
              <PhoneInput value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} />
            </div>
          </CardBody>

          <CardHeader title="License Details" />
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>License Number</Label>
              <Input value={form.licenseNumber} onChange={(e) => set('licenseNumber')(e.target.value)} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={form.licenseExpiry} onChange={(e) => set('licenseExpiry')(e.target.value)} />
            </div>
          </CardBody>

          <CardHeader title="Asset Assignment" />
          <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>Assigned Bus</Label>
              <SearchableSelect
                placeholder="Select bus"
                value={form.assignedBus}
                onChange={set('assignedBus')}
                options={busOptions.map((b) => ({ value: b._id, label: `${b.name} (${b.plateNumber})` }))}
              />
            </div>
            <div>
              <Label>Assigned Route</Label>
              <SearchableSelect
                placeholder="Select route"
                value={form.assignedRoute}
                onChange={set('assignedRoute')}
                options={routeOptions.map((r) => ({ value: r._id, label: r.name }))}
              />
            </div>
          </CardBody>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Delete Driver Profile
            </button>
            <div className="flex gap-3">
              <Button as={Link} to={`/drivers/${id}`} variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Driver
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this driver profile?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete Driver
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">This action is permanent and cannot be undone.</p>
      </Modal>
    </div>
  );
}
