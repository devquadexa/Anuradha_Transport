import { useMemo, useState } from 'react';
import { Box, Stack, Chip, Typography } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDriversList } from '../hooks/useDrivers';
import { useLivePositions } from '../../tracking/hooks/useLivePositions';
import { useTripsList } from '../../trips/hooks/useTrips';
import PageHeader from '../../../components/layout-elements/PageHeader';

/**
 * Admin driver-status board.
 *
 * Operational status combines the driver list, in-progress trips, and the
 * live GPS feed:
 *   - emergency: driver's in-progress trip has emergencyStop set by the driver
 *   - on_trip:   driver has an in-progress trip (no emergency flag)
 *   - available: active driver with no in-progress trip
 *   - off_duty:  driver status is inactive / on_leave / suspended
 *
 * Emergency is NEVER inferred automatically — it only reflects the flag the
 * driver toggles on their own trip.
 */

const STATUS_META = {
  available: { label: 'Available', color: 'success', dot: '#16A34A', tint: 'rgba(22,163,74,0.10)' },
  on_trip: { label: 'On Trip', color: 'info', dot: '#0EA5E9', tint: 'rgba(14,165,233,0.10)' },
  emergency: { label: 'Emergency Stop', color: 'error', dot: '#DC2626', tint: 'rgba(220,38,38,0.10)' },
  off_duty: { label: 'Off Duty', color: 'default', dot: '#94A3B8', tint: 'rgba(148,163,184,0.12)' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'on_trip', label: 'On Trip' },
  { key: 'emergency', label: 'Emergency Stop' },
  { key: 'off_duty', label: 'Off Duty' },
];

