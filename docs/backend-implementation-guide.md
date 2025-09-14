# Backend Implementation Guide

## Overview

This document explains the backend codebase structure, design decisions, and where to find/modify different components. It covers the foundation layer built before implementing API routes.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts         # Database connection & configuration
│   ├── models/
│   │   ├── User.ts            # User data access layer
│   │   └── Storefront.ts      # Storefront data access layer
│   ├── services/
│   │   └── UserService.ts     # User business logic layer
│   ├── types/
│   │   ├── index.ts           # Barrel exports for all types
│   │   ├── user.ts           # User-related interfaces
│   │   ├── storefront.ts     # Storefront-related interfaces
│   │   ├── service.ts        # Service-related interfaces
│   │   ├── appointment.ts    # Appointment-related interfaces
│   │   └── common.ts         # Shared utility types
│   └── utils/
│       └── auth.ts           # Authentication utilities
├── scripts/
│   ├── test-database.js      # Comprehensive database tests (JS)
│   ├── test-connection.ts    # Quick TypeScript connection test
│   └── test-auth.ts         # Authentication utilities test
├── migrations/
│   └── 003_fixed_schema.sql # Complete database schema
├── .env                     # Environment variables
└── package.json            # Dependencies and scripts
```

## Architecture Layers

### Layer 1: Database Configuration (`src/config/`)

**Purpose**: Manages PostgreSQL connection pooling and database configuration.

**Key File**: `database.ts`
- **Connection Pool**: Manages up to 20 concurrent database connections
- **Query Helper**: Centralized query execution with logging
- **Environment Integration**: Reads from `.env` file for database credentials
- **Graceful Shutdown**: Properly closes connections on app termination

**Configuration Parameters**:
```typescript
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'schedulux_primary',
  user: process.env.DB_USER || 'raymondtsai',
  password: process.env.DB_PASSWORD || '',
  max: 20,                    // ← Change max connections here
  idleTimeoutMillis: 30000,   // ← Adjust idle timeout here
  connectionTimeoutMillis: 2000 // ← Adjust connection timeout here
};
```

**To Modify**:
- **Database credentials**: Edit `.env` file
- **Connection pool settings**: Edit `database.ts` config object
- **Query logging**: Modify the `query()` function

### Layer 2: Type Definitions (`src/types/`)

**Purpose**: Provides TypeScript interfaces for type safety and documentation.

**Design Decision**: Split types by domain rather than one large file for better maintainability.

**Files**:
- `user.ts` - User entity and auth-related types
- `storefront.ts` - Business location types
- `service.ts` - Service offering types  
- `appointment.ts` - Scheduling and booking types
- `common.ts` - Shared utilities (API responses, pagination, errors)
- `index.ts` - Barrel exports for clean imports

**Interface Accuracy**: All interfaces match the database schema exactly, verified against `migrations/003_fixed_schema.sql`.

**To Add New Types**:
1. Add to appropriate domain file (e.g., new appointment type → `appointment.ts`)
2. Export from `index.ts` if needed elsewhere
3. Consider both database entity and API request/response variants

### Layer 3: Data Access Layer (`src/models/`)

**Purpose**: Repository pattern for database interactions. Translates business requests to SQL.

**Design Decision**: Models handle ONLY data access, no business logic.

**Current Models**:
- `User.ts` - User CRUD operations
- `Storefront.ts` - Storefront CRUD operations

**Key Features**:
- **Parameterized Queries**: Prevents SQL injection (`$1`, `$2`, etc.)
- **Soft Deletes**: Always filters `deleted_at IS NULL`
- **Type Safety**: Returns typed objects, not raw database rows
- **Consistent Patterns**: All models follow same CRUD structure

**Example Pattern**:
```typescript
static async findById(id: number): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
  return result.rows[0] || null;
}
```

**To Add New Models**:
1. Create new file in `src/models/`
2. Follow the pattern: `findById`, `create`, `update`, `softDelete`
3. Always include `deleted_at IS NULL` in queries
4. Use parameterized queries (`$1`, `$2`)
5. Return typed results using interfaces from `src/types/`

### Layer 4: Business Logic Layer (`src/services/`)

**Purpose**: Handles business rules, validation, and complex operations.

**Design Decision**: Services contain business logic, models contain only data access.

**Current Services**:
- `UserService.ts` - User registration, authentication, business rules

**Key Responsibilities**:
- **Validation**: Password strength, email uniqueness
- **Business Rules**: Active user checks, role-based logic
- **Security**: Password hashing before storage
- **Error Handling**: Business-friendly error messages
- **Orchestration**: Coordinates multiple model operations

**Example Flow**:
```typescript
UserService.register() → validates → hashes password → UserModel.create()
```

**To Add Business Logic**:
1. Create service files for each domain
2. Services call models, never the reverse
3. Handle validation and business rules here
4. Keep models simple and focused on data access

### Layer 5: Authentication Utilities (`src/utils/`)

**Purpose**: Reusable utilities for security and common operations.

**Key File**: `auth.ts`
- **Password Hashing**: bcrypt with 12 salt rounds
- **Password Verification**: Secure comparison
- **Password Validation**: Strength requirements
- **Security Parameters**: Configurable salt rounds

**Security Configuration**:
```typescript
const SALT_ROUNDS = 12; // ← Adjust security vs. performance here
```

**Password Requirements** (modify in `validatePassword()`):
- Minimum 8 characters
- Maximum 128 characters  
- Must include: uppercase, lowercase, number, special character

**To Modify Security**:
- **Salt rounds**: Change `SALT_ROUNDS` constant (higher = more secure, slower)
- **Password rules**: Edit validation in `validatePassword()`
- **Add new utilities**: Create additional functions in `auth.ts`

## Environment Configuration

**File**: `.env`
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedulux_primary
DB_USER=raymondtsai
DB_PASSWORD=
```

