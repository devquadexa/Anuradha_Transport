import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customersApi';

export function useCustomersList(params) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.list(params),
    keepPreviousData: true,
  });
}

export function useDivisions() {
  return useQuery({
    queryKey: ['divisions'],
    queryFn: customersApi.listDivisions,
    staleTime: 5 * 60_000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Customer creation auto-creates a Location from the address, so the
      // locations cache must be refreshed too.
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => customersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
