import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '../api/locationsApi';

export function useLocationsList(params) {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: () => locationsApi.list(params),
    keepPreviousData: true,
  });
}

export function useActiveLocations(customerId) {
  return useQuery({
    queryKey: ['locations', 'active', customerId],
    queryFn: () => locationsApi.listActive(customerId),
    staleTime: 60_000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => locationsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: locationsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  });
}
