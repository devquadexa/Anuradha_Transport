const { NotFoundError, ForbiddenError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');

class UpdateUserUseCase {
  constructor(userRepository, roleRepository, logger, driverRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.logger = logger;
    this.driverRepository = driverRepository;
  }

  async execute(id, updates, updatedBy, actorRole) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    if (updates.roleId) {
      const targetRole = await this.roleRepository.findById(updates.roleId);
      const isPromotingToSuperAdmin = targetRole?.name === RoleName.SUPER_ADMIN;
      const existingRole = await this.roleRepository.findById(existing.roleId);
      const isDemotingSuperAdmin = existingRole?.name === RoleName.SUPER_ADMIN && !isPromotingToSuperAdmin;

      if ((isPromotingToSuperAdmin || isDemotingSuperAdmin) && actorRole !== RoleName.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can assign or change the Super Admin role');
      }
    }

    // Separate driver fields from user fields
    const {
      nicNumber,
      licenseNumber,
      licenseExpiry,
      vehicleNumber,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceExpiry,
      address,
      driverNotes,
      ...userUpdates
    } = updates;
    const driverFields = { nicNumber, licenseNumber, licenseExpiry, vehicleNumber, insuranceProvider, insurancePolicyNumber, insuranceExpiry, address, notes: driverNotes };

    const user = await this.userRepository.update(id, { ...userUpdates, updatedBy });

    // Update driver record if this user is a DRIVER
    if (this.driverRepository) {
      const effectiveRoleId = updates.roleId || existing.roleId;
      const role = await this.roleRepository.findById(effectiveRoleId);

      if (role?.name === RoleName.DRIVER) {
        const existingDriver = await this.driverRepository.findByUserId(id);
        const driverData = {
          firstName: updates.firstName || existing.firstName,
          lastName: updates.lastName || existing.lastName,
          phone: updates.phone || existing.phone,
          email: existing.email,
          ...(nicNumber !== undefined && { nicNumber }),
          ...(licenseNumber !== undefined && { licenseNumber }),
          ...(licenseExpiry !== undefined && { licenseExpiry }),
          ...(vehicleNumber !== undefined && { vehicleNumber }),
          ...(insuranceProvider !== undefined && { insuranceProvider }),
          ...(insurancePolicyNumber !== undefined && { insurancePolicyNumber }),
          ...(insuranceExpiry !== undefined && { insuranceExpiry }),
          ...(address !== undefined && { address }),
          ...(driverNotes !== undefined && { notes: driverNotes }),
          status: updates.status || existing.status,
          updatedBy,
        };

        if (existingDriver) {
          await this.driverRepository.update(existingDriver.id, driverData);
        } else {
          // Create a driver record if it doesn't exist yet
          await this.driverRepository.create({
            userId: id,
            nicNumber: nicNumber || '',
            licenseNumber: licenseNumber || '',
            licenseExpiry: licenseExpiry || new Date().toISOString().slice(0, 10),
            ...driverData,
            createdBy: updatedBy,
          });
        }
      }
    }

    this.logger.info('User updated', { userId: id, updatedBy });
    return user;
  }
}

module.exports = UpdateUserUseCase;
