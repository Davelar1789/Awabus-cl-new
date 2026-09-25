import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usePageHeader from '../../hooks/usePageHeader.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import Card, { CardHeader, CardBody } from '../../components/ui/Card.jsx';
import RouteForm from './RouteForm.jsx';
import { getRoute, updateRoute } from '../../api/routes.js';

export default function EditRoute() {
  usePageHeader({ breadcrumb: ['Awabus', 'Routes', 'Edit route'] });
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(null);

  const { data: route, isLoading } = useQuery({ queryKey: ['route', id], queryFn: () => getRoute(id) });

  useEffect(() => {
    if (route) {
      setValues({ name: route.name });
    }
  }, [route]);

  const mutation = useMutation({
    mutationFn: (payload) => updateRoute(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      navigate('/routes');
    },
  });

  if (isLoading || !values) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Edit route" subtitle="Modify this route's name and status." />

      <Card className="mb-6">
        <CardHeader title="Current assignments" subtitle="Managed from the Buses/Drivers/Students pages, not here." />
        <CardBody className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <SummaryStat label="Assigned bus" value={route.assignedBus ? `${route.assignedBus.name} (${route.assignedBus.plateNumber})` : 'Not assigned yet'} />
          <SummaryStat
            label="Assigned driver"
            value={route.assignedDriver ? `${route.assignedDriver.firstName} ${route.assignedDriver.lastName}` : 'Not assigned yet'}
          />
          <SummaryStat label="Students on route" value={route.studentCount ?? route.students?.length ?? 0} />
        </CardBody>
      </Card>

      <RouteForm
        mode="edit"
        values={values}
        onChange={setValues}
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(values);
        }}
        submitting={mutation.isPending}
        routeIdDisplay={route.routeId}
        error={mutation.error?.message}
      />
    </div>
  );
}

const SummaryStat = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{value}</p>
  </div>
);
