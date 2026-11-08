# Anuradha Transport Management System - Architecture Review

## Executive Summary

The Anuradha Transport Management System (TMS) is a full-stack web application built to manage transportation operations for a Sri Lankan transport company. The system implements **Clean Architecture** principles with clear separation between domain logic, application use cases, infrastructure concerns, and presentation layers.

**Key Characteristics:**
- **Backend**: Node.js/Express RESTful API following Clean Architecture and SOLID principles
- **Frontend**: React SPA with feature-based organization using React Query for state management
- **Database**: MySQL with Sequelize ORM, managed through separate migration/seeding lifecycle
- **Architecture Pattern**: Layered architecture with Dependency Injection via composition root
- **Authentication**: JWT-based with access/refresh token rotation
- **Authorization**: Role-Based Access Control (RBAC) with fine-grained permissions

The system manages three core business domains: **Users & Authentication**, **Customers**, **Drivers**, and **Trips** with multi-stop delivery tracking, GPS location monitoring, mileage tracking, and approval workflows.

---

## 1. System Architecture Overview

### Architecture Style
The application follows **Clean Architecture** (also known as Onion/Hexagonal Architecture) with strict layer dependencies:

\\\
┌─────────────────────────────────────────────────┐
│         Presentation Layer (Controllers)        │
│              Express Routes & Middleware        │
└──────────────────────┬──────────────────────────┘
                       │ depends on
┌──────────────────────▼──────────────────────────┐
│         Application Layer (Use Cases)           │
│          Business Logic Orchestration           │
└──────────────────────┬──────────────────────────┘
                       │ depends on
┌──────────────────────▼──────────────────────────┐
│      Domain Layer (Entities, Interfaces)        │
│        Pure Business Objects & Rules            │
└─────────────────────────────────────────────────┘
                       ▲
                       │ implements
┌──────────────────────┴──────────────────────────┐
│    Infrastructure Layer (Repositories, etc.)    │
│  Database, Auth Services, Logging, External APIs│
└─────────────────────────────────────────────────┘
\\\

### Key Architectural Principles

1. **Dependency Inversion**: Higher layers define interfaces; lower layers implement them
2. **Single Responsibility**: Each use case handles one business operation
3. **Composition Root**: All dependencies wired in \container/index.js\ - the ONLY place concrete implementations meet abstractions
4. **Repository Pattern**: Domain repositories abstract data access; infrastructure provides Sequelize implementations
5. **DTO Pattern**: Data Transfer Objects transform between layers (domain entities → API responses)

### Layer Responsibilities

| Layer | Path | Purpose | Dependencies |
|-------|------|---------|--------------|
| **Domain** | \src/domain/\ | Entities, business rules, repository interfaces, domain errors | None (pure JS) |
| **Application** | \src/application/\ | Use cases, DTOs, validation schemas, orchestration logic | Domain only |
| **Infrastructure** | \src/infrastructure/\ | Sequelize repos, JWT service, bcrypt hasher, Winston logger, DB connection | Domain interfaces |
| **Presentation** | \src/presentation/\ | Express controllers, route definitions, Swagger docs | Application use cases |
| **Middleware** | \src/middleware/\ | Authentication, authorization, validation, error handling | Infrastructure (JWT service) |

---

## 2. Complete Database Schema Documentation

### Database Technology
- **DBMS**: MySQL 8.x
- **ORM**: Sequelize 6.x
- **Migration Tool**: Sequelize CLI
- **Lifecycle**: Independent project in \/database\ folder with its own package.json

### Schema Overview

The database contains **14 tables** organized into two modules:

**Module 1: Authentication & Authorization (RBAC)**
- roles
- permissions  
- role_permissions
- users
- refresh_tokens
- audit_logs

**Module 2: Transport Management**
- customers
- divisions
- drivers
- locations
- trips
- trip_stops
- trip_stop_invoices
- trip_location_pings

### Entity Relationship Diagram (Textual Description)

\\\
roles (1) ──────────< (M) users
  │                         │
  │                         └──(1:1)──> drivers
  │                         │
  │                         └─────< refresh_tokens
  │                         │
  │                         └─────< audit_logs
  │
  └──< role_permissions >──permissions

divisions (1) ─────< (M) customers
                            │
                            └─────< (M) locations
                            │
                            └─────< (M) trips ──> (M) drivers
                                          │
                                          ├───< (M) trip_stops ───< (M) trip_stop_invoices
                                          │
                                          └───< (M) trip_location_pings
\\\

### Table Details

#### **roles**
Primary table for RBAC system roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | Unique role identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Role name (SUPER_ADMIN, ADMIN, DRIVER) |
| description | VARCHAR(255) | NULL | Human-readable role description |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft deactivation flag |
| created_at | DATE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| deleted_at | DATE | NULL | Soft delete timestamp |

**Indexes**: \is_active\

---

#### **permissions**
Fine-grained permissions in \module:action\ format (e.g., \	rips:create\, \users:read\).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Permission identifier (e.g., \	rips:update\) |
| module | VARCHAR(50) | NOT NULL | Module grouping (trips, users, drivers, etc.) |
| description | VARCHAR(255) | NULL | |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |

**Indexes**: \module\

---

#### **role_permissions**
Many-to-many junction table linking roles to permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| role_id | INTEGER UNSIGNED | NOT NULL, FK → roles.id | CASCADE on update/delete |
| permission_id | INTEGER UNSIGNED | NOT NULL, FK → permissions.id | CASCADE on update/delete |
| created_at | DATE | NOT NULL | |

**Unique Constraint**: \(role_id, permission_id)\

---

#### **users**
System users with authentication credentials and role assignment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| role_id | INTEGER UNSIGNED | NOT NULL, FK → roles.id | RESTRICT on delete |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(150) | NOT NULL, UNIQUE | Login identifier |
| phone | VARCHAR(20) | NULL | |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| status | ENUM | NOT NULL, DEFAULT 'active' | 'active', 'inactive', 'suspended' |
| last_login_at | DATE | NULL | Timestamp of last successful login |
| created_by | INTEGER UNSIGNED | NULL | Audit: user ID who created this record |
| updated_by | INTEGER UNSIGNED | NULL | Audit: user ID who last updated |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |
| deleted_at | DATE | NULL | Soft delete (paranoid mode) |

**Indexes**: \
ole_id\, \status\, \email\

**Note**: Drivers may optionally have a user account (role=DRIVER) linked via \drivers.user_id\.

---

#### **refresh_tokens**
JWT refresh token storage for secure token rotation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| user_id | INTEGER UNSIGNED | NOT NULL, FK → users.id | CASCADE on delete |
| token_hash | VARCHAR(255) | NOT NULL | SHA-256 hash of the refresh token |
| expires_at | DATE | NOT NULL | Token expiration (default 7 days) |
| revoked_at | DATE | NULL | Manual revocation timestamp |
| replaced_by_token_hash | VARCHAR(255) | NULL | Chain tracking for token rotation |
| user_agent | VARCHAR(255) | NULL | Browser/device identifier |
| ip_address | VARCHAR(45) | NULL | IPv4/IPv6 address |
| created_at | DATE | NOT NULL | |

**Indexes**: \user_id\, \	oken_hash\

---

#### **audit_logs**
Generic audit trail for tracking all significant system actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Large ID space for high-volume logging |
| user_id | INTEGER UNSIGNED | NULL, FK → users.id | SET NULL on user delete |
| action | VARCHAR(100) | NOT NULL | Action code (e.g., USER_LOGIN, TRIP_UPDATE) |
| entity_type | VARCHAR(100) | NULL | Entity class name |
| entity_id | VARCHAR(50) | NULL | Entity primary key |
| old_values | JSON | NULL | Before state |
| new_values | JSON | NULL | After state |
| ip_address | VARCHAR(45) | NULL | |
| user_agent | VARCHAR(255) | NULL | |
| created_at | DATE | NOT NULL | |

