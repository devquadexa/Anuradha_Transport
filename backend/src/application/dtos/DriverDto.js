const Driver = require('../../domain/entities/Driver');

function toDriverResponseDto(driver) {
  if (!driver) return null;
  return {
    id: driver.id,
    userId: driver.userId,
    firstName: driver.firstName,
    lastName: driver.lastName,
    fullName: driver.fullName,
    nicNumber: driver.nicNumber,
    phone: driver.phone,
    email: driver.email,
    licenseNumber: driver.licenseNumber,
    licenseExpiry: driver.licenseExpiry,
    licenseDaysLeft: Driver.daysUntil(driver.licenseExpiry),
    licenseStatus: Driver.expiryStatus(driver.licenseExpiry, 30),
    address: driver.address,
    vehicleNumber: driver.vehicleNumber,
    insuranceProvider: driver.insuranceProvider,
    insurancePolicyNumber: driver.insurancePolicyNumber,
    insuranceExpiry: driver.insuranceExpiry,
    insuranceDaysLeft: Driver.daysUntil(driver.insuranceExpiry),
    insuranceStatus: Driver.expiryStatus(driver.insuranceExpiry, 30),
    status: driver.status,
    notes: driver.notes,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

module.exports = { toDriverResponseDto };
