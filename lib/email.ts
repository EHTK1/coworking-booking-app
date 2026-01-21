// lib/email.ts - Email service abstraction

import { logger } from './logger';
import { monitoring } from './monitoring';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<void>;
}

/**
 * Console email provider for development
 * Logs emails to console instead of sending
 */
class ConsoleEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<void> {
    logger.info('Email sent (console)', {
      to: options.to,
      subject: options.subject,
    });
    console.log('\n=== EMAIL ===');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('\n--- Text ---');
    console.log(options.text);
    console.log('\n--- HTML ---');
    console.log(options.html);
    console.log('=============\n');
  }
}

/**
 * SMTP email provider placeholder
 * In production, implement this with nodemailer or similar
 */
class SMTPEmailProvider implements EmailProvider {
  private config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'noreply@coworking.com',
    };
  }

  async send(options: EmailOptions): Promise<void> {
    // TODO: Implement with nodemailer when needed
    // Example:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: this.config.host,
    //   port: this.config.port,
    //   auth: { user: this.config.user, pass: this.config.pass },
    // });
    // await transporter.sendMail({
    //   from: this.config.from,
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // });

    logger.info('Email sent (SMTP)', {
      to: options.to,
      subject: options.subject,
      provider: 'smtp',
    });
  }
}

/**
 * Email service with async, non-blocking sending
 */
class EmailService {
  private provider: EmailProvider;
  private enabled: boolean;

  constructor() {
    // Use console provider in development, SMTP in production
    this.provider = process.env.NODE_ENV === 'production' && process.env.SMTP_HOST
      ? new SMTPEmailProvider()
      : new ConsoleEmailProvider();

    // Email is optional - can be disabled via env var
    this.enabled = process.env.DISABLE_EMAILS !== 'true';

    if (!this.enabled) {
      logger.info('Email notifications disabled');
    }
  }

  /**
   * Send email asynchronously without blocking
   * Failures are logged but do not throw errors
   */
  async sendAsync(options: EmailOptions): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Fire and forget - don't await in calling code
    this.provider.send(options).catch((error) => {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
      }, error instanceof Error ? error : new Error(String(error)));

