import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../api/driversApi';

export function useDriversList(params) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driversApi.list(params),
    keepPreviousData: true,
  });
}

export function useActiveDrivers() {
  return useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: driversApi.listActive,
    staleTime: 60_000,
  });
}

export function useLinkableDriverUsers() {
  return useQuery({
    queryKey: ['drivers', 'linkable-users'],
    queryFn: driversApi.listDriverUsers,
    staleTime: 30_000,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: driversApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => driversApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: driversApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}
