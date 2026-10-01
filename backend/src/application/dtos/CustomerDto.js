function toCustomerResponseDto(customer) {
  if (!customer) return null;
  return {
    id: customer.id,
    companyName: customer.companyName,
    contactPerson: customer.contactPerson,
    email: customer.email,
    phone: customer.phone,
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2,
    city: customer.city,
    country: customer.country,
    status: customer.status,
    notes: customer.notes,
    contactPersons: customer.contactPersons || [],
    divisionId: customer.divisionId,
    divisionName: customer.divisionName,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

module.exports = { toCustomerResponseDto };
