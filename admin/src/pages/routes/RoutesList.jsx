import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Plus, Milestone, SearchX } from 'lucide-react';
import usePageHeader from '../../hooks/usePageHeader.js';
import useDebounce from '../../hooks/useDebounce.js';
import { getRoutes, deleteRoute } from '../../api/routes.js';
import Card from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/ui/Table.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';

export default function RoutesList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();

  usePageHeader({
    breadcrumb: ['Routes', 'Routes'],
    searchPlaceholder: 'Search routes, buses, students...',
    searchValue: search,
    onSearchChange: (v) => {
      setSearch(v);
      setPage(1);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['routes', page, debouncedSearch],
    queryFn: () => getRoutes({ page, q: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setDeleteTarget(null);
    },
  });

  const routes = data?.data || [];
  const meta = data?.meta;
  const hasAnyRoutes = meta && (meta.total > 0 || debouncedSearch);

  return (
    <div>
      <PageHeader
        title="Routes"
        subtitle="Manage operational lines, assign drivers, and monitor service capacity."
        action={
          <Button as={Link} to="/routes/new">
            <Plus className="h-4 w-4" /> Add Route
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageLoader />
        ) : routes.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={SearchX}
              title="No routes match your search"
              description={`We couldn't find any operational lines matching "${debouncedSearch}". Please double-check your spelling or try different search terms.`}
              action={
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Milestone}
              title="No routes yet"
              description="Create your first operational bus route to start onboarding students and assigning drivers."
              action={
                <Button as={Link} to="/routes/new">
                  <Plus className="h-4 w-4" /> Add Route
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Route ID</Th>
                <Th>Route Name</Th>
                <Th>Assigned Driver</Th>
                <Th>Students</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Thead>
              <Tbody>
                {routes.map((route) => (
                  <Tr key={route._id}>
                    <Td className="font-bold text-slate-900 dark:text-white">{route.routeId}</Td>
                    <Td>{route.name}</Td>
                    <Td>
                      {route.assignedDriver
                        ? `${route.assignedDriver.firstName} ${route.assignedDriver.lastName}`
                        : '—'}
                    </Td>
                    <Td>{route.studentCount ?? route.students?.length ?? 0}</Td>
                    <Td>
                      <Badge tone={route.status === 'Active' ? 'success' : 'neutral'}>{route.status}</Badge>
                    </Td>
                    <Td className="relative text-right">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === route._id ? null : route._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === route._id && (
                        <div className="absolute right-4 top-10 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-700 dark:bg-navy-light">
                          <Link
                            to={`/routes/${route._id}/edit`}
                            className="block px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Edit route
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteTarget(route);
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            Delete route
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
                label={`Showing ${routes.length ? (meta.page - 1) * meta.limit + 1 : 0} to ${
                  (meta.page - 1) * meta.limit + routes.length
                } of ${meta.total} routes`}
              />
            )}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this route?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget._id)}>
              Delete Route
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          This action is permanent and cannot be undone.
        </p>
        {deleteTarget && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm dark:bg-navy">
            <div className="flex justify-between">
              <span className="text-slate-500">Route ID</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{deleteTarget.routeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Route Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{deleteTarget.name}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