**Indexes**: \user_id\, \(entity_type, entity_id)\, \ction\, \created_at\

---

#### **customers**
Client companies that hire the transport service.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| division_id | INTEGER UNSIGNED | NULL, FK → divisions.id | SET NULL on delete |
| company_name | VARCHAR(150) | NOT NULL | |
| contact_person | VARCHAR(100) | NULL | Deprecated; use contact_persons JSON |
| email | VARCHAR(150) | NULL | |
| phone | VARCHAR(20) | NOT NULL | |
| address_line1 | VARCHAR(255) | NULL | |
| address_line2 | VARCHAR(255) | NULL | |
| city | VARCHAR(100) | NULL | |
| country | VARCHAR(100) | NOT NULL, DEFAULT 'Sri Lanka' | |
| contact_persons | JSON | NULL | Array of {name, phone, email} (up to 3) |
| status | ENUM | NOT NULL, DEFAULT 'active' | 'active', 'inactive' |
| notes | TEXT | NULL | |
| created_by | INTEGER UNSIGNED | NULL | |
| updated_by | INTEGER UNSIGNED | NULL | |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |
| deleted_at | DATE | NULL | |

**Indexes**: \company_name\, \status\, \phone\

---

#### **divisions**
Organizational divisions (e.g., regional branches) for customer grouping.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Division name |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |

---

#### **locations**
Predefined pickup/delivery locations with GPS coordinates, linked to customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| customer_id | INTEGER UNSIGNED | NULL, FK → customers.id | SET NULL on delete |
| name | VARCHAR(150) | NOT NULL | Location name |
| address | VARCHAR(255) | NULL | |
| latitude | DECIMAL(10,7) | NOT NULL | GPS coordinate |
| longitude | DECIMAL(10,7) | NOT NULL | GPS coordinate |
| contact_name | VARCHAR(100) | NULL | |
| contact_phone | VARCHAR(20) | NULL | |
| notes | TEXT | NULL | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | |
| created_by | INTEGER UNSIGNED | NULL | |
| updated_by | INTEGER UNSIGNED | NULL | |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |
| deleted_at | DATE | NULL | |

**Indexes**: \customer_id\, \is_active\

---

#### **drivers**
Driver profiles with license information and optional user account linkage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| user_id | INTEGER UNSIGNED | NULL, UNIQUE, FK → users.id | SET NULL on delete; links to portal login |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| nic_number | VARCHAR(20) | NOT NULL, UNIQUE | National ID card number |
| phone | VARCHAR(20) | NOT NULL | |
| email | VARCHAR(150) | NULL | |
| license_number | VARCHAR(50) | NOT NULL, UNIQUE | |
| license_expiry | DATEONLY | NOT NULL | |
| address | VARCHAR(255) | NULL | |
| vehicle_number | VARCHAR(30) | NULL | Plate number (until Vehicles module added) |
| status | ENUM | NOT NULL, DEFAULT 'active' | 'active', 'inactive', 'on_leave', 'suspended' |
| notes | TEXT | NULL | |
| created_by | INTEGER UNSIGNED | NULL | |
| updated_by | INTEGER UNSIGNED | NULL | |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |
| deleted_at | DATE | NULL | |

**Indexes**: \status\, \phone\, \license_expiry\

**Business Rule**: A driver profile can exist without a user account (user_id NULL). When a driver needs portal access, an admin creates a user account with role=DRIVER and links it.

---

#### **trips**
Core trip/delivery records with lifecycle status and approval workflow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| trip_number | VARCHAR(30) | NOT NULL, UNIQUE | Human-readable (e.g., TRP-2026-000123) |
| customer_id | INTEGER UNSIGNED | NOT NULL, FK → customers.id | RESTRICT on delete |
| driver_id | INTEGER UNSIGNED | NULL, FK → drivers.id | SET NULL on delete; NULL until assigned |
| origin | VARCHAR(255) | NOT NULL | Starting point |
| destination | VARCHAR(255) | NOT NULL | Final destination |
| end_point | VARCHAR(255) | NULL | Actual final stop name |
| scheduled_date | DATEONLY | NOT NULL | |
| scheduled_time | TIME | NULL | |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 'pending', 'assigned', 'in_progress', 'completed', 'cancelled' |
| cargo_description | VARCHAR(255) | NULL | |
| remarks | TEXT | NULL | |
| mileage | DECIMAL | NULL | Total trip mileage |
| final_odometer_reading | DECIMAL | NULL | Vehicle odometer at trip end |
| invoice_number | VARCHAR(100) | NULL | |
| start_latitude | DECIMAL(10,7) | NULL | GPS when trip started |
| start_longitude | DECIMAL(10,7) | NULL | |
| assigned_at | DATE | NULL | |
| started_at | DATE | NULL | |
| completed_at | DATE | NULL | |
| approval_status | ENUM | NULL | 'pending', 'approved', 'rejected' (set after completion) |
| approved_by | INTEGER UNSIGNED | NULL, FK → users.id | SET NULL on delete |
| approved_at | DATE | NULL | |
| rejection_reason | TEXT | NULL | |
| emergency_stop | BOOLEAN | NULL | Driver-activated emergency flag |
| emergency_stop_at | DATE | NULL | |
| emergency_stop_reason | TEXT | NULL | |
| created_by | INTEGER UNSIGNED | NULL | |
| updated_by | INTEGER UNSIGNED | NULL | |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |
| deleted_at | DATE | NULL | |

**Indexes**: \customer_id\, \driver_id\, \status\, \scheduled_date\

**Lifecycle**: pending → assigned (when driver assigned) → in_progress (driver starts) → completed (driver finishes; approval_status set to 'pending') → admin approves/rejects

---

#### **trip_stops**
Ordered delivery stops within a trip.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| trip_id | INTEGER UNSIGNED | NOT NULL, FK → trips.id | CASCADE on delete |
| location_id | INTEGER UNSIGNED | NULL, FK → locations.id | SET NULL if location deleted |
| sequence_no | INTEGER UNSIGNED | NOT NULL | Stop order: 1, 2, 3... |
| location_name | VARCHAR(255) | NOT NULL | |
| address | VARCHAR(255) | NULL | |
| contact_name | VARCHAR(100) | NULL | |
| contact_phone | VARCHAR(20) | NULL | |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 'pending', 'arrived', 'delivered', 'skipped' |
| notes | VARCHAR(255) | NULL | |
| mileage | DECIMAL | NULL | Deprecated |
| invoice_number | VARCHAR(100) | NULL | Deprecated; use trip_stop_invoices |
| latitude | DECIMAL(10,7) | NULL | GPS coordinates for this stop |
| longitude | DECIMAL(10,7) | NULL | |
| gps_location_name | VARCHAR(255) | NULL | Reverse geocoded name |
| gps_mileage | DECIMAL | NULL | System-calculated mileage |
| driver_mileage | DECIMAL | NULL | Driver-reported mileage |
| odometer_reading | DECIMAL | NULL | Vehicle meter reading at this stop |
| expected_mileage | DECIMAL | NULL | Pre-calculated from locations |
| arrived_at | DATE | NULL | |
| delivered_at | DATE | NULL | |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |

**Unique Constraint**: \(trip_id, sequence_no)\  
**Index**: \	rip_id\

---

