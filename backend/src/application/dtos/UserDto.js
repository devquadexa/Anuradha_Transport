/**
 * Maps a domain User entity to a safe, transport-ready shape.
 * Never includes passwordHash.
 */
function toUserResponseDto(user) {
  if (!user) return null;
  const dto = {
    id: user.id,
    roleId: user.roleId,
    roleName: user.roleName,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Include driver-specific fields if user has a linked driver record
  if (user.driver) {
    dto.driver = {
      id: user.driver.id,
      nicNumber: user.driver.nicNumber,
      licenseNumber: user.driver.licenseNumber,
      licenseExpiry: user.driver.licenseExpiry,
      vehicleNumber: user.driver.vehicleNumber,
      insuranceProvider: user.driver.insuranceProvider,
      insurancePolicyNumber: user.driver.insurancePolicyNumber,
      insuranceExpiry: user.driver.insuranceExpiry,
      address: user.driver.address,
      notes: user.driver.notes,
    };
  }

  return dto;
}

module.exports = { toUserResponseDto };
