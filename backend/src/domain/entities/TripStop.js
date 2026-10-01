class TripStop {
  constructor({
    id,
    tripId,
    locationId,
    sequenceNo,
    locationName,
    address,
    contactName,
    contactPhone,
    status,
    notes,
    mileage,
    invoiceNumber,
    latitude,
    longitude,
    gpsLocationName,
    gpsMileage,
    driverMileage,
    odometerReading,
    expectedMileage,
    arrivedAt,
    deliveredAt,
    createdAt,
    updatedAt,
    invoices = [],
  }) {
    this.id = id;
    this.tripId = tripId;
    this.locationId = locationId;
    this.sequenceNo = sequenceNo;
    this.locationName = locationName;
    this.address = address;
    this.contactName = contactName;
    this.contactPhone = contactPhone;
    this.status = status;
    this.notes = notes;
    this.mileage = mileage;
    this.invoiceNumber = invoiceNumber;
    this.latitude = latitude;
    this.longitude = longitude;
    this.gpsLocationName = gpsLocationName;
    this.gpsMileage = gpsMileage;
    this.driverMileage = driverMileage;
    this.odometerReading = odometerReading;
    this.expectedMileage = expectedMileage;
    this.arrivedAt = arrivedAt;
    this.deliveredAt = deliveredAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.invoices = invoices;
  }
}

module.exports = TripStop;
