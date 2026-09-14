import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Plus, Bus as BusIcon, SearchX, Settings2, Ban } from 'lucide-react';
import usePageHeader from '../../hooks/usePageHeader.js';
import useDebounce from '../../hooks/useDebounce.js';
import { getBuses, deleteBus } from '../../api/buses.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { PillTabs } from '../../components/ui/Tabs.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';

const STATUS_TABS = ['All', 'Active', 'Idle', 'Maintenance'];

export default function BusesList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  usePageHeader({
    breadcrumb: ['AwaBus', 'Buses'],
    searchPlaceholder: 'Search by plate number or bus...',
    searchValue: search,
    onSearchChange: (v) => {
      setSearch(v);
      setPage(1);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['buses', page, debouncedSearch, status],
    queryFn: () => getBuses({ page, q: debouncedSearch, status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      setDeleteTarget(null);
    },
  });

  const buses = data?.data || [];
  const meta = data?.meta;
  const stats = data?.stats || {};

  return (
    <div>
      <PageHeader
        title="Buses"
        subtitle="Register, assign and manage every vehicle in the school fleet."
        action={
          <Button as={Link} to="/buses/new">
            <Plus className="h-4 w-4" /> Register Bus
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Registered Buses" value={stats.totalBuses ?? 0} hint="Active school vehicles" icon={BusIcon} />
        <StatCard label="Buses in Maintenance" value={stats.maintenance ?? 0} hint="Overdue for inspection" icon={Settings2} tone="amber" />
        <StatCard label="Idle Buses" value={stats.idle ?? 0} hint="Available for assignment" icon={Ban} tone="slate" />
      </div>

      <PillTabs
        className="mb-4"
        tabs={STATUS_TABS}
        active={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      <Card>
        {isLoading ? (
          <PageLoader />
        ) : buses.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={SearchX}
              title="No buses match the search"
              description={`We couldn't find any bus with details matching "${debouncedSearch}". Check spelling or clear search filters.`}
              action={
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear Search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={BusIcon}
              title="No buses registered yet"
              description="Get started by registering the first bus in your school fleet to assign routes and drivers."
              action={
                <Button as={Link} to="/buses/new">
                  <Plus className="h-4 w-4" /> Register Bus
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Bus Plate No</Th>
                <Th>Bus Name</Th>
                <Th>Route</Th>
                <Th>Status</Th>
                <Th>Driver</Th>
                <Th>Capacity</Th>
                <Th className="text-right">Actions</Th>
              </Thead>
              <Tbody>
                {buses.map((bus) => (
                  <Tr key={bus._id} className="cursor-pointer" onClick={() => navigate(`/buses/${bus._id}`)}>
                    <Td className="font-bold text-slate-900 dark:text-white">{bus.plateNumber}</Td>
                    <Td>{bus.name}</Td>
                    <Td>{bus.assignedRoute ? `${bus.assignedRoute.name}` : '—'}</Td>
                    <Td>
                      <Badge>{bus.status}</Badge>
                    </Td>
                    <Td>{bus.assignedDriver ? `${bus.assignedDriver.firstName} ${bus.assignedDriver.lastName}` : '—'}</Td>
                    <Td>
                      {bus.seatsFilled ?? 0} / {bus.capacity}
                    </Td>
                    <Td className="relative text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === bus._id ? null : bus._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === bus._id && (
                        <div className="absolute right-4 top-10 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-navy-light">
                          <Link
                            to={`/buses/${bus._id}/edit`}
                            className="block px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Edit Bus
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteTarget(bus);
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
                  (meta.page - 1) * meta.limit + buses.length
                } of ${meta.total} buses`}
              />
            )}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this bus?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget._id)}>
              Delete Bus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This action is permanent and cannot be undone. {deleteTarget?.plateNumber} will be unassigned from its route and driver.
        </p>
      </Modal>
    </div>
  );
}
