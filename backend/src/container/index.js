/**
 * Composition root. This is the ONLY place where concrete Infrastructure
 * implementations are wired into Application use cases, and where
 * Presentation controllers receive their use case dependencies.
 *
 * Domain and Application layers never import from Infrastructure or
 * Presentation directly - everything flows through here.
 */

// Infrastructure implementations
const userRepository = require('../infrastructure/database/repositories/UserRepository');
const roleRepository = require('../infrastructure/database/repositories/RoleRepository');
const refreshTokenRepository = require('../infrastructure/database/repositories/RefreshTokenRepository');
const customerRepository = require('../infrastructure/database/repositories/CustomerRepository');
const driverRepository = require('../infrastructure/database/repositories/DriverRepository');
const tripRepository = require('../infrastructure/database/repositories/TripRepository');
const locationRepository = require('../infrastructure/database/repositories/LocationRepository');
const hasher = require('../infrastructure/auth/BcryptHasher');
const tokenService = require('../infrastructure/auth/JwtTokenService');
const logger = require('../infrastructure/logging/WinstonLogger');

// Application use cases - Auth
const LoginUseCase = require('../application/use-cases/auth/LoginUseCase');
const RefreshTokenUseCase = require('../application/use-cases/auth/RefreshTokenUseCase');
const LogoutUseCase = require('../application/use-cases/auth/LogoutUseCase');

// Application use cases - Users
const CreateUserUseCase = require('../application/use-cases/users/CreateUserUseCase');
const GetUserUseCase = require('../application/use-cases/users/GetUserUseCase');
const ListUsersUseCase = require('../application/use-cases/users/ListUsersUseCase');
const UpdateUserUseCase = require('../application/use-cases/users/UpdateUserUseCase');
const DeleteUserUseCase = require('../application/use-cases/users/DeleteUserUseCase');

// Application use cases - Roles
const ListRolesUseCase = require('../application/use-cases/roles/ListRolesUseCase');

// Application use cases - Customers
const CreateCustomerUseCase = require('../application/use-cases/customers/CreateCustomerUseCase');
const GetCustomerUseCase = require('../application/use-cases/customers/GetCustomerUseCase');
const ListCustomersUseCase = require('../application/use-cases/customers/ListCustomersUseCase');
const UpdateCustomerUseCase = require('../application/use-cases/customers/UpdateCustomerUseCase');
const DeleteCustomerUseCase = require('../application/use-cases/customers/DeleteCustomerUseCase');

// Application use cases - Drivers
const CreateDriverUseCase = require('../application/use-cases/drivers/CreateDriverUseCase');
const GetDriverUseCase = require('../application/use-cases/drivers/GetDriverUseCase');
const ListDriversUseCase = require('../application/use-cases/drivers/ListDriversUseCase');
const ListActiveDriversUseCase = require('../application/use-cases/drivers/ListActiveDriversUseCase');
const UpdateDriverUseCase = require('../application/use-cases/drivers/UpdateDriverUseCase');
const DeleteDriverUseCase = require('../application/use-cases/drivers/DeleteDriverUseCase');

// Application use cases - Trips
const CreateTripUseCase = require('../application/use-cases/trips/CreateTripUseCase');
const GetTripUseCase = require('../application/use-cases/trips/GetTripUseCase');
const ListTripsUseCase = require('../application/use-cases/trips/ListTripsUseCase');
const UpdateTripUseCase = require('../application/use-cases/trips/UpdateTripUseCase');
const AssignTripUseCase = require('../application/use-cases/trips/AssignTripUseCase');
const UpdateTripStatusUseCase = require('../application/use-cases/trips/UpdateTripStatusUseCase');
const UpdateTripDriverDetailsUseCase = require('../application/use-cases/trips/UpdateTripDriverDetailsUseCase');
const DeleteTripUseCase = require('../application/use-cases/trips/DeleteTripUseCase');
const ApproveTripUseCase = require('../application/use-cases/trips/ApproveTripUseCase');
const ListPendingApprovalsUseCase = require('../application/use-cases/trips/ListPendingApprovalsUseCase');
const SetEmergencyStopUseCase = require('../application/use-cases/trips/SetEmergencyStopUseCase');
const ReorderTripStopsUseCase = require('../application/use-cases/trips/ReorderTripStopsUseCase');

