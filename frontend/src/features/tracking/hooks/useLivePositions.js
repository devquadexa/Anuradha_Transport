import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';

/**
 * Live positions of all drivers currently on an in-progress trip.
 * Returns the array shape from GET /tracking/live:
 *   { tripId, tripNumber, origin, destination,
 *     driver: { id, name, phone, vehicleNumber },
 *     position: { latitude, longitude, speed, recordedAt } }
 *
 * Polls every `refetchInterval` ms so the status board stays live.
 */
export function useLivePositions({ refetchInterval = 15000 } = {}) {
  return useQuery({
    queryKey: ['tracking', 'live'],
    queryFn: () => apiClient.get('/tracking/live').then((res) => res.data.data || []),
    refetchInterval,
    staleTime: 0,
  });
}