#### **trip_stop_invoices**
Multiple invoice numbers per stop (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| trip_stop_id | INTEGER UNSIGNED | NOT NULL, FK → trip_stops.id | CASCADE on delete |
| invoice_number | VARCHAR(100) | NOT NULL | |
| created_at | DATE | NOT NULL | |
| updated_at | DATE | NOT NULL | |

**Index**: \	rip_stop_id\

---

#### **trip_location_pings**
Real-time GPS breadcrumbs from driver's device during trip.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER UNSIGNED | PK, AUTO_INCREMENT | |
| trip_id | INTEGER UNSIGNED | NOT NULL, FK → trips.id | CASCADE on delete |
| driver_id | INTEGER UNSIGNED | NOT NULL | Denormalized for query performance |
| latitude | DECIMAL(10,7) | NOT NULL | |
| longitude | DECIMAL(10,7) | NOT NULL | |
| speed | DECIMAL(5,1) | NULL | Speed in km/h |
| recorded_at | DATE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

**Indexes**: \	rip_id\, \driver_id\, \
ecorded_at\

---

### Enums

| Table | Column | Values |
|-------|--------|--------|
| users | status | 'active', 'inactive', 'suspended' |
| customers | status | 'active', 'inactive' |
| drivers | status | 'active', 'inactive', 'on_leave', 'suspended' |
| trips | status | 'pending', 'assigned', 'in_progress', 'completed', 'cancelled' |
| trips | approval_status | 'pending', 'approved', 'rejected' |
| trip_stops | status | 'pending', 'arrived', 'delivered', 'skipped' |

---

### Seeded Data

**Roles** (3 roles):
- \SUPER_ADMIN\: Full system access
- \ADMIN\: Operational access (customers, drivers, trips, users)
- \DRIVER\: Own trips only

**Permissions** (26 permissions):
- CRUD for: users, roles, drivers, customers, trips
- Read-only: dashboard, audit-logs
- Special: trips:assign

**Role-Permission Mapping**:
- SUPER_ADMIN: All permissions
- ADMIN: All except roles:* and users:delete
- DRIVER: trips:read only (scoped to assigned trips in use case layer)

**Default Admin User**:
- Email: \dmin@anuradhatransport.lk\
- Password: \ChangeMe@123\ (must change in production)
- Role: SUPER_ADMIN

---

## 3. Application Components Breakdown

### Backend Structure (\/backend/src\)

\\\
src/
├── app.js                    # Express app setup (middleware, routes)
├── server.js                 # HTTP server entry point
├── config/
│   └── env.js               # Environment variable parsing
├── container/
│   └── index.js             # Composition root (DI wiring)
├── domain/
│   ├── entities/            # Pure domain objects (User, Trip, Driver, etc.)
│   ├── enums/              # Domain constants (RoleName, TripStatus, etc.)
│   ├── errors/             # Domain errors (NotFoundError, ValidationError)
│   └── repositories/       # Repository interfaces (IUserRepository, etc.)
├── application/
│   ├── common/             # ApiResponse, Pagination helpers
│   ├── dtos/               # Data transfer objects (UserDto, TripDto)
│   ├── interfaces/         # Application interfaces (IHasher, ITokenService, ILogger)
│   ├── use-cases/          # Business logic orchestration
│   │   ├── auth/          # LoginUseCase, RefreshTokenUseCase, LogoutUseCase
│   │   ├── users/         # CreateUserUseCase, UpdateUserUseCase, etc.
│   │   ├── customers/     # Customer CRUD use cases
│   │   ├── drivers/       # Driver CRUD use cases
│   │   ├── trips/         # Trip CRUD, AssignTripUseCase, ApproveTripUseCase, etc.
│   │   └── roles/         # ListRolesUseCase
│   └── validators/         # Joi validation schemas
├── infrastructure/
│   ├── auth/
│   │   ├── BcryptHasher.js       # Password hashing implementation
│   │   ├── JwtTokenService.js    # JWT signing/verification
│   │   └── rbac.js               # RBAC helper functions
│   ├── config/
│   │   └── env.js                # Environment config mapping
│   ├── database/
│   │   ├── repositories/         # Sequelize repository implementations
│   │   └── sequelize/
│   │       ├── connection.js     # Database connection setup
│   │       └── models/           # Sequelize model definitions
│   ├── logging/
│   │   └── WinstonLogger.js      # Winston logger implementation
│   └── services/                 # Future external service integrations
├── middleware/
│   ├── asyncHandler.js          # Wraps async route handlers
│   ├── authenticate.js          # JWT verification middleware
│   ├── authorize.js             # RBAC permission checking
│   ├── errorHandler.js          # Centralized error handling
│   ├── notFound.js             # 404 handler
│   └── validate.js             # Joi schema validation middleware
└── presentation/
    ├── controllers/            # Express controllers (thin adapters)
    ├── routes/                # Express route definitions
    └── docs/
        └── swagger.js         # OpenAPI/Swagger spec
\\\

### Frontend Structure (\/frontend/src\)

\\\
src/
├── main.jsx                    # React entry point
├── App.jsx                     # Root component (providers, router)
├── index.css                  # Global styles (Tailwind)
├── api/
│   ├── client.js              # Axios instance with interceptors
│   ├── config.js              # React Query client config
│   └── services/              # API service modules (authService, etc.)
├── app/
│   └── AppRouter.jsx          # Route definitions
├── components/
│   ├── data-table/           # Reusable table components
│   ├── dev/                  # Dev tools (GPS override panel)
│   ├── feedback/             # Loading spinners, alerts
│   ├── form/                 # Form input components
│   └── layout-elements/      # Header, Sidebar, etc.
├── config/
│   └── googleMaps.js         # Google Maps API configuration
├── context/
│   ├── AuthContext.jsx       # Global auth state
│   └── ThemeModeContext.jsx  # Dark/light mode toggle
├── features/                  # Feature-based organization
│   ├── auth/
│   │   ├── api/              # Auth API calls
│   │   └── pages/            # LoginPage, UnauthorizedPage
│   ├── customers/
│   │   ├── api/              # Customer API calls
│   │   ├── components/       # CustomerForm, CustomerCard
│   │   ├── hooks/            # useCustomers, useCreateCustomer
│   │   └── pages/            # CustomersListPage
│   ├── dashboard/
│   │   ├── hooks/
│   │   └── pages/            # DashboardPage
│   ├── drivers/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/            # DriverStatusPage
│   ├── invoices/
│   │   └── pages/
│   ├── locations/
│   │   ├── api/
│   │   ├── components/       # LocationPicker, LocationMap
│   │   ├── hooks/
│   │   └── pages/            # LocationsListPage
│   ├── tracking/
│   │   ├── hooks/
│   │   └── pages/            # LiveTrackingPage
│   ├── trips/
│   │   ├── api/
│   │   ├── components/       # TripForm, TripStopsManager
│   │   ├── hooks/            # useTrips, useApproveTrip
│   │   ├── pages/            # TripsListPage, BusinessTripsPage
│   │   └── utils/
│   └── users/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── pages/            # UsersListPage
├── layouts/
│   └── DashboardLayout.jsx   # Main app shell with nav
├── routes/
│   └── ProtectedRoute.jsx    # Auth + permission guard
├── services/                 # Deprecated; use features/*/api/
├── theme/
│   └── theme.js             # Material-UI theme config
└── utils/
    └── tokenStorage.js      # LocalStorage token management
\\\

---

## 4. API Endpoints Inventory

All endpoints are prefixed with \/api/v1\.

### Authentication (\/auth\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| POST | \/auth/login\ | No | - | Login with email/password; returns access + refresh tokens |
| POST | \/auth/refresh\ | No | - | Exchange refresh token for new access token |
| POST | \/auth/logout\ | No | - | Revoke refresh token |
| GET | \/auth/me\ | Yes | - | Get current user profile |

### Users (\/users\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/users\ | Yes | users:read | List all users (paginated, filterable by role/status) |
| GET | \/users/:id\ | Yes | users:read | Get user by ID |
| POST | \/users\ | Yes | users:create | Create new user (optionally link to driver profile) |
| PUT | \/users/:id\ | Yes | users:update | Update user |
| DELETE | \/users/:id\ | Yes | users:delete | Soft delete user |

### Roles (\/roles\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/roles\ | Yes | roles:read | List all roles with permissions |

### Customers (\/customers\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/customers\ | Yes | customers:read | List customers (paginated, filterable by status/division) |
| GET | \/customers/:id\ | Yes | customers:read | Get customer by ID (includes locations) |
| POST | \/customers\ | Yes | customers:create | Create customer (with optional locations) |
| PUT | \/customers/:id\ | Yes | customers:update | Update customer |
| DELETE | \/customers/:id\ | Yes | customers:delete | Soft delete customer |

### Drivers (\/drivers\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/drivers\ | Yes | drivers:read | List drivers (paginated, filterable by status) |
| GET | \/drivers/active\ | Yes | drivers:read | List only active drivers (for assignment dropdown) |
| GET | \/drivers/:id\ | Yes | drivers:read | Get driver by ID |
| POST | \/drivers\ | Yes | drivers:create | Create driver |
| PUT | \/drivers/:id\ | Yes | drivers:update | Update driver |
| DELETE | \/drivers/:id\ | Yes | drivers:delete | Soft delete driver |

### Trips (\/trips\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/trips\ | Yes | trips:read | List trips (paginated, filterable; drivers see only their own) |
| GET | \/trips/pending-approval\ | Yes | trips:update | List completed trips awaiting approval |
| GET | \/trips/:id\ | Yes | trips:read | Get trip by ID (with stops, customer, driver) |
| POST | \/trips\ | Yes | trips:create | Create trip with stops |
| PUT | \/trips/:id\ | Yes | trips:update | Update trip details |
| PATCH | \/trips/:id/assign\ | Yes | trips:assign | Assign driver to trip |
| PATCH | \/trips/:id/status\ | Yes | trips:update OR trips:read | Change trip status (pending→assigned→in_progress→completed) |
| PATCH | \/trips/:id/stops/:stopId\ | Yes | trips:update OR trips:read | Update stop details (mileage, invoices, odometer) |
| PATCH | \/trips/:id/approve\ | Yes | trips:update | Approve or reject completed trip |
| PATCH | \/trips/:id/emergency-stop\ | Yes | trips:update OR trips:read | Activate/deactivate emergency stop |
| PATCH | \/trips/:id/reorder-stops\ | Yes | trips:update OR trips:read | Reorder stops by sequence |
| DELETE | \/trips/:id\ | Yes | trips:delete | Soft delete trip |

### Locations (\/locations\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/locations\ | Yes | - | List all active locations (optionally filtered by customer) |
| GET | \/locations/:id\ | Yes | - | Get location by ID |
| POST | \/locations\ | Yes | customers:update | Create location |
| PUT | \/locations/:id\ | Yes | customers:update | Update location |
| DELETE | \/locations/:id\ | Yes | customers:update | Soft delete location |

### Tracking (\/tracking\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| POST | \/tracking/ping\ | Yes | - | Record GPS location ping during trip |
| GET | \/tracking/:tripId\ | Yes | trips:read | Get all GPS pings for a trip |

### Divisions (\/divisions\)

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/divisions\ | Yes | - | List all divisions |

### Health Check

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | \/health\ | No | - | Health check endpoint (returns \{status: 'ok', env}\) |

---

## 5. Authentication & Authorization Flow

### Authentication Mechanism: JWT with Refresh Token Rotation

**Access Token**:
- Short-lived (15 minutes default)
- Contains: \{sub: userId, email, role, permissions[]}\
- Sent in \Authorization: Bearer <token>\ header
- Verified by \uthenticate\ middleware

**Refresh Token**:
- Long-lived (7 days default)
- Stored as SHA-256 hash in \
efresh_tokens\ table
- Used to obtain new access token via \POST /auth/refresh\
- Revoked on logout or token rotation

### Login Flow

\\\
1. User submits email + password to POST /auth/login
2. LoginUseCase:
   a. Find user by email
   b. Check user.status is 'active' (canAuthenticate())
   c. Compare password with bcrypt hash
   d. Fetch user's role + permissions from roles/role_permissions
   e. Sign access token with user ID, email, role, permissions
   f. Sign refresh token with user ID only
   g. Hash refresh token (SHA-256) and store in refresh_tokens table
   h. Update user.last_login_at
3. Return: {accessToken, refreshToken, user, role}
4. Frontend stores tokens in localStorage
5. Frontend attaches accessToken to all API requests
\\\

### Token Refresh Flow

\\\
1. Frontend detects 401 Unauthorized on API request
2. Axios interceptor triggers refresh:
   a. POST /auth/refresh with refreshToken
   b. RefreshTokenUseCase:
      - Verify refresh token signature
      - Lookup token hash in refresh_tokens table
      - Check not expired, not revoked
      - Fetch user + role + permissions
      - Sign new access + refresh tokens
      - Revoke old refresh token (replaced_by_token_hash)
      - Store new refresh token hash
   c. Return new tokens
3. Frontend updates localStorage
4. Retry original request with new access token
5. If refresh fails → clear tokens, redirect to /login
\\\

### Authorization: Role-Based Access Control (RBAC)

**Two-Level Authorization**:

1. **Permission-Level** (fine-grained):
   - Middleware: \uthorizePermissions('trips:update', 'users:read')\
   - Checks if user has ANY of the listed permissions
   - Used on most endpoints

2. **Role-Level** (coarse-grained):
   - Middleware: \uthorizeRoles('SUPER_ADMIN', 'ADMIN')\
   - Checks if user has ANY of the listed roles
   - Rarely used; prefer permission checks

**Authorization Middleware Stack**:
\\\javascript
router.get('/trips', 
  authenticate,                         // Step 1: Verify JWT
  authorizePermissions('trips:read'),   // Step 2: Check permission
  validate(querySchema, 'query'),       // Step 3: Validate input
  asyncHandler(tripController.list)     // Step 4: Execute use case
);
\\\

**Driver Scoping**:
- Drivers have \	rips:read\ permission
- \ListTripsUseCase\ and \GetTripUseCase\ enforce: if actor.role === 'DRIVER', filter trips WHERE driver_id = actor.driverId
- Prevents drivers from seeing other drivers' trips

---

## 6. Key Business Workflows

### Workflow 1: User Login & Session Management

\\\
┌─────────┐                 ┌──────────┐               ┌──────────┐
│ Browser │                 │  Backend │               │ Database │
└────┬────┘                 └────┬─────┘               └────┬─────┘
     │                           │                          │
     │ POST /auth/login          │                          │
     │ {email, password}         │                          │
     ├──────────────────────────>│                          │
     │                           │ SELECT * FROM users      │
     │                           │ WHERE email=?            │
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │<─────────────────────────┤
     │                           │ bcrypt.compare()         │
     │                           │ (password vs hash)       │
     │                           │                          │
     │                           │ SELECT permissions       │
     │                           │ FROM role_permissions    │
     │                           ├─────────────────────────>│
     │                           │<─────────────────────────┤
     │                           │                          │
     │                           │ jwt.sign(accessToken)    │
     │                           │ jwt.sign(refreshToken)   │
     │                           │                          │
     │                           │ INSERT refresh_tokens    │
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │ UPDATE users             │
     │                           │ SET last_login_at=NOW()  │
     │                           ├─────────────────────────>│
     │                           │                          │
     │<──────────────────────────┤                          │
     │ {accessToken,             │                          │
     │  refreshToken,            │                          │
     │  user}                    │                          │
     │                           │                          │
     │ localStorage.setItem()    │                          │
     │                           │                          │
\\\

### Workflow 2: Trip Creation with Stops

\\\
Admin creates trip → CreateTripUseCase
  1. Validate customer exists
  2. Validate driver exists (if assigned)
  3. Generate unique trip_number (e.g., TRP-2026-000123)
  4. For each stop with location_id:
     - Fetch location coordinates from locations table
  5. Calculate expected_mileage between consecutive stops:
     - Use Google Distance Matrix API or haversine formula
  6. Set trip.status = 'assigned' if driver provided, else 'pending'
  7. Transaction:
     - INSERT INTO trips
     - INSERT INTO trip_stops (with sequence_no)
  8. Return Trip entity with stops
\\\

### Workflow 3: Trip Lifecycle (Driver's Journey)

\\\
Trip Status Transitions:

pending ──assign driver──> assigned ──driver starts──> in_progress 
                                                              │
                                      driver completes  ──────┘
                                              │
                                              ▼
                                         completed
                                         (approval_status='pending')
                                              │
                                              ├──admin approves──> approved
                                              │
                                              └──admin rejects──> rejected

Status Change Actions:

1. Admin assigns driver:
   - PATCH /trips/:id/assign {driverId}
   - AssignTripUseCase validates driver status='active'
   - Updates: driver_id, status='assigned', assigned_at=NOW()

2. Driver starts trip:
   - PATCH /trips/:id/status {status: 'in_progress', lat, lng}
   - UpdateTripStatusUseCase checks:
     * Actor is the assigned driver (or admin)
     * canTransitionTo('in_progress') → true
   - Updates: status, started_at=NOW(), start_latitude, start_longitude

3. Driver delivers at each stop:
   - PATCH /trips/:id/stops/:stopId 
     {status: 'delivered', odometerReading, invoiceNumbers[]}
   - UpdateTripDriverDetailsUseCase:
     * Update trip_stop.status='delivered', delivered_at=NOW()
     * Record odometer_reading
     * INSERT trip_stop_invoices for each invoice

4. Driver completes trip:
   - PATCH /trips/:id/status {status: 'completed', finalOdometerReading}
   - UpdateTripStatusUseCase:
     * Updates: status='completed', completed_at=NOW()
     * Auto-sets: approval_status='pending' (triggers admin review)
     * Records: final_odometer_reading

5. Admin approves/rejects:
   - PATCH /trips/:id/approve {approved: true/false, rejectionReason?}
   - ApproveTripUseCase validates trip.status='completed'
   - Updates: approval_status, approved_by, approved_at, rejection_reason
\\\

### Workflow 4: Real-Time Trip Tracking

\\\
Driver app sends GPS pings every N seconds while trip is in_progress:

1. POST /tracking/ping {tripId, lat, lng, speed}
2. INSERT INTO trip_location_pings
3. Admin views live tracking page:
   - GET /trips/:id → returns trip with latest ping
   - GET /tracking/:tripId → returns all pings for polyline rendering
4. Map component plots:
   - Trip origin (start_latitude, start_longitude)
   - All GPS pings as polyline
   - Each stop's location (trip_stops.latitude, longitude)
   - Driver's current position (latest ping)
\\\

### Workflow 5: Emergency Stop

\\\
Driver or Admin activates emergency stop:

1. PATCH /trips/:id/emergency-stop {active: true, reason: "Vehicle breakdown"}
2. SetEmergencyStopUseCase:
   - Validates actor is assigned driver OR admin
   - Updates: emergency_stop=true, emergency_stop_at=NOW(), emergency_stop_reason
3. Admin dashboard shows emergency flag
4. To clear: PATCH /trips/:id/emergency-stop {active: false}
   - Sets: emergency_stop=false, clears reason
\\\

---

## 7. Technology Stack Summary

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 18+ | JavaScript runtime |
| Framework | Express.js | 5.x | HTTP server & routing |
| ORM | Sequelize | 6.x | MySQL ORM |
| Database | MySQL | 8.x | Relational database |
| Auth | jsonwebtoken | 9.x | JWT signing/verification |
| Hashing | bcrypt (via BcryptHasher) | Latest | Password hashing |
| Validation | Joi | 18.x | Schema validation |
| Logging | Winston | 3.x | Structured logging |
| API Docs | Swagger UI + jsdoc | Latest | OpenAPI spec |
| Security | helmet | 8.x | HTTP security headers |
|  | cors | 2.x | CORS middleware |
|  | express-rate-limit | 8.x | Rate limiting |
| Utilities | compression | 1.x | Response compression |
|  | cookie-parser | 1.x | Cookie parsing |
|  | uuid | 14.x | UUID generation |
|  | ms | 2.x | Time string parsing |

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 19.x | UI library |
| Build Tool | Vite | 8.x | Fast dev server & bundler |
| Language | JavaScript (JSX) | ES2022 | No TypeScript (pure JS) |
| Router | React Router | 7.x | Client-side routing |
| State Mgmt | TanStack React Query | 5.x | Server state & caching |
| HTTP Client | Axios | 1.x | API requests with interceptors |
| UI Framework | Material-UI (MUI) | 9.x | Component library |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
|  | DaisyUI | 5.x | Tailwind component plugin |
|  | Emotion | 11.x | CSS-in-JS (MUI dependency) |
| Forms | React Hook Form | 7.x | Form state management |
|  | Joi | 17.x | Client-side validation |
| Notifications | Notistack | 3.x | Toast notifications |
| Maps | @react-google-maps/api | 2.x | Google Maps integration |
| File Export | ExcelJS + FileSaver | Latest | Excel export |
| Linter | OxLint | 1.x | Fast JS linter |

### Database Tooling

| Tool | Technology | Purpose |
|------|-----------|---------|
| CLI | Sequelize CLI | Schema migrations & seeding |
| Migrations | JavaScript (Sequelize) | Version-controlled schema changes |
| Seeders | JavaScript (Sequelize) | Lookup data initialization |

### Development & DevOps

| Tool | Purpose |
|------|---------|
| nodemon | Backend hot-reload (dev) |
| dotenv | Environment variable loading |
| ESLint | Backend code linting |
| Jest | Backend testing framework (configured but not fully implemented) |
| Supertest | API testing |

---

## 8. Data Flow Diagrams (Textual Description)

### Request Flow: Creating a Trip

\\\
┌──────────┐  HTTP POST /api/v1/trips      ┌──────────────┐
│ Frontend ├──────────────────────────────> │   Express    │
│  (React) │  {customerId, driverId, ...}   │  Middleware  │
└──────────┘                                └──────┬───────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │  authenticate middleware   │
                                    │  (verify JWT)              │
                                    └──────────────┬─────────────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │ authorizePermissions       │
                                    │ ('trips:create')           │
                                    └──────────────┬─────────────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │  validate(createTripSchema)│
                                    │  (Joi validation)          │
                                    └──────────────┬─────────────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │   TripController.create    │
                                    │   (thin adapter)           │
                                    └──────────────┬─────────────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │   CreateTripUseCase        │
                                    │   (business logic)         │
                                    │   - Validate customer      │
                                    │   - Validate driver        │
                                    │   - Generate trip_number   │
                                    │   - Calc expected mileage  │
                                    └──────────────┬─────────────┘
                                                   │
                        ┌──────────────────────────┴───────────────────────┐
                        │                                                  │
           ┌────────────▼─────────┐                       ┌───────────────▼────────┐
           │  TripRepository      │                       │ CustomerRepository      │
           │  (Sequelize impl)    │                       │ (Sequelize impl)        │
           │  - create(trip)      │                       │ - findById(customerId)  │
           │  - create(stops)     │                       └───────────────┬────────┘
           └────────────┬─────────┘                                       │
                        │                                                  │
                        └──────────────────────────┬───────────────────────┘
                                                   │
                                        ┌──────────▼──────────┐
                                        │   MySQL Database    │
                                        │   - trips           │
                                        │   - trip_stops      │
                                        │   - customers       │
                                        └──────────┬──────────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │   Return Trip entity       │
                                    │   (domain object)          │
                                    └──────────────┬─────────────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │  toTripResponseDto()       │
                                    │  (transform to API shape)  │
                                    └──────────────┬─────────────┘
                                                   │
                                    ┌──────────────▼─────────────┐
                                    │  ApiResponse.success()     │
                                    │  {message, data, code}     │
                                    └──────────────┬─────────────┘
                                                   │
┌──────────┐  JSON response                       │
│ Frontend │ <────────────────────────────────────┘
│ (React)  │  {data: {id, tripNumber, ...}}
└──────────┘
\\\

### Authentication Flow

\\\
Frontend                    Backend                         Database
   │                           │                                │
   │  POST /auth/login         │                                │
   │  {email, password}        │                                │
   ├──────────────────────────>│                                │
   │                           │ LoginUseCase.execute()         │
   │                           │                                │
   │                           │  UserRepository.findByEmail()  │
   │                           ├───────────────────────────────>│
   │                           │                                │
   │                           │<───────────────────────────────┤
   │                           │  User entity                   │
   │                           │                                │
   │                           │  BcryptHasher.compare()        │
   │                           │  (validate password)           │
   │                           │                                │
   │                           │  RoleRepository.findById()     │
   │                           ├───────────────────────────────>│
   │                           │<───────────────────────────────┤
   │                           │  Role with permissions[]       │
   │                           │                                │
   │                           │  JwtTokenService.sign()        │
   │                           │  - accessToken (15m)           │
   │                           │  - refreshToken (7d)           │
   │                           │                                │
   │                           │  RefreshTokenRepository        │
   │                           │  .create(token_hash)           │
   │                           ├───────────────────────────────>│
   │                           │                                │
   │<──────────────────────────┤                                │
   │  {accessToken,            │                                │
   │   refreshToken,           │                                │
   │   user}                   │                                │
   │                           │                                │
   │  tokenStorage.setTokens() │                                │
   │  (localStorage)           │                                │
   │                           │                                │
   │  All subsequent requests  │                                │
   │  include:                 │                                │
   │  Authorization: Bearer    │                                │
   │  <accessToken>            │                                │
   │                           │                                │
\\\

---

## 9. Component Interaction Patterns

### Pattern 1: Clean Architecture Dependency Flow

\\\
Controller (Presentation) 
    │ calls
    ▼
Use Case (Application)
    │ orchestrates
    ├──> Repository Interface (Domain)
    │      ▲ implements
    │      │
    │      └── Repository Implementation (Infrastructure)
    │              │ uses
    │              ▼
    │          Sequelize Model (Infrastructure)
    │              │ queries
    │              ▼
    │          MySQL Database
    │
    ├──> IHasher Interface (Application)
    │      ▲ implements
    │      └── BcryptHasher (Infrastructure)
    │
    └──> ITokenService Interface (Application)
           ▲ implements
           └── JwtTokenService (Infrastructure)
\\\

**Key Point**: Application layer NEVER imports from Infrastructure. All communication happens through interfaces defined in Domain/Application layers.

### Pattern 2: Repository Pattern

\\\javascript
// Domain: Interface definition (contract)
class ITripRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async create(data, stops) { throw new Error('Not implemented'); }
  async update(id, data) { throw new Error('Not implemented'); }
}

