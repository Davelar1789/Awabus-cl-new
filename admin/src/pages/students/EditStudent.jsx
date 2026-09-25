import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Unlink } from 'lucide-react';
import usePageHeader from '../../hooks/usePageHeader.js';
import { useEditDraft } from '../../hooks/useFormDraft.js';
import DraftNotice from '../../components/ui/DraftNotice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Input, { Label } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import LocationPickerModal from '../../components/ui/LocationPickerModal.jsx';
import GeofenceMap, { ACCRA_DEFAULT } from '../../components/map/GeofenceMap.jsx';
import { getStudent, updateStudent, deleteStudent } from '../../api/students.js';
import HouseholdLinkPicker from '../../components/students/HouseholdLinkPicker.jsx';

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const { data: student, isLoading } = useQuery({ queryKey: ['student', id], queryFn: () => getStudent(id) });

  usePageHeader({
    breadcrumb: [
      'AwaBus',
      'Students',
      { label: student ? `${student.firstName} ${student.lastName}` : '...', to: `/students/${id}` },
      'Edit',
    ],
  });

  const baseline = useMemo(
    () =>
      student
        ? {
            firstName: student.firstName,
            lastName: student.lastName,
            classGrade: student.classGrade || '',
            gender: student.gender || 'Female',
            guardianFirst: student.primaryGuardian?.firstName || '',
            guardianLast: student.primaryGuardian?.lastName || '',
            guardianPhone: student.primaryGuardian?.phone || '',
            secondContactPhone: student.secondContactPhone || '',
            lat: student.lat ?? ACCRA_DEFAULT.lat,
            lng: student.lng ?? ACCRA_DEFAULT.lng,
            geofenceRadius: student.geofenceRadius || 200,
          }
        : null,
    [student]
  );
  // Unsaved edits are kept as a draft until saved or discarded; later refetches
  // (e.g. after linking a household) don't overwrite them.
  const [form, setForm, draft] = useEditDraft(`student:${id}`, baseline);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (payload) => updateStudent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      draft.clear();
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      navigate(`/students/${id}`);
    },
  });

  // Link / unlink the shared home location immediately (separate from "Update Student").
  const householdMutation = useMutation({
    mutationFn: (payload) => updateStudent(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['student', id], updated);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-options'] });
      setForm((f) => ({
        ...f,
        lat: updated.lat ?? f.lat,
        lng: updated.lng ?? f.lng,
        geofenceRadius: updated.geofenceRadius || f.geofenceRadius,
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/students');
    },
  });

  if (isLoading || !form) return <PageLoader />;

  const householdMembers = student.householdMembers || [];

  return (
    <div>
      <PageHeader
        title="Edit Student Details"
        subtitle={`Modify information for ${student.firstName} ${student.lastName}. Ensure geofence coordinates are valid.`}
      />
      <DraftNotice show={draft.restored} onDiscard={draft.discard} discardLabel="Discard changes" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate({
            firstName: form.firstName,
            lastName: form.lastName,
            classGrade: form.classGrade,
            gender: form.gender,
            guardian: { id: student.primaryGuardian?._id, firstName: form.guardianFirst, lastName: form.guardianLast, phone: form.guardianPhone },
            secondContactPhone: form.secondContactPhone,
            lat: Number(form.lat),
            lng: Number(form.lng),
            geofenceRadius: Number(form.geofenceRadius),
          });
        }}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Student & School Info" />
              <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Student ID</Label>
                  <Input disabled value={student.studentCode} />
                </div>
                <div>
                  <Label>First Name</Label>
                  <Input value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} />
                </div>
                <div>
                  <Label>Class / Grade</Label>
                  <Input value={form.classGrade} onChange={(e) => set('classGrade')(e.target.value)} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onChange={(e) => set('gender')(e.target.value)}>
                    <option>Female</option>
                    <option>Male</option>
                  </Select>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Guardian Details" />
              <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Guardian First Name</Label>
                  <Input value={form.guardianFirst} onChange={(e) => set('guardianFirst')(e.target.value)} />
                </div>
                <div>
                  <Label>Guardian Last Name</Label>
                  <Input value={form.guardianLast} onChange={(e) => set('guardianLast')(e.target.value)} />
                </div>
                <div>
                  <Label>Primary Phone Number</Label>
                  <Input value={form.guardianPhone} onChange={(e) => set('guardianPhone')(e.target.value)} />
                </div>
                <div>
                  <Label>Backup Emergency Phone</Label>
                  <Input value={form.secondContactPhone} onChange={(e) => set('secondContactPhone')(e.target.value)} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Location & Geofencing Parameters" />
              <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <Label>Latitude</Label>
                  <Input value={form.lat} onChange={(e) => set('lat')(e.target.value)} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={form.lng} onChange={(e) => set('lng')(e.target.value)} />
                </div>
                <div>
                  <Label>Geofence Radius (meters)</Label>
                  <Input type="number" value={form.geofenceRadius} onChange={(e) => set('geofenceRadius')(e.target.value)} />
                </div>
                <div className="sm:col-span-3">
                  <Button type="button" variant="outline" onClick={() => setMapOpen(true)}>
                    Open map picker
                  </Button>
                </div>
              </CardBody>
              <LocationPickerModal
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                lat={form.lat}
                lng={form.lng}
                radius={form.geofenceRadius}
                onConfirm={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
              />
            </Card>

            <Card>
              <CardHeader title="Shared Home Location" subtitle="Siblings or neighbours using the same home and geofence" />
              <CardBody>
                {householdMembers.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Shares home location with:</p>
                    <ul className="space-y-2">
                      {householdMembers.map((m) => (
                        <li key={m._id} className="flex items-center gap-2 text-sm">
                          <Home className="h-4 w-4 text-green-600" />
                          <Link to={`/students/${m._id}`} className="font-semibold text-slate-800 hover:underline dark:text-slate-100">
                            {m.firstName} {m.lastName}
                          </Link>
                          <span className="text-xs text-slate-400">{[m.studentCode, m.classGrade].filter(Boolean).join(' · ')}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Changing this student&apos;s location or geofence also updates the students listed above.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={householdMutation.isPending}
                      onClick={() => householdMutation.mutate({ unlinkLocation: true })}
                    >
                      <Unlink className="h-4 w-4" />
                      Unlink from household
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pick a sibling or neighbour to copy their home location and keep both in sync.
                    </p>
                    <HouseholdLinkPicker
                      guardianId={student.primaryGuardian?._id}
                      excludeId={id}
                      onSelect={(s) => householdMutation.mutate({ linkLocationWith: s._id })}
                    />
                  </div>
                )}
                {householdMutation.isError && (
                  <p className="mt-2 text-sm text-red-600">{householdMutation.error.message}</p>
                )}
              </CardBody>
            </Card>
          </div>

          <Card className="flex flex-col">
            <CardHeader title="Interactive Geofence Picker" />
            <div className="h-80 px-5 pt-1 sm:h-96">
              <GeofenceMap
                lat={form.lat}
                lng={form.lng}
                radius={form.geofenceRadius}
                onMove={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
              />
            </div>
            <p className="p-5 text-xs text-slate-400">
              Click the map or drag the pin to update the latitude and longitude inputs. The green circle shows the
              geofence radius, which can be customized on the left panel.
            </p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Remove Student
              </button>
              <div className="flex gap-3">
                <Button as={Link} to={`/students/${id}`} variant="outline" type="button">
                  Cancel
                </Button>
                <Button type="submit" loading={updateMutation.isPending}>
                  Update Student
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Remove this student?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Delete Student
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">This action is permanent and cannot be undone.</p>
      </Modal>
    </div>
  );
}
