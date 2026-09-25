import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import usePageHeader from '../../hooks/usePageHeader.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Input, { Label } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import LocationPickerModal from '../../components/ui/LocationPickerModal.jsx';
import { getStudent, updateStudent, deleteStudent } from '../../api/students.js';

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#0d9488;border:3px solid white;box-shadow:0 0 0 2px #0d9488;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function DraggableMarker({ lat, lng, onMove }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return (
    <Marker
      position={[lat, lng]}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat: newLat, lng: newLng } = e.target.getLatLng();
          onMove(newLat, newLng);
        },
      }}
    />
  );
}

const ACCRA_DEFAULT = { lat: 5.6037, lng: -0.187 };

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  usePageHeader({ breadcrumb: ['AwaBus', 'Students', 'Edit Student Details'] });

  const [form, setForm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const { data: student, isLoading } = useQuery({ queryKey: ['student', id], queryFn: () => getStudent(id) });

  useEffect(() => {
    if (student) {
      setForm({
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
      });
    }
  }, [student]);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (payload) => updateStudent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      navigate(`/students/${id}`);
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

  return (
    <div>
      <PageHeader
        title="Edit Student Details"
        subtitle={`Modify information for ${student.firstName} ${student.lastName}. Ensure geofence coordinates are valid.`}
      />

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
                onConfirm={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
              />
            </Card>
          </div>

          <Card className="flex flex-col">
            <CardHeader title="Interactive Geofence Picker" />
            <div className="h-80 px-5 pt-1 sm:h-96">
              <MapContainer center={[Number(form.lat), Number(form.lng)]} zoom={15} className="h-full w-full">
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker
                  lat={Number(form.lat)}
                  lng={Number(form.lng)}
                  onMove={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
                />
              </MapContainer>
            </div>
            <p className="p-5 text-xs text-slate-400">
              Drag the map pin to automatically update the latitude and longitude inputs. Geofence radius can be
              customized on the left panel.
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