// Infrastructure: Sequelize implementation
class TripRepository extends ITripRepository {
  async findById(id) {
    const instance = await TripModel.findByPk(id, {
      include: [CustomerModel, DriverModel, TripStopModel]
    });
    return toDomain(instance); // Convert to domain entity
  }
  // ... other methods
}

// Container: Wiring
const tripRepository = new TripRepository(); // concrete implementation
const getTripUseCase = new GetTripUseCase(tripRepository); // inject interface
\\\

### Pattern 3: Use Case Orchestration

Use cases contain ZERO infrastructure code - only business logic.

\\\javascript
class AssignTripUseCase {
  constructor(tripRepository, driverRepository, logger) {
    this.tripRepository = tripRepository; // injected
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(tripId, driverId, actorId) {
    // Business validation
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) throw new NotFoundError('Trip not found');
    if (!trip.canBeAssigned()) throw new ValidationError('Trip cannot be assigned');

    const driver = await this.driverRepository.findById(driverId);
    if (!driver) throw new NotFoundError('Driver not found');
    if (driver.status !== 'active') throw new ValidationError('Driver is not active');

    // Business operation
    const updated = await this.tripRepository.update(tripId, {
      driverId,
      status: 'assigned',
      assignedAt: new Date(),
      updatedBy: actorId,
    });

    this.logger.info('Trip assigned', { tripId, driverId, actorId });
    return updated;
  }
}
\\\

