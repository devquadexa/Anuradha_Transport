class Driver {
  constructor({
    id,
    userId,
    firstName,
    lastName,
    nicNumber,
    phone,
    email,
    licenseNumber,
    licenseExpiry,
    address,
    vehicleNumber,
    insuranceProvider,
    insurancePolicyNumber,
    insuranceExpiry,
    status,
    notes,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    deletedAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.nicNumber = nicNumber;
    this.phone = phone;
    this.email = email;
    this.licenseNumber = licenseNumber;
    this.licenseExpiry = licenseExpiry;
    this.address = address;
    this.vehicleNumber = vehicleNumber;
    this.insuranceProvider = insuranceProvider;
    this.insurancePolicyNumber = insurancePolicyNumber;
    this.insuranceExpiry = insuranceExpiry;
    this.status = status;
    this.notes = notes;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  isAvailable() {
    return this.status === 'active' && !this.deletedAt;
  }

  hasLicenseExpired(referenceDate = new Date()) {
    return new Date(this.licenseExpiry).getTime() < referenceDate.getTime();
  }

  // Days until a date (negative if already past). null if no date.
  static daysUntil(dateStr, referenceDate = new Date()) {
    if (!dateStr) return null;
    const ms = new Date(dateStr).getTime() - referenceDate.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  // Derived status for a document expiry: 'expired' | 'expiring' | 'valid' | 'unknown'
  static expiryStatus(dateStr, warnDays = 30, referenceDate = new Date()) {
    const days = Driver.daysUntil(dateStr, referenceDate);
    if (days == null) return 'unknown';
    if (days < 0) return 'expired';
    if (days <= warnDays) return 'expiring';
    return 'valid';
  }
}

module.exports = Driver;