      monitoring.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          email: {
            to: options.to,
            subject: options.subject,
          },
        }
      );
    });
  }

  /**
   * Send reservation confirmation email
   */
  async sendReservationConfirmation(params: {
    to: string;
    name: string;
    date: Date;
    slot: 'MORNING' | 'AFTERNOON';
    reservationId: string;
  }): Promise<void> {
    const slotTime = params.slot === 'MORNING' ? '08:00-13:00' : '13:00-18:00';
    const formattedDate = params.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Desk Reservation Confirmed - ${formattedDate}`;

    const text = `
Hi ${params.name},

Your desk reservation has been confirmed!

Reservation Details:
- Date: ${formattedDate}
- Time Slot: ${params.slot} (${slotTime})
- Reservation ID: ${params.reservationId}

You can cancel this reservation anytime before the slot starts.

See you at the coworking space!

---
This is an automated message. Please do not reply.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Reservation Confirmed</h1>
    </div>
    <div class="content">
      <p>Hi ${params.name},</p>
      <p>Your desk reservation has been confirmed!</p>

      <div class="details">
        <h3>Reservation Details</h3>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time Slot:</strong> ${params.slot} (${slotTime})</p>
        <p><strong>Reservation ID:</strong> ${params.reservationId}</p>
      </div>

      <p>You can cancel this reservation anytime before the slot starts.</p>
      <p>See you at the coworking space!</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.sendAsync({ to: params.to, subject, text, html });
  }

  /**
   * Send reservation cancellation email
   */
  async sendReservationCancellation(params: {
    to: string;
    name: string;
    date: Date;
    slot: 'MORNING' | 'AFTERNOON';
    reservationId: string;
  }): Promise<void> {
    const slotTime = params.slot === 'MORNING' ? '08:00-13:00' : '13:00-18:00';
    const formattedDate = params.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Desk Reservation Cancelled - ${formattedDate}`;

    const text = `
Hi ${params.name},

Your desk reservation has been cancelled.

Cancelled Reservation:
- Date: ${formattedDate}
- Time Slot: ${params.slot} (${slotTime})
- Reservation ID: ${params.reservationId}

You can make a new reservation anytime.

---
This is an automated message. Please do not reply.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f44336; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reservation Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi ${params.name},</p>
      <p>Your desk reservation has been cancelled.</p>

      <div class="details">
        <h3>Cancelled Reservation</h3>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time Slot:</strong> ${params.slot} (${slotTime})</p>
        <p><strong>Reservation ID:</strong> ${params.reservationId}</p>
      </div>

      <p>You can make a new reservation anytime.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.sendAsync({ to: params.to, subject, text, html });
  }

  /**
   * Send reservation reminder email (24 hours before)
   * Supports both French and English
   */
  async sendReservationReminder(params: {
    to: string;
    name: string;
    date: Date;
    slot: 'MORNING' | 'AFTERNOON';
    reservationId: string;
    language?: 'fr' | 'en';
  }): Promise<void> {
    const lang = params.language || 'fr';
    const slotTime = params.slot === 'MORNING' ? '08:00-13:00' : '13:00-18:00';

    // Format date in locale
    const formattedDate = params.date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // French content
    if (lang === 'fr') {
      const subject = `Rappel : Réservation demain - ${formattedDate}`;

      const text = `
Bonjour ${params.name},

Ceci est un rappel amical concernant votre réservation de bureau demain !

Détails de la réservation :
- Date : ${formattedDate}
- Créneau : ${params.slot === 'MORNING' ? 'MATIN' : 'APRÈS-MIDI'} (${slotTime})
- Numéro de réservation : ${params.reservationId}

Vous pouvez annuler cette réservation à tout moment avant le début du créneau si vos plans changent.

À demain à l'espace de coworking !

---
Ceci est un message automatique. Merci de ne pas y répondre.
      `.trim();

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    .badge { display: inline-block; padding: 5px 10px; background: #FF9800; color: white; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Rappel de Réservation</h1>
    </div>
    <div class="content">
      <p>Bonjour ${params.name},</p>
      <p>Ceci est un rappel amical concernant votre réservation de bureau <strong>demain</strong> !</p>

      <div class="details">
        <h3>Détails de la réservation</h3>
        <p><strong>Date :</strong> ${formattedDate}</p>
        <p><strong>Créneau :</strong> <span class="badge">${params.slot === 'MORNING' ? 'MATIN' : 'APRÈS-MIDI'}</span> (${slotTime})</p>
        <p><strong>Numéro de réservation :</strong> ${params.reservationId}</p>
      </div>

      <p>Vous pouvez annuler cette réservation à tout moment avant le début du créneau si vos plans changent.</p>
      <p>À demain à l'espace de coworking !</p>
    </div>
    <div class="footer">
      <p>Ceci est un message automatique. Merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
      `.trim();

      await this.sendAsync({ to: params.to, subject, text, html });
    } else {
      // English content
      const subject = `Reminder: Desk Reservation Tomorrow - ${formattedDate}`;

      const text = `
Hi ${params.name},

This is a friendly reminder about your desk reservation tomorrow!

Reservation Details:
- Date: ${formattedDate}
- Time Slot: ${params.slot} (${slotTime})
- Reservation ID: ${params.reservationId}

You can cancel this reservation anytime before the slot starts if your plans change.

See you tomorrow at the coworking space!

---
This is an automated message. Please do not reply.
      `.trim();

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    .badge { display: inline-block; padding: 5px 10px; background: #FF9800; color: white; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Reservation Reminder</h1>
    </div>
    <div class="content">
      <p>Hi ${params.name},</p>
      <p>This is a friendly reminder about your desk reservation <strong>tomorrow</strong>!</p>

      <div class="details">
        <h3>Reservation Details</h3>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time Slot:</strong> <span class="badge">${params.slot}</span> (${slotTime})</p>
        <p><strong>Reservation ID:</strong> ${params.reservationId}</p>
      </div>

      <p>You can cancel this reservation anytime before the slot starts if your plans change.</p>
      <p>See you tomorrow at the coworking space!</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
      `.trim();

      await this.sendAsync({ to: params.to, subject, text, html });
    }
  }
}

export const emailService = new EmailService();