### Pattern 4: Frontend Feature Organization

Each feature is self-contained with API, components, hooks, and pages.

\\\
features/trips/
├── api/
│   └── tripsApi.js         # Axios calls: createTrip(), listTrips(), etc.
├── hooks/
│   ├── useTrips.js         # useQuery for list
│   ├── useTrip.js          # useQuery for single trip
│   ├── useCreateTrip.js    # useMutation for create
│   ├── useUpdateTrip.js    # useMutation for update
│   └── useApproveTrip.js   # useMutation for approval
├── components/
│   ├── TripForm.jsx        # Create/edit form
│   ├── TripStopsManager.jsx # Stop list with add/remove/reorder
│   └── TripCard.jsx        # Display card
└── pages/
    ├── TripsListPage.jsx   # List view with filters
    └── BusinessTripsPage.jsx # Pending approvals view
\\\

**Usage**:
\\\javascript
// In TripsListPage.jsx
import { useTrips } from '../hooks/useTrips';
import { useCreateTrip } from '../hooks/useCreateTrip';

function TripsListPage() {
  const { data: trips, isLoading } = useTrips({ status: 'in_progress' });
  const createMutation = useCreateTrip();

  const handleCreate = (formData) => {
    createMutation.mutate(formData, {
      onSuccess: () => enqueueSnackbar('Trip created', { variant: 'success' }),
    });
  };

  // ... render logic
}
\\\

