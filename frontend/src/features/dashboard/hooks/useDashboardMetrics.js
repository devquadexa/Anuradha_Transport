import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../trips/api/tripsApi';
import { driversApi } from '../../drivers/api/driversApi';
import { locationsApi } from '../../locations/api/locationsApi';

// ---- date range helpers (local time, ISO date strings) --------------------
function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function rangeFor(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start;
  let end;
  if (period === 'today') {
    start = new Date(today);
    end = new Date(today);
  } else if (period === 'week') {
    // Monday-to-Sunday week containing today.
    const dow = today.getDay(); // 0=Sun..6=Sat
    const diffToMonday = dow === 0 ? 6 : dow - 1;
    start = new Date(today);
    start.setDate(today.getDate() - diffToMonday);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else {
    // full calendar month containing today
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }
  return { dateFrom: iso(start), dateTo: iso(end) };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ---- Count of trips scheduled in a period --------------------------------
export function useTripsCount(period) {
  const { dateFrom, dateTo } = rangeFor(period);
  return useQuery({
    queryKey: ['dashboard', 'trips-count', period],
    queryFn: () => tripsApi.list({ page: 1, pageSize: 1, dateFrom, dateTo }).then((r) => r?.meta?.total ?? 0),
    staleTime: 60_000,
  });
}

// ---- Completed trips within a period -------------------------------------
export function useCompletedTripsCount(period) {
  const { dateFrom, dateTo } = rangeFor(period);
  return useQuery({
    queryKey: ['dashboard', 'completed-count', period],
    queryFn: () => tripsApi.list({ page: 1, pageSize: 1, status: 'completed', dateFrom, dateTo }).then((r) => r?.meta?.total ?? 0),
    staleTime: 60_000,
  });
}

// ---- Active (in-progress) trips within a period --------------------------
export function useActiveTripsCount(period) {
  const { dateFrom, dateTo } = rangeFor(period);
  return useQuery({
    queryKey: ['dashboard', 'active-count', period],
    queryFn: () => tripsApi.list({ page: 1, pageSize: 1, status: 'in_progress', dateFrom, dateTo }).then((r) => r?.meta?.total ?? 0),
    staleTime: 30_000,
  });
}

// ---- Total miles (sum of stop GPS mileage) over a period -----------------
export function useMilesTotal(period) {
  const { dateFrom, dateTo } = rangeFor(period);
  return useQuery({
    queryKey: ['dashboard', 'miles', period],
    queryFn: async () => {
      const trips = await tripsApi.listAll({ dateFrom, dateTo });
      let total = 0;
      trips.forEach((t) => {
        (t.stops || []).forEach((s) => {
          const km = s.gpsMileage != null ? num(s.gpsMileage) : num(s.driverMileage);
          total += km;
        });
      });
      return Math.round(total * 100) / 100;
    },
    staleTime: 60_000,
  });
}

// ---- Emergency stops in a period -----------------------------------------
export function useEmergencyStopsCount(period) {
  const { dateFrom, dateTo } = rangeFor(period);
  return useQuery({
    queryKey: ['dashboard', 'emergency', period],
    queryFn: async () => {
      const trips = await tripsApi.listAll({ dateFrom, dateTo });
      return trips.filter((t) => t.emergencyStop).length;
    },
    staleTime: 30_000,
  });
}

// ---- Delivery locations (stops) in a period ------------------------------
export function useDeliveryLocationsCount(period) {
  const { dateFrom, dateTo } = rangeFor(period);
  return useQuery({
    queryKey: ['dashboard', 'delivery-locations', period],
    queryFn: async () => {
      const trips = await tripsApi.listAll({ dateFrom, dateTo });
      return trips.reduce((sum, t) => sum + (t.stops?.length || 0), 0);
    },
    staleTime: 60_000,
  });
}

// ---- Available drivers (active, not on an in-progress trip) --------------
export function useAvailableDriversCount() {
  return useQuery({
    queryKey: ['dashboard', 'available-drivers'],
    queryFn: async () => {
      const [drivers, activeTrips] = await Promise.all([
        driversApi.listActive(),
        tripsApi.listAll({ status: 'in_progress' }),
      ]);
      const busy = new Set(activeTrips.map((t) => t.driverId).filter(Boolean));
      return (drivers || []).filter((d) => !busy.has(d.id)).length;
    },
    staleTime: 30_000,
  });
}

// ---- Total delivery locations on record (all customers) ------------------
export function useTotalLocationsCount() {
  return useQuery({
    queryKey: ['dashboard', 'total-locations'],
    queryFn: () => locationsApi.listActive().then((rows) => (rows || []).length),
    staleTime: 60_000,
  });
}
