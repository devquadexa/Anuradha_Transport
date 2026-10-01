class Trip {
  constructor({
    id,
    tripNumber,
    customerId,
    driverId,
    origin,
    destination,
    endPoint,
    scheduledDate,
    scheduledTime,
    status,
    cargoDescription,
    remarks,
    mileage,
    finalOdometerReading,
    invoiceNumber,
    startLatitude,
    startLongitude,
    assignedAt,
    startedAt,
    completedAt,
    approvalStatus,
    approvedBy,
    approvedAt,
    rejectionReason,
    emergencyStop,
    emergencyStopAt,
    emergencyStopReason,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    deletedAt,
    customer,
    driver,
    stops = [],
  }) {
    this.id = id;
    this.tripNumber = tripNumber;
    this.customerId = customerId;
    this.driverId = driverId;
    this.origin = origin;
    this.destination = destination;
    this.endPoint = endPoint;
    this.scheduledDate = scheduledDate;
    this.scheduledTime = scheduledTime;
    this.status = status;
    this.cargoDescription = cargoDescription;
    this.remarks = remarks;
    this.mileage = mileage;
    this.finalOdometerReading = finalOdometerReading;
    this.invoiceNumber = invoiceNumber;
    this.startLatitude = startLatitude;
    this.startLongitude = startLongitude;
    this.assignedAt = assignedAt;
    this.startedAt = startedAt;
    this.completedAt = completedAt;
    this.approvalStatus = approvalStatus;
    this.approvedBy = approvedBy;
    this.approvedAt = approvedAt;
    this.rejectionReason = rejectionReason;
    this.emergencyStop = emergencyStop;
    this.emergencyStopAt = emergencyStopAt;
    this.emergencyStopReason = emergencyStopReason;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.customer = customer;
    this.driver = driver;
    this.stops = stops;
  }

  isAssigned() {
    return !!this.driverId;
  }

  canBeAssigned() {
    return ['pending', 'assigned'].includes(this.status);
  }

  canTransitionTo(nextStatus) {
    const allowed = {
      pending: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    return (allowed[this.status] || []).includes(nextStatus);
  }
}

module.exports = Trip;