### Pattern 5: Error Handling

**Backend**:
\\\javascript
// Domain errors
class NotFoundError extends Error { name = 'NotFoundError'; statusCode = 404; }
class ValidationError extends Error { name = 'ValidationError'; statusCode = 400; }
class UnauthorizedError extends Error { name = 'UnauthorizedError'; statusCode = 401; }

// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: env.nodeEnv === 'development' ? err.stack : undefined,
    });
  }
  // Unknown error
  logger.error('Unhandled error', { error: err });
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
\\\

**Frontend**:
\\\javascript
// Axios interceptor catches errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
    }
    return Promise.reject(error);
  }
);

// React Query onError callback
const { mutate } = useCreateTrip({
  onError: (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    enqueueSnackbar(message, { variant: 'error' });
  },
});
\\\

---

## 10. Identified Architectural Patterns and Best Practices

### ✅ Strengths

1. **Clean Architecture Implementation**
   - Strict layer separation with dependency inversion
   - Domain layer is pure JavaScript with no external dependencies
   - Infrastructure concerns isolated from business logic

2. **SOLID Principles**
   - Single Responsibility: Each use case handles one operation
   - Open/Closed: New use cases added without modifying existing code
   - Liskov Substitution: Repository implementations are interchangeable
   - Interface Segregation: Small, focused interfaces (IHasher, ITokenService)
   - Dependency Inversion: High-level code depends on abstractions

