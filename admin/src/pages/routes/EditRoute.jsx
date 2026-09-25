import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usePageHeader from '../../hooks/usePageHeader.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
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
      setValues({
        name: route.name,
        assignedBus: route.assignedBus?._id || null,
        assignedDriver: route.assignedDriver?._id || null,
        students: route.students?.map((s) => s._id) || [],
      });
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
      <PageHeader title="Edit route" subtitle="Modify operational configurations and assignments for this line." />
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
      />
    </div>
  );
}
