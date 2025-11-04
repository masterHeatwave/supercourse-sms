# Supercourse SMS API - Developer Documentation

This document provides technical documentation for developers working on the Supercourse SMS (School Management System) API.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Technology Stack](#technology-stack)
3. [Getting Started](#getting-started)
4. [Authentication](#authentication)
5. [Authorization](#authorization)
6. [API Key Security](#api-key-security)
7. [Database Models & Relationships](#database-models--relationships)
8. [Error Handling](#error-handling)
9. [Middleware](#middleware)
10. [Validation](#validation)
11. [Coding Conventions](#coding-conventions)
12. [Testing](#testing)

## Project Structure

The project follows a component-based architecture, where each domain entity has its own folder with all related files:

```
src/
  components/
    component-name/
      component-name.interface.ts  # TypeScript interfaces
      component-name.model.ts      # Mongoose model
      component-name.service.ts    # Business logic
      component-name.controller.ts # HTTP request handlers
      component-name.routes.ts     # Express routes
      component-name-validate.schema.ts # Zod validation schemas
  middleware/                      # Express middleware
  plugins/                         # Mongoose plugins
  config/                          # Configuration files
  utils/                           # Utility functions
  routes/                          # API route definitions
```

## Technology Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Static typing
- **MongoDB**: Database
- **Mongoose**: MongoDB ODM
- **Redis**: Token storage and caching
- **Zod**: Validation library
- **JWT**: Authentication
- **Jest**: Testing framework

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

### Environment Variables

Key environment variables that need to be set:

- `NODE_ENV`: Environment (development, test, production)
- `PORT`: API port
- `MONGO_URI`: MongoDB connection string
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRE`: JWT expiration time
- `JWT_REFRESH_EXPIRE`: JWT refresh token expiration time
- `API_KEY`: API key for internal endpoints

## Authentication

The API uses JWT (JSON Web Tokens) for authentication, with refresh tokens for extended sessions.

### Token Structure

The auth token header structure is: `x-ss-auth: roleId:jwtToken:userId`

### Authentication Flow

1. User logs in with email/password
2. Server validates credentials
3. Server generates access token and refresh token
4. Client stores tokens
5. Client includes token in requests

### Refresh Token Process

1. When access token expires, client sends refresh token
2. Server validates refresh token and issues new access token

### Code Example

```typescript
// Authentication middleware (simplified)
jwt.verify(jwtToken, config.JWT_SECRET);
req.user = fetchedUser;

if (fetchedUser.roles.some((role: IRole) => role.title === 'ADMIN')) {
  return next();
}

if (roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasRole = fetchedUser.roles.some((role: IRole) => allowedRoles.includes(role.title));
  if (!hasRole) {
    // Handle unauthorized access
  }
}
```

## Authorization

The API uses a role-based access control (RBAC) system with permission-based checks.

### Roles

- `ADMIN`: Full system access
- `MANAGER`: School/organization management
- `TEACHER`: Class and student management
- `STUDENT`: Limited access to own data
- `PARENT`: Limited access to child's data

### Permissions

Permissions are stored in the database and linked to roles. Each endpoint/action has a permission key.

### Authorization Middleware

The `authorize` middleware checks:

1. If the user is an admin (full access)
2. If the user has required roles
3. If the user has specific permission (if specified)

### Usage

```typescript
// Route with role-based authorization
router.post('/add-user', authorize([Role.ADMIN, Role.MANAGER]), taxiController.addUser);

// Route with permission-based authorization
router.post('/special-action', authorize(null, 'special:action:permission'), controller.specialAction);
```

## API Key Security

Internal endpoints are protected by API key authentication.

### Implementation

```typescript
// API Key middleware
export const apiKeyAuth = asyncHandler(async (req, _res, next) => {
  // Skip for certain paths
  if (excludedRoutes.includes(req.path)) {
    return next();
  }

  // Check API key
  if (req.header('c-api-key') !== config.API_KEY) {
    throw new ErrorResponse('Forbidden', StatusCodes.FORBIDDEN);
  }
  next();
});
```

## Database Models & Relationships

### Core Models

#### User

- **Fields**: name, email, phone, password, roles, etc.
- **Relationships**:
  - Many-to-many with `Role`
  - One-to-many with `Session` (as teacher)
  - One-to-many with `Session` (as student)
  - One-to-many with `Inventory`
  - One-to-many with `Post` (as author)

#### Academic Models

- **AcademicYear**: name, start_date, end_date
- **AcademicPeriod**: name, start_date, end_date, academic_year
- **AcademicSubperiod**: name, start_date, end_date, academic_period

**Relationships**:

- AcademicYear → AcademicPeriod (one-to-many)
- AcademicPeriod → AcademicSubperiod (one-to-many)
- AcademicPeriod → Session (one-to-many)

#### School Operations Models

- **Taxi**: name, color, branch, subject, level, academic_year, academic_period, users
- **Classroom**: name, capacity, location, equipment, availability
- **Session**: start_date, end_date, taxi, classroom, students, teachers, academic_period, academic_subperiod

**Key Relationships**:

- Taxi → Session (one-to-many)
- Classroom → Session (one-to-many)
- User → Session (many-to-many, as students and teachers)

#### Additional Models

- **Inventory**: user, title, billing_date, return_date, notes, customer
- **Post**: title, content, author, tags, status, featured_image, published_at
- **Customer**: name, type, location, etc.

### Example Relationship

```typescript
// Session model (simplified)
const SessionSchema = new mongoose.Schema({
  start_date: Date,
  end_date: Date,
  taxi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Taxi',
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  teachers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  academic_period: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicPeriod',
  },
});
```

## Error Handling

The API uses a centralized error handling system for consistent responses.

### Error Response Format

```json
{
  "status": 400,
  "success": false,
  "message": "Invalid input data",
  "error": "ValidationError"
}
```

### Error Handling Middleware

```typescript
// Error handling middleware (simplified)
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsError(err);
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    status: error.statusCode || 500,
    message: error.message || 'Server Error',
  });
};
```

## Middleware

### Key Middleware Components

1. **Async Handler**: Wraps async route handlers to catch errors
2. **Authorize**: Role and permission-based authorization
3. **API Key Auth**: Protects internal endpoints
4. **Error Handling**: Centralized error handling
5. **HTTP Logger**: Logs HTTP requests
6. **JSON Response**: Standardizes API responses

### Example Usage

```typescript
// Using the asyncHandler
const getAll = asyncHandler(async (req, res, next) => {
  const items = await service.getAll();
  jsonResponse(res, {
    status: 200,
    success: true,
    data: items,
  });
});
```

## Validation

The API uses Zod for request validation.

### Validation Schema Example

```typescript
// Validation schema (simplified)
export const createAcademicYearSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
  })
  .refine(
    (data) => {
      return data.start_date < data.end_date;
    },
    {
      message: 'Start date must be before end date',
      path: ['start_date'],
    }
  );
```

### Validation in Controllers

```typescript
// Using validation in controller (simplified)
const create = asyncHandler(async (req, res, next) => {
  const validatedData = createSchema.parse(req.body);
  const item = await service.create(validatedData);
  jsonResponse(res, {
    status: 201,
    success: true,
    data: item,
  });
});
```

## Coding Conventions

### Naming Conventions

- **Files**: kebab-case.ts (e.g., user-validate.schema.ts)
- **Interfaces**: PascalCase with 'I' prefix (e.g., IUser)
- **Models**: PascalCase (e.g., UserSchema)
- **Services/Controllers**: PascalCase (e.g., UserService)
- **Functions**: camelCase (e.g., getAllUsers)
- **Variables**: camelCase (e.g., userData)
- **Constants**: UPPER_SNAKE_CASE (e.g., JWT_SECRET)

### Code Organization

- Keep files small and focused
- Group related functionality
- Use TypeScript interfaces for all data structures
- Separate business logic (services) from HTTP handlers (controllers)

## Testing

The API uses Jest for testing.

### Test Structure

```
__tests__/               # Test setup, config
components/
  component-name/
    component-name.spec.ts     # Unit tests
    component-name-e2e.spec.ts # Integration tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- -t "test-name"

# Run with coverage
npm test -- --coverage
```

### Example Test

```typescript
// Sample test (simplified)
describe('AuthService', () => {
  describe('login', () => {
    it('should return a token when given valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password123' };

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw an error when given invalid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrongpassword' };

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });
});
```

---

This developer documentation provides a technical overview of the Supercourse SMS API. For more specific details about endpoints and functionality, refer to the API documentation and the code itself.
