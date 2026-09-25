import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usePageHeader from '../../hooks/usePageHeader.js';
import { useEditDraft } from '../../hooks/useFormDraft.js';
import DraftNotice from '../../components/ui/DraftNotice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Input, { Label, FieldError } from '../../components/ui/Input.jsx';
import PhoneInput from '../../components/ui/PhoneInput.jsx';
import { fromStoredPhone, isValidPhone, toLocalPhone } from '../../lib/phone.js';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { SearchableSelect } from '../../components/ui/SearchableSelect.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { getDriver, updateDriver, deleteDriver } from '../../api/drivers.js';
import { getBusOptions } from '../../api/buses.js';

export default function EditDriver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const { data: driver, isLoading } = useQuery({ queryKey: ['driver', id], queryFn: () => getDriver(id) });
  const { data: busOptions = [] } = useQuery({ queryKey: ['bus-options'], queryFn: getBusOptions });
  usePageHeader({
    breadcrumb: [
      'AwaBus',
      'Drivers',
      { label: driver ? `${driver.firstName} ${driver.lastName}` : '...', to: `/drivers/${id}` },
      'Edit',
    ],
  });

  const baseline = useMemo(
    () =>
      driver
        ? {
            firstName: driver.firstName,
            lastName: driver.lastName,
            phone: fromStoredPhone(driver.phone),
            email: driver.email || '',
            licenseNumber: driver.licenseNumber,
            licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.slice(0, 10) : '',
            assignedBus: driver.assignedBus?._id || null,
            status: driver.status,
          }
        : null,
    [driver]
  );
  // Unsaved edits are kept as a draft until saved or discarded.
  const [form, setForm, draft] = useEditDraft(`driver:${id}`, baseline);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (payload) => updateDriver(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      draft.clear();
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

  const selectedBus = busOptions.find((b) => b._id === form.assignedBus);
  const selectedRoute = selectedBus?.assignedRoute;

  return (
    <div>
      <PageHeader title="Edit Driver" subtitle="Update personal information, licensing status, and assigned fleet assets." />
      <DraftNotice show={draft.restored} onDiscard={draft.discard} discardLabel="Discard changes" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isValidPhone(form.phone)) {
            setPhoneError('Enter a 10-digit number starting with 0, e.g. 024 412 3456');
            return;
          }
          setPhoneError('');
          updateMutation.mutate({ ...form, phone: toLocalPhone(form.phone) });
        }}
      >
        <Card>
          {updateMutation.error && (
            <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              {updateMutation.error.message}
            </div>
          )}
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
              <PhoneInput value={form.phone} onChange={set('phone')} error={Boolean(phoneError)} />
              <FieldError>{phoneError}</FieldError>
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
              <Label required>Assigned Bus</Label>
              <SearchableSelect
                placeholder="Select bus"
                value={form.assignedBus}
                onChange={set('assignedBus')}
                options={busOptions.map((b) => ({ value: b._id, label: `${b.name} (${b.plateNumber})` }))}
              />
            </div>
            <div>
              <Label>Route (from selected bus)</Label>
              <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-navy dark:text-slate-300">
                {selectedRoute ? `${selectedRoute.routeId} - ${selectedRoute.name}` : 'No bus selected'}
              </div>
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
        {deleteMutation.error && (
          <p className="mt-3 text-sm font-medium text-red-600">{deleteMutation.error.message}</p>
        )}
      </Modal>
    </div>
  );
}
