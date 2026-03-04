import sgMail from '@sendgrid/mail';

/**
 * EmailService — Fire-and-forget transactional email
 *
 * Key design decisions:
 * - Static methods only (matches existing service pattern)
 * - NEVER throws — all errors are logged and swallowed
 * - NEVER awaited in calling code — fire-and-forget
 * - No-ops gracefully when SENDGRID_API_KEY is unset (dev-friendly)
 */
export class EmailService {
    private static initialized = false;

    private static init(): void {
        if (!this.initialized && process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            this.initialized = true;
        }
    }

    /** Returns true if SendGrid is configured */
    private static isConfigured(): boolean {
        return !!process.env.SENDGRID_API_KEY;
    }

    /** Core send method — catches all errors, never throws */
    private static async send(to: string, subject: string, html: string): Promise<void> {
        if (!this.isConfigured()) {
            console.log(`📧 [EmailService] Would send to ${to}: "${subject}"`);
            console.log(`📧 [EmailService] (Set SENDGRID_API_KEY to send real emails)`);
            return;
        }

        this.init();

        try {
            await sgMail.send({
                to,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@schedulux.com',
                    name: process.env.SENDGRID_FROM_NAME || 'Schedulux',
                },
                subject,
                html: this.wrapTemplate(html),
            });
            console.log(`📧 [EmailService] Sent "${subject}" to ${to}`);
        } catch (error: any) {
            console.error(`📧 [EmailService] Failed to send "${subject}" to ${to}:`, error?.message || error);
        }
    }

    /** Consistent email layout wrapper with inline CSS */
    private static wrapTemplate(content: string): string {
        return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb;">
          ${content}
        </div>
        <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Schedulux. All rights reserved.</p>
        </div>
      </div>
    `;
    }

    // ================================================================
    // PUBLIC METHODS — called fire-and-forget (no await)
    // ================================================================

    /** Welcome email after registration */
    static sendWelcome(email: string, firstName: string): void {
        this.send(email, 'Welcome to Schedulux! 🎉', `
      <h1 style="color: #111827; font-size: 24px; margin: 0 0 16px;">Welcome, ${firstName}!</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Your Schedulux account is ready. You can now browse and book appointments
        with talented professionals in your area.
      </p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/explore"
         style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Browse Marketplace
      </a>
    `);
    }

    /** Booking confirmation to client */
    static sendAppointmentConfirmation(
        email: string,
        details: { serviceName: string; storefrontName: string; dateTime: string; price?: number }
    ): void {
        const priceLine = details.price ? `<p style="color: #4b5563; margin: 4px 0;">💰 Price: $${details.price}</p>` : '';
        this.send(email, `Booking Confirmed — ${details.serviceName}`, `
      <h1 style="color: #111827; font-size: 24px; margin: 0 0 16px;">Booking Request Sent!</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        Your appointment request has been submitted. The vendor will review and confirm it shortly.
      </p>
      <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
        <p style="color: #111827; font-weight: 600; margin: 0 0 8px;">📋 Details</p>
        <p style="color: #4b5563; margin: 4px 0;">🏪 ${details.storefrontName}</p>
        <p style="color: #4b5563; margin: 4px 0;">✂️ ${details.serviceName}</p>
        <p style="color: #4b5563; margin: 4px 0;">📅 ${details.dateTime}</p>
        ${priceLine}
      </div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-appointments"
         style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        View My Appointments
      </a>
    `);
    }

    /** New booking notification to vendor */
    static sendNewBookingNotification(
        email: string,
        details: { clientName: string; serviceName: string; storefrontName: string; dateTime: string }
    ): void {
        this.send(email, `New Booking Request — ${details.serviceName}`, `
      <h1 style="color: #111827; font-size: 24px; margin: 0 0 16px;">New Booking Request!</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        ${details.clientName} has requested an appointment at ${details.storefrontName}.
      </p>
      <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
        <p style="color: #111827; font-weight: 600; margin: 0 0 8px;">📋 Details</p>
        <p style="color: #4b5563; margin: 4px 0;">👤 ${details.clientName}</p>
        <p style="color: #4b5563; margin: 4px 0;">✂️ ${details.serviceName}</p>
        <p style="color: #4b5563; margin: 4px 0;">📅 ${details.dateTime}</p>
      </div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
         style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Review Request
      </a>
    `);
    }

    /** Status change email to client (confirmed, cancelled, declined) */
    static sendAppointmentStatusChange(
        email: string,
        details: { serviceName: string; storefrontName: string; dateTime: string; newStatus: string; vendorNotes?: string }
    ): void {
        const statusLabels: Record<string, { emoji: string; title: string; message: string }> = {
            confirmed: {
                emoji: '✅',
                title: 'Appointment Confirmed',
                message: 'Great news! Your appointment has been confirmed by the vendor.',
            },
            cancelled: {
                emoji: '❌',
                title: 'Appointment Cancelled',
                message: 'Your appointment has been cancelled.',
            },
            declined: {
                emoji: '⛔',
                title: 'Appointment Declined',
                message: 'Unfortunately, the vendor was unable to accommodate your booking request.',
            },
        };

        const status = statusLabels[details.newStatus] || {
            emoji: '📋',
            title: `Appointment ${details.newStatus}`,
            message: `Your appointment status has been updated to "${details.newStatus}".`,
        };

        const notesLine = details.vendorNotes
            ? `<p style="color: #4b5563; margin: 16px 0 0; font-style: italic;">Note from vendor: "${details.vendorNotes}"</p>`
            : '';

        this.send(email, `${status.emoji} ${status.title} — ${details.serviceName}`, `
      <h1 style="color: #111827; font-size: 24px; margin: 0 0 16px;">${status.emoji} ${status.title}</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        ${status.message}
      </p>
      <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
        <p style="color: #4b5563; margin: 4px 0;">🏪 ${details.storefrontName}</p>
        <p style="color: #4b5563; margin: 4px 0;">✂️ ${details.serviceName}</p>
        <p style="color: #4b5563; margin: 4px 0;">📅 ${details.dateTime}</p>
        ${notesLine}
      </div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-appointments"
         style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        View My Appointments
      </a>
    `);
    }

    /** Password reset email with token link */
    static sendPasswordReset(email: string, token: string): void {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
        this.send(email, 'Reset Your Password — Schedulux', `
      <h1 style="color: #111827; font-size: 24px; margin: 0 0 16px;">Reset Your Password</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        We received a request to reset your password. Click the button below to choose a new one.
        This link expires in 1 hour.
      </p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Reset Password
      </a>
      <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `);
    }
}
