import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Plus, Users, SearchX } from 'lucide-react';
import usePageHeader from '../../hooks/usePageHeader.js';
import useDebounce from '../../hooks/useDebounce.js';
import { getDrivers, deleteDriver } from '../../api/drivers.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';

export default function DriversList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  usePageHeader({
    breadcrumb: ['AwaBus', 'Drivers'],
    searchPlaceholder: 'Search by name, license or route...',
    searchValue: search,
    onSearchChange: (v) => {
      setSearch(v);
      setPage(1);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, debouncedSearch],
    queryFn: () => getDrivers({ page, q: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDeleteTarget(null);
    },
  });

  const drivers = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle="Manage and assign authorized drivers for the school fleet."
        action={
          <Button as={Link} to="/drivers/new">
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageLoader />
        ) : drivers.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={SearchX}
              title={`No drivers match "${debouncedSearch}"`}
              description="Check the plate number or name, or clear the search to see all drivers."
              action={
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No drivers yet"
              description="Add your drivers to set up the AwaBus app. Add the bus and route info."
              action={
                <Button as={Link} to="/drivers/new">
                  <Plus className="h-4 w-4" /> Add Driver
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Driver Name</Th>
                <Th>Phone</Th>
                <Th>License No</Th>
                <Th>Assigned Bus</Th>
                <Th>Assigned Route</Th>
                <Th>Status</Th>
                <Th>Emergency Contact</Th>
                <Th className="text-right">Actions</Th>
              </Thead>
              <Tbody>
                {drivers.map((driver) => (
                  <Tr key={driver._id} className="cursor-pointer" onClick={() => navigate(`/drivers/${driver._id}`)}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={`${driver.firstName} ${driver.lastName}`} src={driver.profilePhotoUrl} size="sm" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {driver.firstName} {driver.lastName}
                        </span>
                      </div>
                    </Td>
                    <Td>{driver.phone}</Td>
                    <Td>{driver.licenseNumber}</Td>
                    <Td>{driver.assignedBus ? `${driver.assignedBus.name} (${driver.assignedBus.plateNumber})` : '—'}</Td>
                    <Td>{driver.assignedRoute ? `${driver.assignedRoute.name}` : '—'}</Td>
                    <Td>
                      <Badge>{driver.status}</Badge>
                    </Td>
                    <Td>
                      {driver.emergencyContactName
                        ? `${driver.emergencyContactName} (${driver.emergencyContactRelation})`
                        : '—'}
                    </Td>
                    <Td className="relative text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === driver._id ? null : driver._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === driver._id && (
                        <div className="absolute right-4 top-10 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-navy-light">
                          <Link
                            to={`/drivers/${driver._id}/edit`}
                            className="block px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Edit Info
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteTarget(driver);
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
                  (meta.page - 1) * meta.limit + drivers.length
                } of ${meta.total} drivers`}
              />
            )}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this driver?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget._id)}>
              Delete Driver
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This action is permanent and cannot be undone. {deleteTarget?.firstName} {deleteTarget?.lastName} will be
          unassigned from their bus and route.
        </p>
      </Modal>
    </div>
  );
}
