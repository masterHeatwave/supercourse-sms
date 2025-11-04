# Supercourse SMS API

The Supercourse School Management System (SMS) API is a comprehensive backend solution for educational institutions to manage academic years, periods, classrooms, sessions, teachers, students, and resources.

## Table of Contents

1. [Features](#features)
2. [Getting Started](#getting-started)
3. [Environment Configuration](#environment-configuration)
4. [API Endpoints](#api-endpoints)
5. [Authentication](#authentication)
6. [Running the API](#running-the-api)
7. [Development](#development)
8. [Technical Documentation](#technical-documentation)

## Features

- **Complete Academic Management**

  - Academic years, periods, and subperiods
  - Classroom management with availability tracking
  - Session scheduling with conflict prevention
  - Taxi/transportation tracking

- **User Management**

  - Role-based access control (RBAC)
  - Permission-based authorization
  - Multiple user types (admin, manager, teacher, student, parent, etc.)

- **Content Management**

  - Post creation and publishing
  - Tag management
  - Publishing workflow

- **Inventory Management**

  - Track items lent to customers
  - Billing and return management

- **Authentication & Security**
  - JWT-based authentication
  - Refresh token support
  - API key protection for internal endpoints
- **Advanced Features**
  - Notification system
  - Email verification and password reset
  - Comprehensive validation
  - Filtering and searching

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Redis for token storage

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run in development mode
npm run dev
```

## Environment Configuration

```
# Server
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/supercourse-sms

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d

# Email Configuration
EMAIL_HOST=your-email-host
EMAIL_PORT=587
EMAIL_USER=your-email-user
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@supercourse.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API Security
API_KEY=your_api_key

# Application mode
PROD_CHECK=DEV  # DEV or PROD
EMAIL_VERIFICATION=DEV  # DEV or PROD
```

## API Endpoints

The API provides the following main endpoints:

### Authentication Endpoints

- `POST /api/v1/auth/authenticate` - Login
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/verify-email/:token` - Verify email
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password/:token` - Reset password
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Academic Management

- **Academic Years**: `/api/v1/academic-years`
- **Academic Periods**: `/api/v1/academic-periods`
- **Academic Subperiods**: `/api/v1/academic-subperiods`

### School Operations

- **Taxis**: `/api/v1/taxis`
- **Classrooms**: `/api/v1/classrooms`
- **Sessions**: `/api/v1/sessions`

### Additional Features

- **Customers**: `/api/v1/customers`
- **Inventory**: `/api/v1/inventory`
- **Posts**: `/api/v1/posts`
- **Roles & Permissions**: `/api/v1/roles`
- **Notifications**: `/api/v1/notifications`

### Internal API Endpoints

Protected endpoints for system-to-system communication:

- `/api/v1/internal/*` - Requires API key authentication

## Authentication

### Regular Authentication

The API uses JWT for authentication with the following workflow:

1. User logs in with email/password
2. API returns access token and refresh token
3. Client includes access token in requests
4. When token expires, use refresh token to get a new access token

Access token format: `x-ss-auth: roleId:token:userId`

### Password Management

#### Creating New User

1. Admin creates a new user
2. User receives an email with a link to create a password
3. Link expires after a configurable period
4. User sets password and can then log in

#### Password Reset

1. User requests password reset
2. User receives email with reset link
3. Link expires after a configurable period
4. User sets new password

## Running the API

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Using Docker (Recommended for Development)

```bash
# Copy environment variables example
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop containers
docker-compose down
```

This will start the following services:

- API server (accessible at http://localhost:3193)
- MongoDB (accessible at localhost:27017)
- Redis (accessible at localhost:6379)

## Development

See [DEVELOPER.md](DEVELOPER.md) for detailed technical documentation, including:

- Project structure
- Technology stack
- Database models & relationships
- Authentication & authorization implementations
- Error handling
- Middleware
- Validation
- Testing

## Technical Documentation

For comprehensive technical details about the API architecture, implementation, and development guidelines:

- [Developer Documentation](DEVELOPER.md) - Technical details for developers
