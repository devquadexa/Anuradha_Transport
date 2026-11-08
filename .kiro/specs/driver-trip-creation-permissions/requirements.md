# Requirements Document

## Introduction

This document defines requirements for the **Driver Trip Creation Permissions** feature. Currently, only users with the ADMIN or SUPER_ADMIN role can create trips in the Anuradha Transport Management System. This feature extends trip creation capability to users with the DRIVER role, subject to two strict constraints: a Driver may only create trips automatically assigned to their own driver profile, and a Driver cannot create trips on behalf of another driver. All existing Admin and Super Admin workflows remain unchanged.

The change affects four areas: the database role-permission seeder, the backend `CreateTripUseCase` and `TripController`, and the frontend `TripsListPage` and `TripFormDialog`.

**Pre-existing foundation (no changes needed):** The `GET /auth/me` response already includes the authenticated user's linked driver profile data (`user.driver.id`, `user.driver.vehicleNumber`, `user.driver.licenseExpiry`, etc.) via the existing `UserRepository` eager-load and `toUserResponseDto` mapping. The frontend `AuthContext` already stores this in `user.driver`. This data is sufficient for the frontend to identify the current Driver's profile without requiring the `drivers:read` permission.

---

## Glossary

- **System**: The Anuradha Transport Management System, encompassing its backend API and frontend application.
- **Actor**: The authenticated user making an API request, as represented by their decoded JWT payload containing `id`, `role`, and `permissions`.
- **Driver**: A user assigned the DRIVER role who has a linked Driver_Profile record in the `drivers` table.
- **Driver_Profile**: A record in the `drivers` table associated with a user account via the `user_id` column.
- **Admin**: A user assigned the ADMIN role.
- **Super_Admin**: A user assigned the SUPER_ADMIN role.
- **CreateTripUseCase**: The backend application use case (`CreateTripUseCase.js`) that orchestrates trip creation business logic.
- **TripController**: The backend presentation layer controller that handles HTTP requests for the trips resource.
- **TripFormDialog**: The frontend React dialog component used to create and edit trips.
- **TripsListPage**: The frontend React page component that lists trips and hosts trip management actions including creation.
- **AuthContext**: The frontend React context that exposes the current user's identity, role, permissions, and linked driver profile data via `useAuth()`.
- **Role_Permission_Seeder**: The existing database seeder (`20260101000003-seed-role-permissions.js`) that assigns permissions to roles on initial deployment.
- **Migration_Seeder**: A new re-runnable database seeder that applies the `trips:create` permission for the DRIVER role to existing deployments that have already been seeded.
- **trips:create**: The fine-grained RBAC permission that authorizes a user to submit trip creation requests.
- **trips:read**: The fine-grained RBAC permission that authorizes a user to list and retrieve trips.

---

## Requirements

### Requirement 1: Grant Trip Creation Permission to Driver Role

**User Story:** As a Driver, I want the `trips:create` permission assigned to my role, so that the backend authorizes my trip creation requests.

#### Acceptance Criteria

1. THE Role_Permission_Seeder SHALL include `trips:create` in the set of permissions assigned to the DRIVER role.
2. WHEN the Role_Permission_Seeder runs against a database where the `role_permissions` table contains no existing rows for the DRIVER role, THE System SHALL persist a `role_permissions` row linking the DRIVER role to the `trips:create` permission.
3. IF the `trips:create` role-permission row for the DRIVER role does not exist in the `role_permissions` table, THEN WHEN the Migration_Seeder runs, THE System SHALL insert that row.
4. IF the `trips:create` role-permission row for the DRIVER role already exists when the Migration_Seeder runs, THEN THE Migration_Seeder SHALL complete without error and without inserting a duplicate row.
5. THE Role_Permission_Seeder SHALL assign the DRIVER role exactly the permissions `trips:read` and `trips:create`, and no additional permissions beyond those two.
6. IF the DRIVER role record or either required permission (`trips:read`, `trips:create`) is absent when either seeder runs, THEN THE System SHALL throw an error and abort the seeder run without partially committing changes.

