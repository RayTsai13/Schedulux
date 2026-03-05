# Schedulux

> A modern, multi-tenant appointment scheduling SaaS platform built for service-based businesses.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue.svg)](https://postgresql.org/)

## 🚀 Overview

Schedulux is a comprehensive appointment scheduling solution designed specifically for small to medium-sized service businesses. It supports complex scheduling patterns, multi-location management, and dual booking methods within a scalable architecture.

### 🎯 Key Features

- **Multi-Storefront Management** - Operate multiple business locations independently
- **Flexible Scheduling Rules** - Weekly, daily, and monthly patterns with priority-based overrides
- **Dual Booking Modes** - Request-based approval workflow + instant slot booking
- **Complete Audit Trails** - Regulatory compliance with immutable change history
- **Real-time Management** - Live appointment updates and conflict detection
- **Role-Based Access** - Vendor and client interfaces with appropriate permissions

### 🏢 Target Industries

- Hair Salons & Barbershops
- Medical & Dental Practices
- Consulting & Professional Services
- Fitness & Wellness Centers
- Massage & Spa Services

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Modern SPA with type safety |
| **Backend** | Node.js + Express + TypeScript | REST API server |
| **Database** | PostgreSQL 15+ | Advanced scheduling with JSONB support |
| **Styling** | TailwindCSS | Responsive utility-first design |
| **Auth** | JWT + bcrypt | Secure authentication system |
| **Validation** | Zod + express-validator | Client & server input validation |
| **Email** | SendGrid (@sendgrid/mail) | Transactional email (fire-and-forget) |
| **Rate Limiting** | express-rate-limit | Auth (10/15min) + API (100/15min) |

### Project Structure

```
schedulux/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config/         # Database and environment configuration
│   │   ├── middleware/     # Authentication and validation middleware
│   │   ├── models/         # Data access layer (Repository pattern)
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Helper functions and utilities
│   ├── migrations/         # Database schema migrations
│   └── scripts/           # Development and testing scripts
├── frontend/               # React SPA client
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route-based page components
│   │   └── services/       # API client and data fetching
└── docs/                  # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 15+
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/RayTsai13/Schedulux.git
   cd Schedulux
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Run database migrations
   psql -d schedulux_primary -f migrations/004_clean_schema.sql
   
   # Test the setup
   npm run test:connection
   npm run test:db
   
   # Start development server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedulux_primary
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Application Settings
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173

# Email (optional in dev — logs to console if unset)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@schedulux.com
SENDGRID_FROM_NAME=Schedulux
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3000/api
```

## 📖 API Documentation

### Authentication Endpoints

```bash
# Register new user
POST /api/auth/register
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "vendor"
}

# User login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Get current user profile
GET /api/auth/me
Authorization: Bearer <jwt_token>

# Request password reset (always returns 200)
POST /api/auth/forgot-password
{ "email": "john@example.com" }

# Reset password with token
POST /api/auth/reset-password
{ "token": "<reset_token>", "password": "NewPass123!" }
```

### Development Testing

The project includes comprehensive testing scripts:

```bash
# Test database connectivity and schema
npm run test:db

# Test TypeScript compilation and database connection
npm run test:connection

# Test authentication utilities
npm run test:auth

# Test API endpoints
npx ts-node scripts/test-auth-api.ts
```

## 🗃️ Database Schema

The application uses a sophisticated PostgreSQL schema optimized for scheduling operations:

### Core Tables

- **users** - Vendors, clients, and admin accounts with role-based access
- **storefronts** - Business locations with timezone and configuration support
- **services** - Service offerings per storefront with pricing and duration
- **schedule_rules** - Flexible availability patterns with priority-based overrides
- **appointments** - Dual-mode bookings with comprehensive status tracking
- **appointment_slots** - Predefined time slots for instant booking

### Advanced Features

- **JSONB columns** for flexible business hours and data storage
- **Exclusion constraints** for automatic appointment conflict prevention
- **Automatic triggers** for complete audit trail maintenance
- **Strategic indexing** optimized for scheduling queries (1-15ms response times)
- **Soft deletion** with `deleted_at` timestamps

## 🚦 Development Status

### ✅ Completed Features

**Backend**
- ✅ Express server with security middleware (CORS, rate limiting)
- ✅ PostgreSQL integration with connection pooling
- ✅ User authentication (register/login/profile/password reset)
- ✅ JWT token generation and verification
- ✅ Email notifications via SendGrid (fire-and-forget, dev-friendly no-op)
- ✅ Rate limiting (auth: 10/15min, API: 100/15min)
- ✅ Storefront, service, appointment, and drop management APIs
- ✅ Marketplace search with geolocation and filters
- ✅ Availability engine with timezone-aware scheduling
- ✅ Admin dashboard API

**Frontend**
- ✅ Complete UI with professional design system
- ✅ Authentication flow with form validation
- ✅ Password reset flow (forgot/reset pages)
- ✅ Multi-tab vendor dashboard
- ✅ Client appointment management
- ✅ Marketplace explore page with search/filters
- ✅ 4-step booking modal with drop pre-selection
- ✅ Reschedule modal with atomic cancel+rebook
- ✅ Admin dashboard with storefront verification
- ✅ Error boundary + 404 page
- ✅ Environment-based configuration

**Database**
- ✅ Production-ready schema (10 migrations)
- ✅ Advisory locks for race condition prevention
- ✅ Exclusion constraints for conflict prevention
- ✅ Optimized indexing for scheduling queries

### 🔄 Remaining

- Docker + Docker Compose containerization
- CI/CD pipeline (GitHub Actions → AWS ECR → ECS)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Use the established repository pattern for data access
- Implement comprehensive error handling
- Add appropriate JSDoc comments for complex business logic
- Test database changes with provided test scripts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the needs of small service-based businesses
- Designed for scalability and maintainability

## 📞 Support

For support, create an issue in this repository.

---

**Made with ❤️ for small businesses everywhere**