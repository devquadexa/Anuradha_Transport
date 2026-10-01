class Customer {
  constructor({
    id,
    companyName,
    contactPerson,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    country,
    status,
    notes,
    contactPersons,
    divisionId,
    divisionName,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    deletedAt,
  }) {
    this.id = id;
    this.companyName = companyName;
    this.contactPerson = contactPerson;
    this.email = email;
    this.phone = phone;
    this.addressLine1 = addressLine1;
    this.addressLine2 = addressLine2;
    this.city = city;
    this.country = country;
    this.status = status;
    this.notes = notes;
    this.contactPersons = contactPersons;
    this.divisionId = divisionId;
    this.divisionName = divisionName;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  isActive() {
    return this.status === 'active' && !this.deletedAt;
  }
}

module.exports = Customer;