**To Update**:
1. Modify `.env` for local development
2. Set environment variables in production
3. Never commit `.env` to version control

## Testing Infrastructure

### Database Tests (`scripts/test-database.js`)
- **Purpose**: Comprehensive database functionality testing
- **Coverage**: Tables, indexes, triggers, constraints, business logic
- **Language**: JavaScript (existing)
- **Run**: `npm run test:db`

### Connection Tests (`scripts/test-connection.ts`)
- **Purpose**: Quick TypeScript database connection verification
- **Coverage**: Connection, basic queries, configuration
- **Language**: TypeScript
- **Run**: `npm run test:connection`

### Authentication Tests (`scripts/test-auth.ts`)
- **Purpose**: Password hashing and validation testing
- **Coverage**: Hashing, verification, validation, performance, edge cases
- **Language**: TypeScript
- **Run**: `npm run test:auth`

## npm Scripts

```json
{
  "test:db": "node scripts/test-database.js",
  "test:connection": "npx ts-node scripts/test-connection.ts", 
  "test:auth": "npx ts-node scripts/test-auth.ts",
  "dev": "nodemon"
}
```

## Design Decisions & Rationale

### 1. Repository Pattern for Data Access
**Decision**: Separate models (data) from services (business logic)
**Rationale**: 
- Clean separation of concerns
- Testable business logic
- Prevents SQL scattered throughout codebase
- Type-safe database interactions

### 2. Service Layer for Business Logic
**Decision**: Services handle validation, security, business rules
**Rationale**:
- Keeps models simple and focused
- Centralizes business logic
- Easier to test without database dependencies
- Clear boundaries for future expansion

### 3. Domain-Separated Type Files
**Decision**: Split types by domain rather than one large file
**Rationale**:
- Better maintainability as project grows
- Easier for team development
- Clearer organization
- Reduces merge conflicts

### 4. bcrypt with 12 Salt Rounds
**Decision**: Use bcrypt for password hashing with 12 rounds
**Rationale**:
- Industry standard for password security
- Adaptive cost (can increase as computers get faster)
- Built-in salt generation
- 12 rounds balances security vs. performance (~200ms)

### 5. Environment-Based Configuration
**Decision**: Use `.env` file with fallback defaults
**Rationale**:
- Different settings for dev/staging/production
- Keeps secrets out of code
- Easy local development setup
- Follows 12-factor app principles

## Common Modification Scenarios

### Adding a New Database Entity
1. **Create migration**: Add to `migrations/` folder
2. **Define types**: Add interfaces to appropriate `src/types/` file
3. **Create model**: Add to `src/models/` following existing patterns
4. **Add business logic**: Create service in `src/services/`
5. **Export types**: Update `src/types/index.ts`

### Changing Database Connection
1. **Local**: Update `.env` file
2. **Production**: Set environment variables
3. **Pool settings**: Modify `src/config/database.ts`

### Modifying Security Settings
1. **Password rules**: Edit `src/utils/auth.ts` `validatePassword()`
2. **Hash strength**: Change `SALT_ROUNDS` in `src/utils/auth.ts`
3. **Connection timeout**: Modify `src/config/database.ts`

### Adding New Validation
1. **Data validation**: Add to appropriate service in `src/services/`
2. **Type validation**: Add to interfaces in `src/types/`
3. **Database constraints**: Add migration to `migrations/`

### Debugging Issues
1. **Database connection**: Run `npm run test:connection`
2. **Schema problems**: Run `npm run test:db`
3. **Authentication**: Run `npm run test:auth`
4. **Query issues**: Check logs from `src/config/database.ts` query function

## Performance Considerations

### Database Connection Pool
- **Current**: 20 max connections
- **Modify**: Change `max` in `database.ts`
- **Monitor**: Connection usage in production

### Password Hashing
- **Current**: ~200ms per hash/verify
- **Adjust**: Change `SALT_ROUNDS` (10-14 recommended)
- **Balance**: Security vs. user experience

### Query Performance
- **Indexes**: Defined in database schema
- **Query logging**: Enabled in `database.ts`
- **Optimization**: Monitor slow queries in logs

## Next Steps

This foundation supports the next implementation phases:

1. **Express Server Setup**: Basic HTTP server with middleware
2. **Authentication Middleware**: JWT token handling
3. **API Routes**: RESTful endpoints using services and models
4. **Request Validation**: Input sanitization and validation
5. **Error Handling**: Consistent error responses
6. **API Documentation**: OpenAPI/Swagger documentation

The current architecture provides a solid, testable, and maintainable foundation for building the REST API layer.
