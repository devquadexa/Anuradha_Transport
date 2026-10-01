class Location {
  constructor({
    id,
    customerId,
    name,
    address,
    latitude,
    longitude,
    contactName,
    contactPhone,
    notes,
    isActive,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    deletedAt,
    customer,
  }) {
    this.id = id;
    this.customerId = customerId;
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.contactName = contactName;
    this.contactPhone = contactPhone;
    this.notes = notes;
    this.isActive = isActive;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.customer = customer;
  }
}

module.exports = Location;
