const { Op } = require('sequelize');
const ITripRepository = require('../../../domain/repositories/ITripRepository');
const Trip = require('../../../domain/entities/Trip');
const TripStop = require('../../../domain/entities/TripStop');
const {
  Trip: TripModel,
  TripStop: TripStopModel,
  TripStopInvoice: TripStopInvoiceModel,
  Customer: CustomerModel,
  Driver: DriverModel,
  sequelize,
} = require('../sequelize/models');

function stopToDomain(instance) {
  if (!instance) return null;
  const plain = instance.get ? instance.get({ plain: true }) : instance;
  return new TripStop({
    id: plain.id,
    tripId: plain.tripId,
    locationId: plain.locationId,
    sequenceNo: plain.sequenceNo,
    locationName: plain.locationName,
    address: plain.address,
    contactName: plain.contactName,
    contactPhone: plain.contactPhone,
    status: plain.status,
    notes: plain.notes,
    mileage: plain.mileage ? parseFloat(plain.mileage) : null,
    invoiceNumber: plain.invoiceNumber,
    latitude: plain.latitude ? parseFloat(plain.latitude) : null,
    longitude: plain.longitude ? parseFloat(plain.longitude) : null,
    gpsLocationName: plain.gpsLocationName,
    gpsMileage: plain.gpsMileage ? parseFloat(plain.gpsMileage) : null,
    driverMileage: plain.driverMileage ? parseFloat(plain.driverMileage) : null,
    odometerReading: plain.odometerReading ? parseFloat(plain.odometerReading) : null,
    expectedMileage: plain.expectedMileage ? parseFloat(plain.expectedMileage) : null,
    arrivedAt: plain.arrivedAt,
    deliveredAt: plain.deliveredAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    invoices: (plain.Invoices || []).map((inv) => inv.invoiceNumber),
  });
}

function toDomain(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return new Trip({
    id: plain.id,
    tripNumber: plain.tripNumber,
    customerId: plain.customerId,
    driverId: plain.driverId,
    origin: plain.origin,
    destination: plain.destination,
    endPoint: plain.endPoint,
    scheduledDate: plain.scheduledDate,
    scheduledTime: plain.scheduledTime,
    status: plain.status,
    cargoDescription: plain.cargoDescription,
    remarks: plain.remarks,
    mileage: plain.mileage ? parseFloat(plain.mileage) : null,
    finalOdometerReading: plain.finalOdometerReading ? parseFloat(plain.finalOdometerReading) : null,
    invoiceNumber: plain.invoiceNumber,
    startLatitude: plain.startLatitude ? parseFloat(plain.startLatitude) : null,
    startLongitude: plain.startLongitude ? parseFloat(plain.startLongitude) : null,
    assignedAt: plain.assignedAt,
    startedAt: plain.startedAt,
    completedAt: plain.completedAt,
    approvalStatus: plain.approvalStatus,
    approvedBy: plain.approvedBy,
    approvedAt: plain.approvedAt,
    rejectionReason: plain.rejectionReason,
    emergencyStop: plain.emergencyStop,
    emergencyStopAt: plain.emergencyStopAt,
    emergencyStopReason: plain.emergencyStopReason,
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    deletedAt: plain.deletedAt,
    customer: plain.Customer ? { id: plain.Customer.id, companyName: plain.Customer.companyName } : null,
    driver: plain.Driver
      ? { id: plain.Driver.id, firstName: plain.Driver.firstName, lastName: plain.Driver.lastName, phone: plain.Driver.phone, vehicleNumber: plain.Driver.vehicleNumber }
      : null,
    stops: (plain.TripStops || []).map(stopToDomain).sort((a, b) => a.sequenceNo - b.sequenceNo),
  });
}

const INCLUDE_RELATIONS = [
  { model: CustomerModel, attributes: ['id', 'companyName'] },
  { model: DriverModel, attributes: ['id', 'firstName', 'lastName', 'phone', 'vehicleNumber'] },
  { model: TripStopModel, as: 'TripStops', include: [{ model: TripStopInvoiceModel, as: 'Invoices' }] },
];

class TripRepository extends ITripRepository {
  async findById(id) {
    const instance = await TripModel.findByPk(id, { include: INCLUDE_RELATIONS });
    return toDomain(instance);
  }

  async create(data, stops = []) {
    return sequelize.transaction(async (transaction) => {
      const instance = await TripModel.create(data, { transaction });

      if (stops.length > 0) {
        await TripStopModel.bulkCreate(
          stops.map((stop, idx) => ({ ...stop, tripId: instance.id, sequenceNo: idx + 1 })),
          { transaction }
        );
      }

      return instance.id;
    }).then((id) => this.findById(id));
  }

  async update(id, data) {
    await TripModel.update(data, { where: { id } });
    return this.findById(id);
  }

  async softDelete(id) {
    await TripModel.destroy({ where: { id } });
  }

