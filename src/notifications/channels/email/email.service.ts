/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  async sendMail(opts: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<void> {
    if (process.env.EMAIL_SEND == 'OFF') {
      this.logger.debug('EMAIL_SEND = OFF');
      return;
    }

    const from = opts.from ?? process.env.FROM_EMAIL;
    try {
      const info = await this.transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      this.logger.debug(`Email sent: ${info.messageId}`);
    } catch (err) {
      this.logger.error('Failed to send email', err);
      throw err;
    }
  }

  // helper for sending general emails
  async sendEmail(
    to: string,
    subject: string,
    message: string,
    text?: string,
  ): Promise<void> {
    const html = message ? `<div>${message}</div>` : undefined;
    await this.sendMail({
      to,
      subject,
      html,
      text: text ?? message ?? 'Email content',
    });
  }
}