---

### Requirement 2: Driver-Scoped Trip Creation Enforcement

**User Story:** As a system administrator, I want the API to automatically assign a Driver's own profile when a Driver creates a trip, so that Drivers cannot create trips on behalf of other Drivers.

#### Acceptance Criteria

1. THE TripController SHALL pass the authenticated Actor (`req.user`) to `CreateTripUseCase.execute()` on every trip creation request.
2. IF the Actor's role is DRIVER, THEN THE CreateTripUseCase SHALL resolve the Actor's Driver_Profile by querying the driver repository using the Actor's user ID.
3. IF the Actor's role is DRIVER AND a Driver_Profile is found for the Actor's user ID, THEN THE CreateTripUseCase SHALL set the trip's `driverId` to the resolved Driver_Profile's ID, overriding any `driverId` value present in the request payload.
4. IF the Actor's role is DRIVER AND no Driver_Profile is linked to the Actor's user ID, THEN THE CreateTripUseCase SHALL throw a ForbiddenError with a message indicating the account has no linked driver profile.
5. IF the driver repository query throws an error during Driver_Profile resolution, THEN THE CreateTripUseCase SHALL propagate the error without creating the trip.
6. IF the Actor's role is ADMIN or SUPER_ADMIN, THEN THE CreateTripUseCase SHALL process the trip creation request using the client-supplied `driverId` without modification.
7. IF the Actor's role is DRIVER AND a Driver_Profile is resolved, THEN THE System SHALL set the created trip's initial `status` to `assigned`.

---

### Requirement 3: Trip Creation UI Access for Drivers

**User Story:** As a Driver, I want to access the trip creation form from the Trips page, so that I can initiate trip creation directly from the UI.

#### Acceptance Criteria

1. IF an authenticated user has the `trips:create` permission, THEN THE TripsListPage SHALL display the "New Trip" button irrespective of the user's role.
2. WHEN an authenticated user with the `trips:create` permission clicks the "New Trip" button, THE TripsListPage SHALL open TripFormDialog with no pre-populated trip data and all form fields at their default empty values.
3. IF an authenticated user has the `trips:create` permission, THEN THE TripsListPage SHALL render TripFormDialog irrespective of the user's role.

---

### Requirement 4: Driver Field Locking in Trip Creation Form

**User Story:** As a Driver, I want the driver assignment field in the trip creation form to be pre-filled with my own profile and non-editable, so that I cannot assign the trip to a different driver.

#### Acceptance Criteria

1. THE TripFormDialog SHALL accept an `isDriver` boolean prop and a `currentDriverProfile` object prop containing at minimum the driver's `id` (integer) and `fullName` (string).
2. IF `isDriver` is `true` AND `currentDriverProfile` is provided, THEN THE TripFormDialog SHALL pre-populate the driver selection field with the value and display name from `currentDriverProfile`.
3. IF `isDriver` is `true`, THEN THE TripFormDialog SHALL render the driver selection field as a non-interactive display with pointer events and keyboard input disabled.
4. IF `isDriver` is `false` or not provided, THEN THE TripFormDialog SHALL render the driver selection field as an interactive dropdown populated by the `useActiveDrivers()` hook.
5. THE TripsListPage SHALL derive the `currentDriverProfile` prop from the authenticated user's data available in AuthContext (specifically `user.driver.id` as the driver profile ID and `user.fullName` as the display name) and pass it to TripFormDialog when the Actor holds the DRIVER role.
6. IF `isDriver` is `true`, THEN THE TripFormDialog SHALL include `currentDriverProfile.id` in the trip creation payload submitted to the backend.
7. IF `isDriver` is `true` AND `currentDriverProfile` is missing or has a null `id`, THEN THE TripFormDialog SHALL disable the form submit action and display an error message indicating the driver profile could not be resolved.