3. **Repository Pattern**
   - Abstracts data access; easy to swap Sequelize for another ORM
   - Domain entities returned (not raw Sequelize instances)

4. **Security Best Practices**
   - JWT with short-lived access tokens + refresh token rotation
   - Password hashing with bcrypt
   - RBAC with fine-grained permissions
   - Helmet for HTTP security headers
   - Rate limiting to prevent abuse
   - SQL injection prevention via parameterized queries (Sequelize)
   - Soft deletes to preserve data integrity

5. **Database Schema Design**
   - Proper foreign key constraints with cascade rules
   - Indexed columns for query performance
   - Audit fields (created_by, updated_by, created_at, updated_at, deleted_at)
   - Normalized structure with junction tables for M:N relationships
   - Enum constraints for status fields

6. **Frontend Architecture**
   - Feature-based organization (scalable)
   - React Query for server state (eliminates prop drilling, auto caching)
   - Centralized Axios instance with interceptors
   - Protected routes with permission guards
   - Token refresh handled transparently

7. **Separation of Concerns**
   - Database project independent from backend (separate lifecycle)
   - Controllers are thin adapters (no business logic)
   - Validation schemas separate from use cases

8. **Developer Experience**
   - Swagger/OpenAPI documentation
   - Consistent error responses
   - Environment-based configuration
   - Hot reload in development (nodemon, Vite)

---

### ⚠️ Observations & Potential Improvements

1. **Testing Coverage**
   - Jest and Supertest configured but no test files found
   - **Recommendation**: Add unit tests for use cases, integration tests for repositories, E2E tests for critical flows

2. **Logging & Observability**
   - Winston logger used but no centralized error tracking (e.g., Sentry)
   - No request tracing or correlation IDs
   - **Recommendation**: Add request ID middleware, integrate APM tool (Sentry, Datadog)

3. **Audit Logging**
   - \udit_logs\ table exists but no evidence of automatic audit logging in use cases
   - **Recommendation**: Create AuditService and inject into use cases that modify data

4. **Transaction Management**
   - Trip creation includes multiple inserts (trip + stops) but no explicit transaction wrapping in code
   - **Recommendation**: Wrap multi-step operations in Sequelize transactions

5. **API Versioning**
   - Routes prefixed with \/api/v1\ but no strategy for v2 documented
   - **Recommendation**: Document versioning strategy (URL-based, header-based, etc.)

6. **Rate Limiting Granularity**
   - Global rate limit only (200 req/15min)
   - **Recommendation**: Add endpoint-specific limits (e.g., stricter for /auth/login)

7. **Frontend TypeScript**
   - Project uses JavaScript; TypeScript would catch type errors at compile time
   - **Recommendation**: Gradually migrate to TypeScript for type safety

8. **Caching**
   - No caching layer (Redis) for frequently accessed data (roles, permissions, active drivers)
   - **Recommendation**: Add Redis for session storage and data caching

9. **File Uploads**
   - No file upload handling (e.g., driver license images, delivery receipts)
   - **Recommendation**: Add multer + S3/local storage for file attachments

10. **Real-Time Features**
    - GPS pings via polling (POST every N seconds); WebSockets would be more efficient
    - **Recommendation**: Implement Socket.io for real-time tracking

11. **Background Jobs**
    - No job queue for async tasks (e.g., email notifications, report generation)
    - **Recommendation**: Add Bull + Redis for job processing

12. **Monitoring & Alerts**
    - No health metrics exposed (CPU, memory, DB connection pool)
    - **Recommendation**: Add Prometheus metrics endpoint

13. **Documentation**
    - README files exist but no architectural decision records (ADRs)
    - **Recommendation**: Document key design decisions (why Clean Architecture, why Sequelize, etc.)

14. **Error Messages**
    - Some errors expose technical details (e.g., "Sequelize ValidationError")
    - **Recommendation**: Sanitize error messages in production to avoid info leakage

15. **Password Policy**
    - No password complexity enforcement visible
    - **Recommendation**: Add Joi schema for password strength on user creation

---

### 🔍 Potential Issues

1. **Driver-User Linkage Complexity**
   - Drivers can exist without user accounts (user_id NULL)
   - Creating a driver user requires two-step process (create user, then link to driver)
   - **Risk**: Data inconsistency if linkage fails mid-operation
   - **Mitigation**: Wrap in transaction, add validation in CreateUserUseCase

2. **Trip Status Transitions**
   - Business rules in \Trip.canTransitionTo()\ but not enforced at database level
   - **Risk**: Direct DB manipulation could bypass rules
   - **Mitigation**: Add DB triggers or stored procedures for critical constraints

3. **Soft Deletes**
   - Sequelize paranoid mode used, but unique constraints don't account for deleted_at
   - **Example**: Deleting a customer and recreating with same name may fail
   - **Mitigation**: Modify unique indexes to be conditional (WHERE deleted_at IS NULL)

4. **Token Storage in LocalStorage**
   - Vulnerable to XSS attacks
5. **N+1 Query Problem**
   - Repository includes eager loading (`include: [Customer, Driver, TripStops]`) but could still have N+1 in nested associations
   - **Mitigation**: Audit slow queries, use Sequelize's `findAll` with proper includes

6. **GPS Tracking Data Volume**
   - `trip_location_pings` table could grow rapidly (1 ping/10 sec = 8640/day per trip)
   - **Mitigation**: Add data retention policy, archive old pings after 90 days

7. **Mileage Calculation Reliance on Google Maps**
   - External dependency for critical business logic
   - **Risk**: API failures, quota limits, cost
   - **Mitigation**: Cache distance calculations, implement fallback haversine formula

8. **No Optimistic Concurrency Control**
   - No version field on entities
   - **Risk**: Lost updates if two users edit same trip simultaneously
   - **Mitigation**: Add `version` column, check before updates

---

## 11. Summary & Recommendations

### Executive Assessment

The Anuradha Transport Management System demonstrates **professional-grade software engineering**. The Clean Architecture implementation ensures long-term maintainability and testability. The RBAC system is comprehensive, the database schema is well-normalized, and the frontend architecture is modern and scalable.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Backend** | Node.js/Express + Sequelize ORM |
| **Frontend** | React 19 + Material-UI + React Query |
| **Database** | MySQL 8.x with 14 tables |
| **Architecture** | Clean Architecture (4 layers) |
| **Authentication** | JWT with refresh token rotation |
| **Authorization** | RBAC (3 roles, 26 permissions) |
| **API Endpoints** | ~40+ REST endpoints |
| **Domain Entities** | 8 core entities (User, Role, Customer, Driver, Trip, TripStop, Location, etc.) |
| **Use Cases** | 25+ business operations |

### Recommended Next Steps

**Phase 1: Testing & Quality (Immediate)**
1. Add unit tests for all use cases (target 80%+ coverage)
2. Add integration tests for API endpoints
3. Set up CI/CD pipeline with automated testing

