import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../api/tripsApi';

export function useTripsList(params) {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () => tripsApi.list(params),
    keepPreviousData: true,
  });
}

export function useTrip(id) {
  return useQuery({
    queryKey: ['trips', 'detail', id],
    queryFn: () => tripsApi.getById(id),
    enabled: !!id,
  });
}

export function usePendingApprovals(params) {
  return useQuery({
    queryKey: ['trips', 'pending-approval', params],
    queryFn: () => tripsApi.listPendingApproval(params),
    keepPreviousData: true,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => tripsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useAssignTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, driverId }) => tripsApi.assign(id, driverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useUpdateTripStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, gps, extra }) => tripsApi.updateStatus(id, status, gps, extra),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useUpdateTripDriverDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, stopId, payload }) => tripsApi.updateStopDetails(tripId, stopId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useApproveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => tripsApi.approveTrip(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useSetEmergencyStop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => tripsApi.setEmergencyStop(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['tracking'] });
    },
  });
}

export function useReorderStops() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stops }) => tripsApi.reorderStops(id, stops),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}
