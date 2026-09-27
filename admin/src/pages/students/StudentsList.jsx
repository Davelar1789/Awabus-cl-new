import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Plus, GraduationCap, SearchX, Users2, UserRound, UsersRound } from 'lucide-react';
import usePageHeader from '../../hooks/usePageHeader.js';
import useDebounce from '../../hooks/useDebounce.js';
import { getStudents, deleteStudent } from '../../api/students.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import RowActions from '../../components/ui/RowActions.jsx';
import BulkUploadModal from '../../components/import/BulkUploadModal.jsx';
import useListSelection from '../../hooks/useListSelection.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { formatPhone } from '../../lib/phone.js';

export default function StudentsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  usePageHeader({
    breadcrumb: ['AwaBus', 'Students'],
    searchPlaceholder: 'Search students, routes or guardians...',
    searchValue: search,
    onSearchChange: (v) => {
      setSearch(v);
      setPage(1);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, debouncedSearch],
    queryFn: () => getStudents({ page, q: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteTarget(null);
    },
  });

  const students = data?.data || [];
  const selection = useListSelection({
    items: students,
    getLabel: (s) => `${s.firstName} ${s.lastName}`,
    deleteOne: deleteStudent,
    noun: 'students',
    singular: 'student',
    invalidate: ['students', 'routes'],
  });
  const meta = data?.meta;
  const stats = data?.stats || {};

  return (
    <div className={selection.selecting ? 'pb-24' : undefined}>
      <PageHeader
        title="Students"
        subtitle="Monitor child safe boarding status and details."
        action={
          <>
            {selection.toolbarButton}
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Upload className="h-4 w-4" /> Bulk upload
            </Button>
            <Button as={Link} to="/students/new">
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={stats.totalStudents ?? 0} hint="Active registrations" icon={GraduationCap} />
        <StatCard
          label="Male Students"
          value={stats.male ?? 0}
          hint={stats.totalStudents ? `${Math.round((stats.male / stats.totalStudents) * 100)}% of total` : ''}
          icon={UserRound}
          tone="slate"
        />
        <StatCard
          label="Female Students"
          value={stats.female ?? 0}
          hint={stats.totalStudents ? `${Math.round((stats.female / stats.totalStudents) * 100)}% of total` : ''}
          icon={Users2}
          tone="amber"
        />
        <StatCard label="Guardians Registered" value={stats.guardianCount ?? 0} hint="Active contacts" icon={UsersRound} />
      </div>

      <Card>
        {isLoading ? (
          <PageLoader />
        ) : students.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={SearchX}
              title="No students match the search"
              description={`We couldn't find any registered student matching "${debouncedSearch}" in the system.`}
              action={
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="No students yet"
              description="Enroll your school's students to start managing transit routes and geofence tracking."
              action={
                <Button as={Link} to="/students/new">
                  <Plus className="h-4 w-4" /> Enroll Your First Student
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table>
              <Thead>
                {selection.headerCell}
                <Th>Student Name</Th>
                <Th>Class</Th>
                <Th>Parent/Guardian</Th>
                <Th>Phone</Th>
                <Th>Assigned Bus</Th>
                <Th>Assigned Route</Th>
                <Th>Pickup Time</Th>
                <Th title="Today's status, from the driver's roll call and boarding scans">Today</Th>
                <Th className="text-right">Actions</Th>
              </Thead>
              <Tbody>
                {students.map((s) => (
                  <Tr key={s._id} {...selection.rowProps(s, () => navigate(`/students/${s._id}`))}>
                    {selection.cell(s)}
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={`${s.firstName} ${s.lastName}`} src={s.profilePhotoUrl} size="sm" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {s.firstName} {s.lastName}
                        </span>
                      </div>
                    </Td>
                    <Td>{s.classGrade}</Td>
                    <Td>{s.primaryGuardian ? s.primaryGuardian.fullName || `${s.primaryGuardian.firstName} ${s.primaryGuardian.lastName}` : '—'}</Td>
                    <Td>{s.primaryGuardian?.phone ? formatPhone(s.primaryGuardian.phone) : '—'}</Td>
                    <Td>{s.bus?.plateNumber || s.bus?.name || '—'}</Td>
                    <Td>{s.route?.name || '—'}</Td>
                    <Td>{s.pickupTime || '—'}</Td>
                    <Td>
                      <Badge>{s.todayStatus || s.todayAttendance}</Badge>
                    </Td>
                    <Td className="text-right">
                      <RowActions
                        items={[
                          { label: 'Edit Student', to: `/students/${s._id}/edit` },
                          { label: 'Delete', danger: true, onClick: () => setDeleteTarget(s) },
                        ]}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {meta && (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onChange={setPage}
                label={`Showing ${(meta.page - 1) * meta.limit + 1}-${
                  (meta.page - 1) * meta.limit + students.length
                } of ${meta.total} students`}
              />
            )}
          </>
        )}
      </Card>
      {selection.bar}
      {selection.dialog}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove this student?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget._id)}>
              Delete Student
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">This action is permanent and cannot be undone.</p>
      </Modal>
      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} entity="students" label="Students" singular="student" />
    </div>
  );
}