function timeAgo(dateStr) {
  if (!dateStr) return 'no data';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export default function DriverStatusPage() {
  const [filter, setFilter] = useState('all');

  const { data: driversData, isLoading: driversLoading } = useDriversList({ page: 1, pageSize: 100 });
  const { data: livePositions = [], isLoading: liveLoading, dataUpdatedAt } = useLivePositions();
  // In-progress trips carry the real emergencyStop flag; poll them too.
  const { data: activeTripsData, isLoading: tripsLoading } = useTripsList({
    page: 1,
    pageSize: 100,
    status: 'in_progress',
  });

  const drivers = driversData?.data || [];
  const activeTrips = activeTripsData?.data || [];

  // Map driverId -> live GPS position for quick lookup.
  const liveByDriver = useMemo(() => {
    const map = new Map();
    (livePositions || []).forEach((p) => {
      if (p.driver?.id != null) map.set(p.driver.id, p);
    });
    return map;
  }, [livePositions]);

  // Map driverId -> current in-progress trip (source of emergencyStop flag).
  const tripByDriver = useMemo(() => {
    const map = new Map();
    activeTrips.forEach((t) => {
      if (t.driverId != null) map.set(t.driverId, t);
    });
    return map;
  }, [activeTrips]);

  // Derive status for each driver.
  const rows = useMemo(() => {
    return drivers.map((driver) => {
      const live = liveByDriver.get(driver.id);
      const activeTrip = tripByDriver.get(driver.id);
      let status = 'available';

      if (activeTrip) {
        status = activeTrip.emergencyStop ? 'emergency' : 'on_trip';
      } else if (driver.status !== 'active') {
        status = 'off_duty';
      } else {
        status = 'available';
      }

      return { driver, live, activeTrip, status };
    });
  }, [drivers, liveByDriver, tripByDriver]);

  const counts = useMemo(() => {
    const c = { available: 0, on_trip: 0, emergency: 0, off_duty: 0 };
    rows.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);

  const visibleRows = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const loading = driversLoading || liveLoading || tripsLoading;

  return (
    <Box>
      <PageHeader
        icon={<BadgeIcon fontSize="medium" />}
        title="Driver Status"
        description="Live operational status of every driver, derived from trips and GPS."
        actions={
          <Chip
            icon={<RefreshIcon sx={{ fontSize: 16 }} />}
            label={dataUpdatedAt ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : 'Live'}
            variant="outlined"
          />
        }
      />

      {/* Summary count cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {['available', 'on_trip', 'emergency', 'off_duty'].map((key) => {
          const meta = STATUS_META[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`rounded-2xl bg-white p-5 text-left shadow-sm ring-1 transition hover:shadow-md dark:bg-slate-800 ${
                filter === key ? 'ring-2 ring-blue-500' : 'ring-gray-100 dark:ring-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{meta.label}</span>
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.dot }} />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-gray-800 dark:text-slate-100">
                {loading ? '—' : counts[key]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter chips */}
      <Stack direction="row" spacing={1} sx={{ mt: 3, mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            onClick={() => setFilter(f.key)}
            color={filter === f.key ? 'primary' : 'default'}
            variant={filter === f.key ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      {/* Driver cards */}
      {loading ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading driver status…</Typography>
      ) : visibleRows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No drivers in this status.</Typography>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRows.map(({ driver, live, activeTrip, status }) => (
            <DriverStatusCard key={driver.id} driver={driver} live={live} activeTrip={activeTrip} status={status} />
          ))}
        </div>
      )}

      {/* Trip-wise table (drivers currently on a trip) */}
      <TripWiseTable
        rows={rows.filter((r) => r.activeTrip)}
        loading={loading}
      />
    </Box>
  );
}

// Table of drivers currently on a trip, shown trip-by-trip.
function TripWiseTable({ rows, loading }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-700">
        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">Trips in Progress</h3>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{rows.length} active</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50/60 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-700/40 dark:text-slate-400">
              <th className="px-5 py-3">Trip</th>
              <th className="px-5 py-3">Driver</th>
              <th className="px-5 py-3">Route</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Speed</th>
              <th className="px-5 py-3">Last GPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-400">Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-400 dark:text-slate-500">
                  No trips in progress right now.
                </td>
              </tr>
            ) : (
              rows.map(({ driver, live, activeTrip, status }) => {
                const meta = STATUS_META[status];
                return (
                  <tr key={activeTrip.id} className="text-gray-700 dark:text-slate-200">
                    <td className="px-5 py-3 font-semibold">{activeTrip.tripNumber}</td>
                    <td className="px-5 py-3">
                      {driver.firstName} {driver.lastName}
                      <span className="block text-xs text-gray-400 dark:text-slate-500">
                        {driver.vehicleNumber || 'No vehicle'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block max-w-[220px] truncate">
                        {activeTrip.origin} → {activeTrip.destination}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: meta.tint, color: meta.dot }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {live?.position?.speed != null ? `${live.position.speed.toFixed(0)} km/h` : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-slate-400">
                      {live?.position?.recordedAt ? timeAgo(live.position.recordedAt) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriverStatusCard({ driver, live, activeTrip, status }) {
  const meta = STATUS_META[status];
  const initials = `${driver.firstName?.[0] || ''}${driver.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700"
      style={{ borderLeft: `4px solid ${meta.dot}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: meta.dot }}
          >
            {initials || '—'}
          </span>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-slate-100">
              {driver.firstName} {driver.lastName}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {driver.vehicleNumber || 'No vehicle'} • {driver.phone || '—'}
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: meta.tint, color: meta.dot }}
        >
          {meta.label}
        </span>
      </div>

      {/* Trip / live detail */}
      {activeTrip ? (
        <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs dark:border-slate-700">
          <div className="flex justify-between">
            <span className="text-gray-400 dark:text-slate-500">Trip</span>
            <span className="font-semibold text-gray-700 dark:text-slate-200">{activeTrip.tripNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 dark:text-slate-500">Route</span>
            <span className="max-w-[60%] truncate text-right font-medium text-gray-700 dark:text-slate-200">
              {activeTrip.origin} → {activeTrip.destination}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 dark:text-slate-500">Speed</span>
            <span className="font-medium text-gray-700 dark:text-slate-200">
              {live?.position?.speed != null ? `${live.position.speed.toFixed(0)} km/h` : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 dark:text-slate-500">Last GPS</span>
            <span className="font-medium text-gray-700 dark:text-slate-200">{timeAgo(live?.position?.recordedAt)}</span>
          </div>
          {status === 'emergency' && (
            <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              🛑 Driver activated emergency stop{activeTrip.emergencyStopAt ? ` • ${timeAgo(activeTrip.emergencyStopAt)}` : ''}
              {activeTrip.emergencyStopReason ? ` — ${activeTrip.emergencyStopReason}` : ''}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-slate-700 dark:text-slate-500">
          {status === 'off_duty'
            ? `Off duty (${String(driver.status).replace('_', ' ')})`
            : 'No active trip — available for assignment.'}
        </div>
      )}
    </div>
  );
}
