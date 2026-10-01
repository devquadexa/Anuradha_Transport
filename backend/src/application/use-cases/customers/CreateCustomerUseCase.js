const { geocodeAddress } = require('../../../infrastructure/services/GeocodingService');

class CreateCustomerUseCase {
  constructor(customerRepository, logger, locationRepository) {
    this.customerRepository = customerRepository;
    this.logger = logger;
    this.locationRepository = locationRepository;
  }

  async execute({ createdBy, latitude, longitude, ...data }) {
    const customer = await this.customerRepository.create({ ...data, createdBy });
    this.logger.info('Customer created', { customerId: customer.id, createdBy });

    // Auto-create a saved Location from the customer's address, so it's
    // immediately available for trip stops. Location.latitude/longitude are
    // mandatory, so if the map picker didn't supply coordinates (e.g. the
    // address was typed manually), fall back to geocoding the address text.
    const addressParts = [data.addressLine1, data.addressLine2, data.city, data.country].filter(Boolean);
    const addressText = addressParts.join(', ');

    if (this.locationRepository && addressText) {
      let lat = latitude;
      let lon = longitude;

      if (lat == null || lon == null) {
        const geocoded = await geocodeAddress(addressText);
        if (geocoded) {
          lat = geocoded.latitude;
          lon = geocoded.longitude;
        }
      }

      if (lat != null && lon != null) {
        try {
          await this.locationRepository.create({
            customerId: customer.id,
            name: addressText,
            address: addressText,
            latitude: lat,
            longitude: lon,
            contactName: data.contactPerson || null,
            contactPhone: data.phone || null,
            isActive: true,
            createdBy,
          });
          this.logger.info('Auto-created location for customer', { customerId: customer.id });
        } catch (err) {
          // Don't fail customer creation if the location save has an issue.
          this.logger.error('Failed to auto-create location for customer', { customerId: customer.id, error: err.message });
        }
      } else {
        this.logger.info('Skipped auto-location: could not resolve coordinates', { customerId: customer.id, addressText });
      }
    }

    return customer;
  }
}

module.exports = CreateCustomerUseCase;
