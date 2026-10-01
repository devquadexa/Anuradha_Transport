import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const COMPANY_NAME = 'ANURADHA TRANSPORT SERVICE';

// ---- style helpers -------------------------------------------------------
const thin = { style: 'thin', color: { argb: 'FF000000' } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
const SUBHEAD_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
const TOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
}

/**
 * Build the per-trip section on a worksheet, mirroring the paper delivery form:
 * a route/vehicle info block, then a table of delivery stops with distance columns.
 */
function writeTripSection(ws, trip, startRow) {
  let r = startRow;

  // ---- Info block --------------------------------------------------------
  const driverName = trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}`.trim() : '—';
  const vehicleNo = trip.driver?.vehicleNumber || '—';
  const infoRows = [
    ['Trip No', `: ${trip.tripNumber || ''}`],
    ['Route', `: ${trip.origin || ''} → ${trip.destination || ''}`],
    ['Vehicle No', `: ${vehicleNo}`],
    ['Driver', `: ${driverName}`],
    ['Delivery Date', `: ${fmtDate(trip.completedAt || trip.scheduledDate)}`],
    ['Status', `: ${(trip.status || '').replace('_', ' ')} / Approval: ${trip.approvalStatus || '—'}`],
  ];

  infoRows.forEach(([label, value]) => {
    const row = ws.getRow(r);
    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = { bold: true };
    labelCell.border = allBorders;
    const valueCell = row.getCell(2);
    valueCell.value = value;
    valueCell.border = allBorders;
    ws.mergeCells(r, 2, r, 6);
    r += 1;
  });

  r += 1; // spacer

  // ---- Table header ------------------------------------------------------
  const headerRow = ws.getRow(r);
  const headers = [
    'Location',
    'Invoice(s)',
    'Expected / Map (km)',
    'GPS Actual (km)',
    'Driver Mileage (km)',
    'Odometer Reading',
    'Difference: Driver vs GPS (km)',
  ];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = allBorders;
  });
  headerRow.height = 30;
  r += 1;

  // ---- Stop rows ---------------------------------------------------------
  const stops = trip.stops || [];
  let totExpected = 0;
  let totGps = 0;
  let totDriver = 0;
  let firstOdometer = null;
  let lastOdometer = null;

  const bodyStart = r;
  stops.forEach((stop) => {
    const expected = num(stop.expectedMileage);
    const gps = num(stop.gpsMileage);
    const driver = num(stop.driverMileage);
    const odometer = num(stop.odometerReading);
    const diff = gps != null && driver != null ? Number((driver - gps).toFixed(2)) : null;

    if (expected != null) totExpected += expected;
    if (gps != null) totGps += gps;
    if (driver != null) totDriver += driver;
    if (odometer != null) {
      if (firstOdometer == null) firstOdometer = odometer;
      lastOdometer = odometer;
    }

    const invoices = (stop.invoices || [])
      .map((inv) => (typeof inv === 'string' ? inv : inv?.invoiceNumber))
      .filter(Boolean)
      .join(', ');

    const row = ws.getRow(r);
    const values = [
      stop.gpsLocationName || stop.locationName || '',
      invoices,
      expected,
      gps,
      driver,
      odometer,
      diff,
    ];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.border = allBorders;
      if (i >= 2) {
        cell.alignment = { horizontal: 'center' };
        cell.numFmt = '#,##0.00';
      }
    });
    r += 1;
  });

  if (stops.length === 0) {
    const row = ws.getRow(r);
    const cell = row.getCell(1);
    cell.value = 'No delivery stops recorded (direct delivery).';
    cell.alignment = { horizontal: 'left' };
    ws.mergeCells(r, 1, r, 7);
    row.getCell(1).border = allBorders;
    r += 1;
  }

  // ---- Totals ------------------------------------------------------------
  const totalRow = ws.getRow(r);
  totalRow.getCell(1).value = 'Total';
  totalRow.getCell(1).font = { bold: true };
  ws.mergeCells(r, 1, r, 2);
  // Odometer total = distance travelled = last reading − first reading.
  const odometerDistance =
    firstOdometer != null && lastOdometer != null ? Number((lastOdometer - firstOdometer).toFixed(2)) : 0;
  const totals = [
    Number(totExpected.toFixed(2)),
    Number(totGps.toFixed(2)),
    Number(totDriver.toFixed(2)),
    odometerDistance,
    Number((totDriver - totGps).toFixed(2)),
  ];
  totals.forEach((v, i) => {
    const cell = totalRow.getCell(i + 3);
    cell.value = v;
    cell.font = { bold: true };
    cell.numFmt = '#,##0.00';
    cell.alignment = { horizontal: 'center' };
    cell.fill = TOTAL_FILL;
  });
  for (let c = 1; c <= 7; c += 1) totalRow.getCell(c).border = allBorders;

  // keep body reference to avoid unused warning / future use
  void bodyStart;
  r += 2; // spacer after section

  return r;
}

/**
 * Generate and download an Excel workbook for the given trips.
 * @param {Array} trips - array of trip objects (with stops)
 * @param {Object} opts - { monthLabel: 'August 2026' }
 */
export async function exportTripReportsToExcel(trips, opts = {}) {
  const { monthLabel = '' } = opts;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_NAME;
  workbook.created = new Date();

  // ============ Summary sheet =============================================
  const summary = workbook.addWorksheet('Summary', {
    properties: { defaultColWidth: 18 },
    views: [{ showGridLines: false }],
  });
  // Columns A..L
  summary.columns = [
    { width: 16 }, // A Trip No
    { width: 28 }, // B Route
    { width: 18 }, // C Driver
    { width: 12 }, // D Vehicle
    { width: 14 }, // E Delivery Date
    { width: 14 }, // F Shortest Path KM
    { width: 16 }, // G Actual google mileage
    { width: 16 }, // H Final Odometer reading
    { width: 20 }, // I Odometer vs actual
    { width: 20 }, // J Odometer vs shortest
    { width: 20 }, // K Actual vs shortest
  ];
  const LAST_COL = 11; // K

  // Title band
  summary.mergeCells(1, 1, 1, LAST_COL);
  const titleCell = summary.getCell('A1');
  titleCell.value = COMPANY_NAME;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = HEADER_FILL;
  summary.getRow(1).height = 28;

  summary.mergeCells(2, 1, 2, LAST_COL);
  const subCell = summary.getCell('A2');
  subCell.value = `Trip Distance Report${monthLabel ? ` — ${monthLabel}` : ''}`;
  subCell.font = { bold: true, size: 12 };
  subCell.alignment = { horizontal: 'center' };

  // Column headers
  const sHeaders = [
    'Trip No',
    'Route',
    'Driver',
    'Vehicle',
    'Delivery Date',
    'Shortest Path (km)',
    'Actual Google Mileage (km)',
    'Final Odometer Reading (km)',
    'Difference: Odometer vs Actual (km)',
    'Difference: Odometer vs Shortest (km)',
    'Difference: Actual vs Shortest (km)',
  ];
  const sHeadRow = summary.getRow(4);
  sHeaders.forEach((h, i) => {
    const cell = sHeadRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = SUBHEAD_FILL;
    cell.border = allBorders;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  sHeadRow.height = 42;

  const FIRST_DATA_ROW = 5;
  let sr = FIRST_DATA_ROW;
  trips.forEach((trip) => {
    const stops = trip.stops || [];
    const shortest = stops.reduce((s, st) => s + (num(st.expectedMileage) || 0), 0);
    const googleActual = stops.reduce((s, st) => s + (num(st.driverMileage) || 0), 0);

    // The FINAL odometer reading is the one captured when the trip was
    // completed at the end point (trip.finalOdometerReading), not a per-stop
    // reading — those only reflect the meter at intermediate delivery stops.
    const finalOdometer = num(trip.finalOdometerReading) || 0;

    const row = summary.getRow(sr);
    // A..H: literal values; I..K: Excel formulas referencing F/G/H.
    row.getCell(1).value = trip.tripNumber || '';
    row.getCell(2).value = `${trip.origin || ''} → ${trip.destination || ''}`;
    row.getCell(3).value = trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : '—';
    row.getCell(4).value = trip.driver?.vehicleNumber || '—';
    row.getCell(5).value = fmtDate(trip.completedAt || trip.scheduledDate);
    row.getCell(6).value = Number(shortest.toFixed(2)); // F Shortest Path
    row.getCell(7).value = Number(googleActual.toFixed(2)); // G Actual google mileage
    row.getCell(8).value = finalOdometer; // H Final odometer reading (e.g. 50097)

    // I = Final Odometer − Actual google
    row.getCell(9).value = { formula: `H${sr}-G${sr}` };
    // J = Final Odometer − Shortest Path
    row.getCell(10).value = { formula: `H${sr}-F${sr}` };
    // K = Actual google − Shortest Path
    row.getCell(11).value = { formula: `G${sr}-F${sr}` };

    for (let c = 1; c <= LAST_COL; c += 1) {
      const cell = row.getCell(c);
      cell.border = allBorders;
      if (c >= 6) { cell.numFmt = '#,##0.00'; cell.alignment = { horizontal: 'center' }; }
    }
    // Emphasise the difference columns (I, J, K).
    [9, 10, 11].forEach((c) => { row.getCell(c).font = { bold: true, color: { argb: 'FFC00000' } }; });
    sr += 1;
  });

  const LAST_DATA_ROW = sr - 1;

  // Grand total row — sum F..K with SUM formulas.
  const gRow = summary.getRow(sr);
  gRow.getCell(1).value = 'TOTAL';
  gRow.getCell(1).font = { bold: true };
  summary.mergeCells(sr, 1, sr, 5);
  for (let c = 6; c <= LAST_COL; c += 1) {
    const cell = gRow.getCell(c);
    cell.font = { bold: true };
    cell.fill = TOTAL_FILL;
    cell.alignment = { horizontal: 'center' };
    cell.border = allBorders;

    // Column H is the FINAL odometer reading (absolute value) — summing it
    // across trips is meaningless, so leave it blank in the total.
    if (c === 8) {
      cell.value = '';
      continue;
    }

    const colLetter = summary.getColumn(c).letter;
    if (LAST_DATA_ROW >= FIRST_DATA_ROW) {
      cell.value = { formula: `SUM(${colLetter}${FIRST_DATA_ROW}:${colLetter}${LAST_DATA_ROW})` };
    } else {
      cell.value = 0;
    }
    cell.numFmt = '#,##0.00';
  }
  for (let c = 1; c <= LAST_COL; c += 1) gRow.getCell(c).border = allBorders;

  // ============ Details sheet (one section per trip) ======================
  const details = workbook.addWorksheet('Trip Details', {
    views: [{ showGridLines: false }],
  });
  details.columns = [
    { width: 28 }, { width: 22 }, { width: 16 },
    { width: 16 }, { width: 14 }, { width: 14 }, { width: 22 },
  ];

  // Details title
  details.mergeCells('A1:G1');
  const dTitle = details.getCell('A1');
  dTitle.value = `${COMPANY_NAME} — Delivery Details${monthLabel ? ` (${monthLabel})` : ''}`;
  dTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  dTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  dTitle.fill = HEADER_FILL;
  details.getRow(1).height = 26;

  let row = 3;
  trips.forEach((trip) => {
    row = writeTripSection(details, trip, row);
  });

  // ============ Save ======================================================
  const buffer = await workbook.xlsx.writeBuffer();
  const safeMonth = (monthLabel || 'all').replace(/\s+/g, '_');
  const filename = `Trip_Report_${safeMonth}.xlsx`;
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
}
