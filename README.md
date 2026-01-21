# Coworking Desk Booking System

A full-stack web application for managing coworking space desk reservations with half-day booking slots.

## Features

### Member Features
- Email/password authentication
- Book desks for half-day slots (Morning: 08:00-13:00, Afternoon: 13:00-18:00)
- View upcoming reservations
- Cancel reservations (before slot start time)
- Automatic overbooking prevention
- Email notifications for confirmations and cancellations

### Admin Features
- System dashboard with statistics
- View all reservations with filters
- Manage users
- Configure system settings (total desks, slot hours)
- Role-based access control

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Session-based with HTTP-only cookies
- **Security**: PBKDF2 password hashing, role-based access control
- **Notifications**: Transactional email notifications (optional, non-blocking)
- **Internationalization**: next-intl with French as default locale

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/coworking_booking?schema=public"
NODE_ENV="development"

# Optional - Email notifications (disabled by default in development)
DISABLE_EMAILS="false"
```

For production email setup, see the [Email Notifications](#email-notifications) section below.

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This will:
- Create the database schema
- Generate Prisma Client

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## First Time Setup

### Create Admin User

Use the CLI script to create the first admin user:

```bash
npm run create-admin
```

This interactive script will prompt you for:
- Admin name
- Admin email
- Admin password (minimum 8 characters)

The script validates input and ensures no duplicate accounts are created.

### Create Test Users

Register members via `/register` page. All new registrations default to `MEMBER` role.

## Project Structure

```
├── app/
│   ├── admin/              # Admin UI pages
│   │   ├── page.tsx       # Dashboard
│   │   ├── reservations/  # Reservations list
│   │   ├── users/         # Users list
│   │   └── settings/      # System settings
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── reservations/  # Member reservation endpoints
│   │   └── admin/         # Admin-only endpoints
│   ├── book/              # Booking page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── reservations/      # Member reservations page
├── lib/                   # Utilities and services
│   ├── auth.ts           # Auth middleware
│   ├── session.ts        # Session management
│   ├── password.ts       # Password hashing
│   ├── prisma.ts         # Prisma client
│   ├── client-auth.ts    # Client-side auth
│   ├── api-client.ts     # API client functions
│   ├── rate-limit.ts     # Rate limiting
│   ├── logger.ts         # Structured logging
│   ├── monitoring.ts     # Error monitoring (Sentry-ready)
│   └── api-utils.ts      # API utilities
├── prisma/
│   └── schema.prisma     # Database schema
├── types.ts              # TypeScript type definitions
└── ReservationService.ts # Core booking business logic
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Member APIs
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/me` - Get my reservations
- `POST /api/reservations/[id]/cancel` - Cancel reservation

### Admin APIs
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/reservations` - All reservations (with filters)
- `GET /api/admin/users` - All users
- `GET /api/admin/settings` - Get settings
- `PATCH /api/admin/settings` - Update settings

## Business Rules

### Booking Rules
- Half-day slots only (MORNING or AFTERNOON)
- Capacity-based: limited by `totalDesks` setting
- No duplicate bookings by same user
- Only CONFIRMED reservations count toward capacity

### Cancellation Rules
- Allowed until slot start time
- MORNING: can cancel until 08:00 on booking date
- AFTERNOON: can cancel until 13:00 on booking date
- Soft delete: status changes to CANCELLED

### Access Control
- Members: can only manage their own reservations
- Admins: full system access, cannot cancel others' reservations (by design)

## Development Commands

```bash
npm run dev                 # Start development server
npm run build               # Build for production
npm run start               # Start production server
npm run db:migrate          # Run database migrations (development)
npm run db:migrate:deploy   # Deploy migrations (production)
npm run db:generate         # Generate Prisma Client
npm run db:push             # Push schema changes (no migration)
npm run db:studio           # Open Prisma Studio (database GUI)
npm run create-admin        # Create first admin user
```

## Email Notifications

The application sends transactional email notifications for reservation actions. Email sending is:
- **Asynchronous and non-blocking**: Email failures do NOT affect booking success
- **Optional**: Can be completely disabled via environment variable
- **Provider-agnostic**: Easy to swap email providers

### Email Types

1. **Reservation Confirmation**: Sent when a desk is successfully booked
2. **Reservation Cancellation**: Sent when a reservation is cancelled

### Development Setup

In development, emails are logged to the console instead of being sent:

```env
# .env
DISABLE_EMAILS="false"  # Set to "true" to disable email logging
```

When running the app, you'll see email output in the terminal like:

```
=== EMAIL ===
To: user@example.com
Subject: Desk Reservation Confirmed - Monday, January 20, 2026

--- Text ---
Hi John Doe,
Your desk reservation has been confirmed!
...
=============
```

### Production Setup

For production email sending, configure SMTP settings in your `.env`:

```env
# Required for production email sending
SMTP_HOST="smtp.sendgrid.net"          # Your SMTP server
SMTP_PORT="587"                         # Usually 587 for TLS
SMTP_USER="apikey"                      # SMTP username
SMTP_PASS="your-api-key"                # SMTP password/API key
SMTP_FROM="noreply@yourcompany.com"     # From email address

# Optional: Disable all email notifications
DISABLE_EMAILS="false"
```

### Supported Email Providers

The current implementation includes a placeholder for SMTP. To use a specific provider:

