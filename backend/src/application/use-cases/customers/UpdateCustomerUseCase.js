const { NotFoundError } = require('../../../domain/errors');
const { geocodeAddress } = require('../../../infrastructure/services/GeocodingService');

class UpdateCustomerUseCase {
  constructor(customerRepository, logger, locationRepository) {
    this.customerRepository = customerRepository;
    this.logger = logger;
    this.locationRepository = locationRepository;
  }

  async execute(id, { latitude, longitude, ...updates }, updatedBy) {
    const existing = await this.customerRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    const customer = await this.customerRepository.update(id, { ...updates, updatedBy });
    this.logger.info('Customer updated', { customerId: id, updatedBy });

    // Backfill a saved Location if this customer doesn't have one yet and an
    // address is now available (either from this update or already on file).
    if (this.locationRepository) {
      await this._ensureLocation(customer, updates, latitude, longitude, updatedBy);
    }

    return customer;
  }

  async _ensureLocation(customer, updates, latitude, longitude, updatedBy) {
    try {
      const existingLocations = await this.locationRepository.list({
        page: 1,
        pageSize: 1,
        offset: 0,
        sortBy: 'name',
        sortOrder: 'ASC',
        customerId: customer.id,
      });
      if (existingLocations.total > 0) return; // already has a location

      const addressParts = [
        updates.addressLine1 ?? customer.addressLine1,
        updates.addressLine2 ?? customer.addressLine2,
        updates.city ?? customer.city,
        updates.country ?? customer.country,
      ].filter(Boolean);
      const addressText = addressParts.join(', ');
      if (!addressText) return;

      let lat = latitude;
      let lon = longitude;
      if (lat == null || lon == null) {
        const geocoded = await geocodeAddress(addressText);
        if (geocoded) {
          lat = geocoded.latitude;
          lon = geocoded.longitude;
        }
      }
      if (lat == null || lon == null) return;

      await this.locationRepository.create({
        customerId: customer.id,
        name: addressText,
        address: addressText,
        latitude: lat,
        longitude: lon,
        contactName: customer.contactPerson || null,
        contactPhone: customer.phone || null,
        isActive: true,
        createdBy: updatedBy,
      });
      this.logger.info('Auto-created location for customer on update', { customerId: customer.id });
    } catch (err) {
      this.logger.error('Failed to auto-create location on customer update', { customerId: customer.id, error: err.message });
    }
  }
}

module.exports = UpdateCustomerUseCase;
