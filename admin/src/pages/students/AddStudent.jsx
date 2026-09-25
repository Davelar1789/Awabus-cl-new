import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Upload } from 'lucide-react';
import usePageHeader from '../../hooks/usePageHeader.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Stepper from '../../components/ui/Stepper.jsx';
import Input, { Label, Textarea } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { SearchableSelect } from '../../components/ui/SearchableSelect.jsx';
import { getRouteOptions } from '../../api/routes.js';
import { getBusOptions } from '../../api/buses.js';
import { getGuardians } from '../../api/guardians.js';
import { createStudent } from '../../api/students.js';

const STEPS = ['Student Information', 'Parents & Guardian', 'Transport Assignment', 'Home Location', 'Review & Finalize'];

const CLASS_GRADE_OPTIONS = [
  'Creche',
  'Nursery 1',
  'Nursery 2',
  'KG 1',
  'KG 2',
  'Basic 1',
  'Basic 2',
  'Basic 3',
  'Basic 4',
  'Basic 5',
  'Basic 6',
  'Basic 7',
  'Basic 8',
  'Basic 9',
];

const DRAFT_KEY = 'addStudentDraft';

const initial = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'Female',
  classGrade: '',
  profilePhotoUrl: '',
  guardianId: null,
  guardianFirst: '',
  guardianLast: '',
  guardianRelation: 'Father',
  guardianPhone: '',
  guardianEmail: '',
  secondContactName: '',
  secondContactPhone: '',
  emergencyInstructions: '',
  route: null,
  bus: null,
  pickupPoint: '',
  dropoffPoint: '',
  homeAddress: '',
  geofenceRadius: 200,
  lat: '',
  lng: '',
};

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export default function AddStudent() {
  usePageHeader({ breadcrumb: ['AwaBus', 'Students', 'Add student'] });
  const queryClient = useQueryClient();

  // Restore saved draft (form + step) if one exists, otherwise start fresh
  const [step, setStep] = useState(() => loadDraft()?.step ?? 1);
  const [form, setForm] = useState(() => loadDraft()?.form ?? initial);

  const [created, setCreated] = useState(null);
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  // Persist to localStorage whenever the form or step changes
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
    } catch {
      // storage full or unavailable — fail silently, not critical
    }
  }, [form, step]);

  const { data: routeOptions = [] } = useQuery({ queryKey: ['route-options'], queryFn: getRouteOptions });
  const { data: busOptions = [] } = useQuery({ queryKey: ['bus-options'], queryFn: getBusOptions });
  const { data: guardianOptions = [] } = useQuery({ queryKey: ['guardian-options'], queryFn: () => getGuardians() });

  const mutation = useMutation({
    mutationFn: (payload) => createStudent(payload),
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setCreated(student);
      clearDraft();
    },
  });

  const selectedRoute = routeOptions.find((r) => r._id === form.route);
  const selectedBus = busOptions.find((b) => b._id === form.bus);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    mutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      dob: form.dob,
      gender: form.gender,
      classGrade: form.classGrade,
      profilePhotoUrl: form.profilePhotoUrl,
      guardian: form.guardianId
        ? { id: form.guardianId }
        : {
            firstName: form.guardianFirst,
            lastName: form.guardianLast,
            relation: form.guardianRelation,
            phone: form.guardianPhone,
            email: form.guardianEmail,
          },
      secondContactName: form.secondContactName,
      secondContactPhone: form.secondContactPhone,
      emergencyInstructions: form.emergencyInstructions,
      route: form.route,
      bus: form.bus,
      pickupPoint: form.pickupPoint,
      dropoffPoint: form.dropoffPoint,
      homeAddress: form.homeAddress,
      geofenceRadius: Number(form.geofenceRadius),
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
    });
  };

  if (created) {
    return (
      <div>
        <PageHeader title="Add Student" />
        <Card className="mx-auto max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-brand-500" />
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Student added successfully</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            The student has been enrolled and assigned to their respective route.
          </p>
          <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-left text-sm dark:bg-navy">
            <Row label="Student Name" value={`${created.firstName} ${created.lastName}`} />
            <Row label="Student ID" value={created.studentCode} />
            <Row label="Assigned Route" value={created.route?.name || '—'} />
            <Row label="Assigned Bus" value={created.bus ? `${created.bus.plateNumber} (${created.bus.name})` : '—'} />
            <Row
              label="Primary Contact"
              value={created.primaryGuardian ? `${created.primaryGuardian.firstName} (${created.primaryGuardian.phone})` : '—'}
            />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button as={Link} to="/students" variant="outline">
              Back to Students
            </Button>
            <Button
              onClick={() => {
                setCreated(null);
                setForm(initial);
                setStep(1);
                clearDraft();
              }}
            >
              Add Student
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Add Student — Step ${step}`} subtitle={STEP_SUBTITLES[step - 1]} />
      <Stepper steps={STEPS} activeStep={step} />

      <Card>
        <CardBody>
          {step === 1 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label required>First Name</Label>
                <Input value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} placeholder="e.g. Abena" required />
              </div>
              <div>
                <Label required>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} placeholder="e.g. Osei" required />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dob} onChange={(e) => set('dob')(e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <div className="flex h-11 items-center gap-6">
                  {['Female', 'Male'].map((g) => (
                    <label key={g} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <input type="radio" checked={form.gender === g} onChange={() => set('gender')(g)} className="h-4 w-4 accent-brand-600" />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Class / Grade</Label>
                <select
                  value={form.classGrade}
                  onChange={(e) => set('classGrade')(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="" disabled>
                    Select class / grade
                  </option>
                  {CLASS_GRADE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Student ID</Label>
                <Input disabled value="Autogenerated" />
              </div>
              <div className="sm:col-span-2">
                <Label>Student Photo</Label>
                <PhotoUpload value={form.profilePhotoUrl} onChange={set('profilePhotoUrl')} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Parents & Guardian Information</h3>
              </div>

              <div className="mb-5">
                <Label>Link Existing Parent (optional)</Label>
                <SearchableSelect
                  placeholder="Search existing guardians..."
                  value={form.guardianId}
                  onChange={(val) => {
                    set('guardianId')(val);
                    const g = guardianOptions.find((x) => x._id === val);
                    if (g) {
                      set('guardianFirst')(g.firstName);
                      set('guardianLast')(g.lastName);
                      set('guardianPhone')(g.phone);
                      set('guardianEmail')(g.email || '');
                    }
                  }}
                  options={guardianOptions.map((g) => ({ value: g._id, label: `${g.firstName} ${g.lastName}`, description: g.phone }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label required>Guardian First Name</Label>
                  <Input value={form.guardianFirst} onChange={(e) => set('guardianFirst')(e.target.value)} placeholder="e.g. Kofi" />
                </div>
                <div>
                  <Label required>Guardian Last Name</Label>
                  <Input value={form.guardianLast} onChange={(e) => set('guardianLast')(e.target.value)} placeholder="e.g. Osei" />
                </div>
                <div>
                  <Label>Relation</Label>
                  <Select value={form.guardianRelation} onChange={(e) => set('guardianRelation')(e.target.value)}>
                    {['Father', 'Mother', 'Guardian', 'Sibling', 'Other'].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label required>Guardian Phone</Label>
                  <Input value={form.guardianPhone} onChange={(e) => set('guardianPhone')(e.target.value)} placeholder="+233 24 412 3456" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Guardian Email</Label>
                  <Input type="email" value={form.guardianEmail} onChange={(e) => set('guardianEmail')(e.target.value)} placeholder="kofi.osei@gmail.com" />
                </div>
                <div>
                  <Label>Second Contact Name</Label>
                  <Input value={form.secondContactName} onChange={(e) => set('secondContactName')(e.target.value)} placeholder="e.g. Mary Osei" />
                </div>
                <div>
                  <Label>Second Contact Phone</Label>
                  <Input value={form.secondContactPhone} onChange={(e) => set('secondContactPhone')(e.target.value)} placeholder="e.g. +233 20 111 2233" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Emergency Instructions</Label>
                  <Textarea
                    value={form.emergencyInstructions}
                    onChange={(e) => set('emergencyInstructions')(e.target.value)}
                    placeholder="e.g. Contact father's office if unreachable"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="mb-5 text-base font-bold text-slate-900 dark:text-white">Transport Assignment</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Primary Route</Label>
                  <SearchableSelect
                    placeholder="Select route"
                    value={form.route}
                    onChange={(val) => {
                      set('route')(val);
                      const r = routeOptions.find((x) => x._id === val);
                      if (r?.assignedBus) set('bus')(r.assignedBus._id || r.assignedBus);
                    }}
                    options={routeOptions.map((r) => ({ value: r._id, label: `${r.routeId} - ${r.name}` }))}
                  />
                </div>
                <div>
                  <Label>Assigned Bus</Label>
                  <SearchableSelect
                    placeholder="Select bus"
                    value={form.bus}
                    onChange={set('bus')}
                    options={busOptions.map((b) => ({ value: b._id, label: `${b.name} (${b.plateNumber})` }))}
                  />
                </div>
                <div>
                  <Label>Pick-up Point</Label>
                  <Input value={form.pickupPoint} onChange={(e) => set('pickupPoint')(e.target.value)} placeholder="e.g. East Legon Starbites Station" />
                </div>
                <div>
                  <Label>Drop-off Point</Label>
                  <Input value={form.dropoffPoint} onChange={(e) => set('dropoffPoint')(e.target.value)} placeholder="e.g. East Legon Starbites Station" />
                </div>
              </div>

              {selectedBus && (
                <Card className="mt-6 bg-slate-50 dark:bg-navy">
                  <CardHeader title="Route & Operational Summary" />
                  <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <SummaryStat label="Estimated Pick-up Time" value="07:15 AM" />
                    <SummaryStat label="Estimated Drop-off Time" value="03:45 PM" />
                    <SummaryStat label="Bus Driver" value={selectedRoute?.assignedDriver ? `${selectedRoute.assignedDriver.firstName} ${selectedRoute.assignedDriver.lastName}` : '—'} />
                    <SummaryStat label="Seats Available" value={`${selectedBus.capacity} Seats`} />
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="mb-5 text-base font-bold text-slate-900 dark:text-white">Home Location & Geofencing</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>GPS Address</Label>
                  <Input value={form.homeAddress} onChange={(e) => set('homeAddress')(e.target.value)} placeholder="e.g. 12 Boundary Road, East Legon" />
                </div>
                <div>
                  <Label>Geofence Radius (meters)</Label>
                  <Select value={form.geofenceRadius} onChange={(e) => set('geofenceRadius')(e.target.value)}>
                    {[100, 150, 200, 300, 500].map((r) => (
                      <option key={r} value={r}>
                        {r}m Notification Zone
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Latitude</Label>
                  <Input value={form.lat} onChange={(e) => set('lat')(e.target.value)} placeholder="5.6322" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={form.lng} onChange={(e) => set('lng')(e.target.value)} placeholder="-0.1581" />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Review Student Profile</h3>
              <section>
                <p className="mb-3 text-sm font-bold text-brand-700 dark:text-brand-400">Personal Information</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <SummaryStat label="Name" value={`${form.firstName} ${form.lastName}`} />
                  <SummaryStat label="Student ID" value="Autogenerated" />
                  <SummaryStat label="Class" value={form.classGrade || '—'} />
                </div>
              </section>
              <section>
                <p className="mb-3 text-sm font-bold text-brand-700 dark:text-brand-400">Guardian Information</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <SummaryStat label="Guardian" value={`${form.guardianFirst} ${form.guardianLast} (${form.guardianRelation})`} />
                  <SummaryStat label="Phone" value={form.guardianPhone || '—'} />
                  <SummaryStat label="Email" value={form.guardianEmail || '—'} />
                </div>
              </section>
              <section>
                <p className="mb-3 text-sm font-bold text-brand-700 dark:text-brand-400">Transit Assignments</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <SummaryStat label="Route" value={selectedRoute?.name || '—'} />
                  <SummaryStat label="Bus" value={selectedBus ? `${selectedBus.name} (${selectedBus.plateNumber})` : '—'} />
                  <SummaryStat label="Pick-up Point" value={form.pickupPoint || '—'} />
                </div>
              </section>
              <section>
                <p className="mb-3 text-sm font-bold text-brand-700 dark:text-brand-400">Home Geo-Location</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <SummaryStat label="Address" value={form.homeAddress || '—'} />
                  <SummaryStat label="Geofence" value={`${form.geofenceRadius}m`} />
                  <SummaryStat label="Coordinates" value={form.lat && form.lng ? `${form.lat}, ${form.lng}` : '—'} />
                </div>
              </section>
            </div>
          )}
        </CardBody>

        <div className="flex justify-between border-t border-slate-100 p-5 dark:border-slate-800">
          {step > 1 ? (
            <Button variant="outline" onClick={goBack} type="button">
              Back
            </Button>
          ) : (
            <Button as={Link} to="/students" variant="outline" type="button">
              Cancel
            </Button>
          )}
          {step < STEPS.length ? (
            <Button onClick={goNext}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} loading={mutation.isPending}>
              Create Student
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

const STEP_SUBTITLES = [
  "Enter student's personal information and select their class.",
  'Link parent or primary guardian profiles to this student.',
  'Assign the default daily route, bus and pick-up timing.',
  'Indicate home coordinates and configure geographic notifications.',
  'Verify all student and family details before saving.',
];

const SummaryStat = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{value}</p>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
  </div>
);

function PhotoUpload({ value, onChange }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center hover:border-brand-300 dark:border-slate-700 dark:bg-navy">
      {value ? (
        <img src={value} alt="Preview" className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <Upload className="h-6 w-6 text-slate-400" />
      )}
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Click to upload profile photo</span>
      <span className="text-xs text-slate-400">PNG or JPG up to 5MB</span>
      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFile} />
    </label>
  );
}