**Option 1: SMTP (Universal)**
- Works with SendGrid, Mailgun, AWS SES, etc.
- Install `nodemailer`: `npm install nodemailer`
- Uncomment SMTP implementation in [lib/email.ts](lib/email.ts)

**Option 2: Provider SDK**
- Modify `EmailProvider` implementation in [lib/email.ts](lib/email.ts)
- Install provider SDK (e.g., `@sendgrid/mail`)
- Replace SMTP logic with provider-specific API calls

### Email Failure Handling

- Email failures are logged via structured logging
- Email failures are captured in error monitoring (if configured)
- Booking operations always succeed regardless of email status
- No retries (to avoid blocking requests)

### Disabling Emails

To completely disable email notifications:

```env
DISABLE_EMAILS="true"
```

## Internationalization (i18n)

The application supports multiple languages using `next-intl`.

### Current Setup

- **Default Language**: French (fr)
- **Additional Languages**: English (en) translations available
- **Implementation**: Fully internationalized UI with no hardcoded strings

### Language Structure

Translation files are located in the `locales/` directory:
- `locales/fr.json` - French translations (default)
- `locales/en.json` - English translations

### Translation Keys

All UI text is organized by feature:
```
auth/          # Authentication pages (login, register)
reservations/  # Member reservations
booking/       # Desk booking
admin/         # Admin panel (dashboard, users, settings)
errors/        # API error messages
common/        # Shared UI text
```

### Adding New Languages

To add a new language:

1. Create a new translation file in `locales/` (e.g., `locales/de.json`)
2. Copy the structure from `locales/fr.json` or `locales/en.json`
3. Translate all keys to the new language
4. Update `i18n/request.ts` to support dynamic locale selection (if needed)

### Server-Side Translations

API error messages are translated server-side using `lib/server-i18n.ts`, ensuring consistent French error messages by default.

### Date Formatting

Dates are formatted using the French locale (`fr-FR`) by default:
```typescript
new Date(dateStr).toLocaleDateString('fr-FR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
```

## Production Deployment

### Pre-Deployment Checklist

Before deploying to production, ensure you have completed the following:

#### 1. Environment Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure production `DATABASE_URL`
- [ ] (Optional) Configure SMTP settings for email notifications
- [ ] (Optional) Set `SENTRY_DSN` for error monitoring
- [ ] Review all environment variables for security

#### 2. Database Setup
- [ ] Ensure PostgreSQL database is running and accessible
- [ ] Run migrations: `npm run db:migrate:deploy` (NOT `db:push`)
- [ ] Verify database schema matches expected state
- [ ] Create first admin user: `npm run create-admin`

#### 3. Security Hardening
- [ ] Rate limiting configured (automatically enabled on auth/admin endpoints)
- [ ] HTTPS enabled (required for secure cookies)
- [ ] Database credentials secured
- [ ] Session cookies configured with secure flags
- [ ] Review CORS settings if applicable

#### 4. Monitoring & Logging
- [ ] Structured logging enabled (automatic in production)
- [ ] Error monitoring configured (Sentry or alternative)
- [ ] Log aggregation setup (recommended: CloudWatch, Datadog, etc.)
- [ ] Health check endpoint configured

#### 5. Performance & Scalability
- [ ] Consider upgrading rate limiting to Redis (current: in-memory)
- [ ] Database connection pooling configured
- [ ] CDN configured for static assets (if applicable)
- [ ] Load balancer setup (if multi-instance)

#### 6. Build & Deploy
```bash
# Install dependencies
npm install --production

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# Build application
npm run build

# Start server
npm run start
```

### Environment Variables for Production

```env
# Required
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
NODE_ENV="production"

# Optional - Email Notifications
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@yourcompany.com"
DISABLE_EMAILS="false"

# Optional - Error Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

### Production-Ready Features

- **Rate Limiting**: Automatic protection on auth (5 req/15min) and admin (100 req/min) endpoints
- **Structured Logging**: JSON-formatted logs in production for easy parsing
- **Error Monitoring**: Sentry-ready integration (requires `@sentry/nextjs` package and `SENTRY_DSN`)
- **Secure Sessions**: HTTP-only cookies with SameSite protection
- **Migration-Based Schema**: Proper migrations for production deployment
- **Admin CLI**: Secure first-admin creation via interactive script
- **Email Notifications**: Async transactional emails for reservations (optional, non-blocking)

### Post-Deployment Verification

After deployment, verify:
1. Application is accessible at production URL
2. Login/registration works correctly
3. Database migrations applied successfully
4. Admin user can access admin panel
5. Rate limiting is functioning (test with multiple rapid requests)
6. Logs are being captured correctly
7. Error monitoring is receiving test events (if configured)
8. Email notifications are being sent (if configured) or logged appropriately

## Security Features

- **Password Security**: PBKDF2 with 100,000 iterations, SHA-512
- **Session Security**: HTTP-only cookies, SameSite=lax, 7-day expiration
- **Access Control**: Role-based (ADMIN/MEMBER) enforced on all routes
- **SQL Injection Protection**: Parameterized queries via Prisma
- **XSS Protection**: React's built-in escaping + HTTP-only cookies
- **Rate Limiting**: 5 requests per 15 minutes on auth endpoints, 100 requests per minute on admin endpoints
- **Structured Logging**: All API requests/responses logged with context for audit trails
- **Error Monitoring**: Integration ready for Sentry or similar services

## License

MIT