**Phase 2: Security Hardening (Short-term)**
4. Migrate refresh tokens from localStorage to HttpOnly cookies
5. Implement per-user rate limiting
6. Add audit logging for sensitive operations
7. Implement password complexity enforcement
8. Add input sanitization for XSS prevention

**Phase 3: Observability (Short-term)**
9. Integrate Sentry or similar for error tracking
10. Add request correlation IDs for tracing
11. Implement health check with DB connection status
12. Add Prometheus metrics

**Phase 4: Feature Enhancements (Medium-term)**
13. Implement WebSocket for real-time tracking
14. Add notification system (email/SMS/push)
15. Implement optimistic locking (version fields)
16. Add soft delete restoration endpoints
17. Implement mileage discrepancy alerts
18. Add file upload for driver documents/delivery receipts

**Phase 5: Scalability (Long-term)**
19. Add Redis caching layer for frequently accessed data
20. Implement background job queue (Bull/BullMQ)
21. Consider microservices for high-traffic modules
22. Add database read replicas for reporting
23. Implement data archival strategy for old trips/pings

---

## Appendix: File Structure Reference

### Backend Directory Tree
```
backend/src/
├── app.js                          # Express app configuration
├── server.js                       # HTTP server entry point
├── config/
│   └── env.js                     # Environment variable mapping
├── container/
│   └── index.js                   # Dependency injection container
├── domain/
│   ├── entities/                  # Pure domain objects
│   ├── enums/                     # Domain constants
│   ├── errors/                    # Domain exceptions
│   └── repositories/              # Repository interfaces
├── application/
│   ├── common/                    # Shared utilities (ApiResponse, Pagination)
│   ├── dtos/                      # Data transfer objects
│   ├── interfaces/                # Application interfaces
│   ├── use-cases/                 # Business logic orchestrators
│   └── validators/                # Joi validation schemas
├── infrastructure/
│   ├── auth/                      # Auth implementations (JWT, bcrypt, RBAC)
│   ├── config/                    # Config adapters
│   ├── database/                  # Sequelize repos + models
│   ├── logging/                   # Winston logger
│   └── services/                  # External service integrations
├── middleware/                     # Express middleware
└── presentation/
    ├── controllers/               # HTTP controllers
    ├── routes/                    # Route definitions
    └── docs/                      # Swagger spec
```

### Frontend Directory Tree
```
frontend/src/
├── main.jsx                       # React entry point
├── App.jsx                        # Root component with providers
├── api/
│   ├── client.js                 # Axios instance
│   ├── config.js                 # React Query config
│   └── services/                 # Shared API services
├── app/
│   └── AppRouter.jsx             # Route definitions
├── components/                    # Shared components
├── config/                        # App configuration
├── context/                       # React contexts (Auth, Theme)
├── features/                      # Feature modules
│   ├── auth/
│   ├── customers/
│   ├── dashboard/
│   ├── drivers/
│   ├── locations/
│   ├── tracking/
│   ├── trips/
│   └── users/
├── layouts/                       # Layout components
├── routes/                        # Route guards
├── theme/                         # MUI theme config
└── utils/                         # Utility functions
```

---

**End of Document**

---

**Document Metadata:**
- **Generated:** 2026-05-10
- **Scope:** Complete codebase analysis (backend, frontend, database)
- **Methodology:** Source code review of migrations, models, entities, use cases, controllers, routes, components, and hooks
- **Status:** Comprehensive architectural review complete
5. **N+1 Query Problem**
   - Repository includes eager loading (\include: [Customer, Driver, TripStops]\) but could still have N+1 in nested associations
   - **Mitigation**: Audit slow queries, use Sequelize query logging

6. **Hardcoded Pagination Limits**
   - No maximum page size validation visible
   - **Risk**: Client could request pageSize=999999 and overload server
   - **Mitigation**: Add max page size validation in parsePagination()

7. **Google Maps API Key Exposure**
   - Key stored in frontend config, visible in client bundle
   - **Risk**: API key theft/abuse
   - **Mitigation**: Restrict API key to specific domains in Google Cloud Console

---

## 11. Code Quality Assessment

### Backend

**Strengths**:
- ✅ Consistent code structure across modules
- ✅ Clear naming conventions (UseCases end in "UseCase", repos end in "Repository")
- ✅ Comments explain WHY, not just WHAT
- ✅ Error handling with custom domain errors
- ✅ Use of async/await consistently

**Areas for Improvement**:
- ⚠️ Some use cases lack input validation (rely entirely on Joi middleware)
- ⚠️ Magic strings for status values (use enums consistently)
- ⚠️ No JSDoc comments on public methods

### Frontend

**Strengths**:
- ✅ Feature-based organization scales well
- ✅ Consistent use of React hooks
- ✅ Separation of concerns (API layer vs components)
- ✅ Material-UI for consistent design

**Areas for Improvement**:
- ⚠️ Some components exceed 200 lines (split into smaller components)
- ⚠️ Inline styles mixed with Tailwind classes (standardize on one)
- ⚠️ PropTypes not used (would benefit from TypeScript)

### Database

**Strengths**:
- ✅ Sequential migration naming for ordered execution
- ✅ Both \up\ and \down\ migrations implemented
- ✅ Seeders for essential data
- ✅ Foreign keys and indexes properly defined

**Areas for Improvement**:
- ⚠️ No rollback testing documented
- ⚠️ Large migrations (add multiple columns) could be split for granularity

---

## 12. Deployment & Environment Considerations

### Environment Variables

**Backend** (\.env\):
\\\
NODE_ENV=production
PORT=4000
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN=15m, JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000, RATE_LIMIT_MAX=200
LOG_LEVEL=info
\\\

**Frontend**:
\\\
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_GOOGLE_MAPS_API_KEY=...
\\\

### Deployment Checklist

- [ ] Change default admin password
- [ ] Rotate JWT secrets
- [ ] Set CORS_ORIGIN to production domain
- [ ] Enable HTTPS (TLS certificates)
- [ ] Set NODE_ENV=production
- [ ] Configure database backups
- [ ] Set up monitoring (Sentry, Datadog, etc.)
- [ ] Review rate limits for production traffic
- [ ] Restrict Google Maps API key to production domain
- [ ] Configure CDN for frontend assets
- [ ] Set up CI/CD pipeline
- [ ] Run database migrations on production DB
- [ ] Seed roles, permissions, and admin user
- [ ] Test token refresh flow in production
- [ ] Verify audit logging is working

---

## Conclusion

The Anuradha Transport Management System demonstrates a **well-architected, enterprise-grade application** following Clean Architecture principles with clear separation of concerns. The codebase is maintainable, testable, and scalable.

**Key Achievements**:
- Clean separation between domain logic, application orchestration, and infrastructure
- Robust authentication/authorization with JWT + RBAC
- Comprehensive database schema with proper normalization and constraints
- Feature-rich trip management with multi-stop delivery, GPS tracking, and approval workflows

**Next Steps for Production Readiness**:
1. Add comprehensive test coverage (unit, integration, E2E)
2. Implement audit logging throughout use cases
3. Add monitoring, alerting, and observability tools
4. Enhance security (audit XSS/CSRF vulnerabilities, add CSP headers)
5. Optimize database queries (add query logging, identify N+1 issues)
6. Implement background job processing (email notifications, reports)
7. Add WebSocket support for real-time features
8. Document architectural decisions in ADRs
9. Create deployment runbooks and disaster recovery procedures

The system is in a solid state for continued development and can support the business requirements of a transport management operation.