// Presentation controllers
const AuthController = require('../presentation/controllers/auth.controller');
const UserController = require('../presentation/controllers/user.controller');
const RoleController = require('../presentation/controllers/role.controller');
const CustomerController = require('../presentation/controllers/customer.controller');
const DriverController = require('../presentation/controllers/driver.controller');
const TripController = require('../presentation/controllers/trip.controller');
const LocationController = require('../presentation/controllers/location.controller');
const TrackingController = require('../presentation/controllers/tracking.controller');

// --- Wire use cases ---
const loginUseCase = new LoginUseCase(userRepository, roleRepository, refreshTokenRepository, hasher, tokenService, logger);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, roleRepository, refreshTokenRepository, tokenService, logger);
const logoutUseCase = new LogoutUseCase(refreshTokenRepository, tokenService);

const createUserUseCase = new CreateUserUseCase(userRepository, roleRepository, hasher, logger, driverRepository);
const getUserUseCase = new GetUserUseCase(userRepository);
const listUsersUseCase = new ListUsersUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository, roleRepository, logger, driverRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository, roleRepository, logger);
const listRolesUseCase = new ListRolesUseCase(roleRepository);

const createCustomerUseCase = new CreateCustomerUseCase(customerRepository, logger, locationRepository);
const getCustomerUseCase = new GetCustomerUseCase(customerRepository);
const listCustomersUseCase = new ListCustomersUseCase(customerRepository);
const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepository, logger, locationRepository);
const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepository, logger);

const createDriverUseCase = new CreateDriverUseCase(driverRepository, logger);
const getDriverUseCase = new GetDriverUseCase(driverRepository);
const listDriversUseCase = new ListDriversUseCase(driverRepository);
const listActiveDriversUseCase = new ListActiveDriversUseCase(driverRepository);
const updateDriverUseCase = new UpdateDriverUseCase(driverRepository, logger);
const deleteDriverUseCase = new DeleteDriverUseCase(driverRepository, logger);

const createTripUseCase = new CreateTripUseCase(tripRepository, customerRepository, driverRepository, locationRepository, logger);
const getTripUseCase = new GetTripUseCase(tripRepository, driverRepository);
const listTripsUseCase = new ListTripsUseCase(tripRepository, driverRepository);
const updateTripUseCase = new UpdateTripUseCase(tripRepository, logger, locationRepository);
const assignTripUseCase = new AssignTripUseCase(tripRepository, driverRepository, logger);
const updateTripStatusUseCase = new UpdateTripStatusUseCase(tripRepository, driverRepository, logger);
const updateTripDriverDetailsUseCase = new UpdateTripDriverDetailsUseCase(tripRepository, driverRepository, logger);
const deleteTripUseCase = new DeleteTripUseCase(tripRepository, logger);
const approveTripUseCase = new ApproveTripUseCase(tripRepository, logger);
const listPendingApprovalsUseCase = new ListPendingApprovalsUseCase(tripRepository);
const setEmergencyStopUseCase = new SetEmergencyStopUseCase(tripRepository, driverRepository, logger);
const reorderTripStopsUseCase = new ReorderTripStopsUseCase(tripRepository, driverRepository, logger);

// --- Wire controllers ---
const authController = new AuthController({ loginUseCase, refreshTokenUseCase, logoutUseCase, getUserUseCase });
const userController = new UserController({
  createUserUseCase,
  getUserUseCase,
  listUsersUseCase,
  updateUserUseCase,
  deleteUserUseCase,
});
const roleController = new RoleController({ listRolesUseCase });
const customerController = new CustomerController({
  createCustomerUseCase,
  getCustomerUseCase,
  listCustomersUseCase,
  updateCustomerUseCase,
  deleteCustomerUseCase,
});
const driverController = new DriverController({
  createDriverUseCase,
  getDriverUseCase,
  listDriversUseCase,
  listActiveDriversUseCase,
  updateDriverUseCase,
  deleteDriverUseCase,
  userRepository,
  driverRepository,
});
const tripController = new TripController({
  createTripUseCase,
  getTripUseCase,
  listTripsUseCase,
  updateTripUseCase,
  assignTripUseCase,
  updateTripStatusUseCase,
  updateTripDriverDetailsUseCase,
  deleteTripUseCase,
  approveTripUseCase,
  listPendingApprovalsUseCase,
  setEmergencyStopUseCase,
  reorderTripStopsUseCase,
});

const locationController = new LocationController({ locationRepository });
const trackingController = new TrackingController();

module.exports = {
  authController,
  userController,
  roleController,
  customerController,
  driverController,
  tripController,
  locationController,
  trackingController,
  logger,
};
