# Reservation Reminder Cron Job

## Overview

This system automatically sends reminder emails to users 24 hours before their desk reservations.

## How It Works

1. **Database Field**: Each reservation has a `reminderSentAt` timestamp field
2. **Reminder Service**: Finds reservations happening in ~24 hours that haven't been reminded
3. **Email Service**: Sends bilingual (FR/EN) reminder emails
4. **Cron Endpoint**: API endpoint that triggers the reminder job
5. **Duplicate Prevention**: Only sends one reminder per reservation (via `reminderSentAt`)

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Cron job authentication (optional but recommended for production)
CRON_SECRET=your-secret-token-here
```

Generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Choose a Cron Service

#### Option A: Vercel Cron Jobs (Recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

This runs every 4 hours. Vercel automatically authenticates cron requests.

#### Option B: GitHub Actions

Create `.github/workflows/cron-reminders.yml`:
```yaml
name: Send Reservation Reminders
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call reminder endpoint
        run: |
          curl -X POST https://your-domain.com/api/cron/send-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to your GitHub repository secrets.

#### Option C: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Configure:
- URL: `https://your-domain.com/api/cron/send-reminders`
- Method: POST
- Schedule: Every 4 hours (`0 */4 * * *`)
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

#### Option D: System Cron (Linux/macOS)

Add to crontab (`crontab -e`):
```bash
0 */4 * * * curl -X POST https://your-domain.com/api/cron/send-reminders -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Test the Endpoint

```bash
# Test locally (development)
curl -X POST http://localhost:3000/api/cron/send-reminders

# Test with authentication
curl -X POST http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer your-secret-token"

# Get endpoint info
curl http://localhost:3000/api/cron/send-reminders
```

Expected response:
```json
{
  "success": true,
  "sentCount": 5,
  "duration": 1234,
  "timestamp": "2024-01-21T10:00:00.000Z"
}
```

## Recommended Schedule

- **Production**: Every 4-6 hours
- **Development**: Manual testing only

The 23-25 hour window ensures reminders are sent even if the job runs irregularly.

## Monitoring

Check logs for:
- `Cron job started: send-reminders`
- `Found X reservations needing reminders`
- `Reminder sent` (for each successful email)
- `Cron job completed: send-reminders`

## Troubleshooting

### No reminders being sent

1. Check if there are reservations tomorrow:
   ```sql
   SELECT * FROM "Reservation"
   WHERE date = CURRENT_DATE + INTERVAL '1 day'
   AND status = 'CONFIRMED'
   AND "reminderSentAt" IS NULL;
   ```

2. Check email service logs in console

3. Verify SMTP settings (if using production email)

### Duplicate reminders

- Should not happen - `reminderSentAt` prevents duplicates
- If it occurs, check database constraints and indexes

### 401 Unauthorized

- Verify `CRON_SECRET` matches in both `.env` and cron service
- Check `Authorization` header format: `Bearer <token>`

## Email Examples

### French (Default)
**Subject**: Rappel : Réservation demain - [Date]
**Content**: Reminder about tomorrow's reservation with full details

### English
**Subject**: Reminder: Desk Reservation Tomorrow - [Date]
**Content**: Reminder about tomorrow's reservation with full details

## Database Schema

```prisma
model Reservation {
  // ... other fields
  reminderSentAt DateTime?  // Tracks when reminder was sent

  @@index([date, status, reminderSentAt])  // Optimized for reminder queries
}
```

## Security Notes

1. **Always set CRON_SECRET in production**
2. Never commit secrets to git
3. Use HTTPS for cron endpoints
4. Consider IP allowlisting for extra security
5. Monitor for unusual activity in logs

## Future Enhancements

Potential improvements (not implemented):
- User preferences for reminder timing
- SMS reminders
- Multiple reminder intervals (24h, 2h before)
- Language preference per user
- Reminder statistics dashboard