  async replaceStops(tripId, stops = []) {
    return sequelize.transaction(async (transaction) => {
      await TripStopModel.destroy({ where: { tripId }, transaction });
      if (stops.length > 0) {
        await TripStopModel.bulkCreate(
          stops.map((stop, idx) => ({ ...stop, tripId, sequenceNo: idx + 1 })),
          { transaction }
        );
      }
    }).then(() => this.findById(tripId));
  }

  async updateStop(stopId, data) {
    await TripStopModel.update(data, { where: { id: stopId } });
    const instance = await TripStopModel.findByPk(stopId, { include: [{ model: TripStopInvoiceModel, as: 'Invoices' }] });
    return instance ? stopToDomain(instance) : null;
  }

  // Re-sequence existing stops for a trip according to the given ordered list
  // of stop ids. Optionally update each stop's expectedMileage. This preserves
  // all other stop data (invoices, GPS, status) unlike replaceStops.
  //
  // trip_stops has a UNIQUE (trip_id, sequence_no) constraint, so we can't set
  // final sequence numbers directly (an intermediate row could collide). We do
  // it in two passes: first bump every row to a high temporary sequence, then
  // assign the final 1..N values.
  async reorderStops(tripId, orderedStops = []) {
    const OFFSET = 1000; // temporary sequence space, well above any real count
    return sequelize.transaction(async (transaction) => {
      // Pass 1: move to temporary, non-colliding sequence numbers.
      for (let i = 0; i < orderedStops.length; i += 1) {
        await TripStopModel.update(
          { sequenceNo: OFFSET + i + 1 },
          { where: { id: orderedStops[i].id, tripId }, transaction }
        );
      }
      // Pass 2: assign final sequence numbers (and expectedMileage if given).
      for (let i = 0; i < orderedStops.length; i += 1) {
        const { id, expectedMileage } = orderedStops[i];
        const patch = { sequenceNo: i + 1 };
        if (expectedMileage !== undefined) patch.expectedMileage = expectedMileage;
        await TripStopModel.update(patch, { where: { id, tripId }, transaction });
      }
    }).then(() => this.findById(tripId));
  }

  async findStopById(stopId) {
    const instance = await TripStopModel.findByPk(stopId, { include: [{ model: TripStopInvoiceModel, as: 'Invoices' }] });
    return instance ? stopToDomain(instance) : null;
  }

  async replaceStopInvoices(stopId, invoiceNumbers = []) {
    await TripStopInvoiceModel.destroy({ where: { tripStopId: stopId } });
    if (invoiceNumbers.length > 0) {
      await TripStopInvoiceModel.bulkCreate(
        invoiceNumbers.map((num) => ({ tripStopId: stopId, invoiceNumber: num }))
      );
    }
  }

  async listPendingApproval({ page, pageSize, offset, sortBy, sortOrder }) {
    const where = { status: 'completed', approvalStatus: 'pending' };

    const { rows, count } = await TripModel.findAndCountAll({
      where,
      include: INCLUDE_RELATIONS,
      limit: pageSize,
      offset,
      order: [[sortBy || 'completedAt', sortOrder || 'DESC']],
      distinct: true,
    });

    return { rows: rows.map(toDomain), total: count, page, pageSize };
  }

  async list({ page, pageSize, offset, sortBy, sortOrder, search, status, approvalStatus, driverId, customerId, dateFrom, dateTo }) {
    const where = {};

    if (status) where.status = status;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (driverId) where.driverId = driverId;
    if (customerId) where.customerId = customerId;

    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) where.scheduledDate[Op.gte] = dateFrom;
      if (dateTo) where.scheduledDate[Op.lte] = dateTo;
    }

    if (search) {
      where[Op.or] = [
        { tripNumber: { [Op.like]: `%${search}%` } },
        { origin: { [Op.like]: `%${search}%` } },
        { destination: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await TripModel.findAndCountAll({
      where,
      include: INCLUDE_RELATIONS,
      limit: pageSize,
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    return { rows: rows.map(toDomain), total: count, page, pageSize };
  }

  async listForDriver(driverId, { page, pageSize, offset, sortBy, sortOrder, status }) {
    const where = { driverId };
    if (status) where.status = status;

    const { rows, count } = await TripModel.findAndCountAll({
      where,
      include: INCLUDE_RELATIONS,
      limit: pageSize,
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true,
    });

    return { rows: rows.map(toDomain), total: count, page, pageSize };
  }

  async generateNextTripNumber() {
    const year = new Date().getFullYear();
    const prefix = `TRP-${year}-`;
    // IMPORTANT: include soft-deleted rows (paranoid: false) and order by the
    // trip_number itself. The table is paranoid, so ordering by id while
    // excluding soft-deleted trips can return an older row and produce a
    // sequence number that is already taken by a (soft-)deleted trip, which
    // then violates the unique constraint on trip_number.
    const last = await TripModel.findOne({
      where: { tripNumber: { [Op.like]: `${prefix}%` } },
      order: [['tripNumber', 'DESC']],
      paranoid: false,
    });

    let nextSeq = 1;
    if (last) {
      const lastSeq = parseInt(last.tripNumber.split('-').pop(), 10);
      if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  }
}

module.exports = new TripRepository();
