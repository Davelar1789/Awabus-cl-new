import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Plus, GraduationCap, SearchX, Users2, UserRound, UsersRound } from 'lucide-react';
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
import { PageLoader } from '../../components/ui/Spinner.jsx';

export default function StudentsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
  const meta = data?.meta;
  const stats = data?.stats || {};

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Monitor child safe boarding status and details."
        action={
          <Button as={Link} to="/students/new">
            <Plus className="h-4 w-4" /> Add Student
          </Button>
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
                <Th>Student Name</Th>
                <Th>Class</Th>
                <Th>Parent/Guardian</Th>
                <Th>Phone</Th>
                <Th>Assigned Bus</Th>
                <Th>Assigned Route</Th>
                <Th>Pickup Time</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Thead>
              <Tbody>
                {students.map((s) => (
                  <Tr key={s._id} className="cursor-pointer" onClick={() => navigate(`/students/${s._id}`)}>
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
                    <Td>{s.primaryGuardian?.phone || '—'}</Td>
                    <Td>{s.bus?.plateNumber || s.bus?.name || '—'}</Td>
                    <Td>{s.route?.name || '—'}</Td>
                    <Td>{s.pickupTime || '—'}</Td>
                    <Td>
                      <Badge>{s.todayAttendance}</Badge>
                    </Td>
                    <Td className="relative text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === s._id ? null : s._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === s._id && (
                        <div className="absolute right-4 top-10 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-navy-light">
                          <Link
                            to={`/students/${s._id}/edit`}
                            className="block px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Edit Student
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteTarget(s);
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            Delete
                          </button>
                        </div>
                      )}
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
    </div>
  );
}
