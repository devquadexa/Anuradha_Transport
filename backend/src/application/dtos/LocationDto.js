function toLocationResponseDto(location) {
  if (!location) return null;
  return {
    id: location.id,
    customerId: location.customerId,
    customer: location.customer,
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    contactName: location.contactName,
    contactPhone: location.contactPhone,
    notes: location.notes,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}

module.exports = { toLocationResponseDto };
