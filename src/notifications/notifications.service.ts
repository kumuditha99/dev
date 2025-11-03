/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull, Or } from 'typeorm';
import {
  Notification,
  NotificationStatus,
  NotificationChannel,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { EmailService } from './channels/email/email.service';
import { InappService } from './channels/inapp/inapp.service';
// import { SmsService } from './channels/sms/sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly useExponentialBackoff: boolean;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private inAppService: InappService,
    private configService: ConfigService,
    // private smsService: SmsService,
  ) {
    // Load retry configuration from environment variables
    this.maxRetries = parseInt(
      this.configService.get<string>('MAX_RETRIES', '3'),
      10,
    );
    this.retryDelayMs = parseInt(
      this.configService.get<string>('RETRY_DELAY_MS', '60000'),
      10,
    ); // Default 1 minute
    this.useExponentialBackoff =
      this.configService.get<string>('USE_EXPONENTIAL_BACKOFF', 'true') ===
      'true';

    this.logger.log(
      `Retry configuration: maxRetries=${this.maxRetries}, retryDelayMs=${this.retryDelayMs}, exponentialBackoff=${this.useExponentialBackoff}`,
    );
  }

  // Queue a notification for processing
  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      scheduledAt: createNotificationDto.scheduledAt
        ? new Date(createNotificationDto.scheduledAt)
        : undefined,
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Notification queued: ${saved.id} (${saved.channel})`);
    return saved;
  }

  // Process pending notifications (called by cron job)
  async processQueue(limit: number = 10): Promise<void> {
    const now = new Date();
    const pendingNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduledAt: Or(IsNull(), LessThanOrEqual(now)),
      },
      take: limit,
      order: { createdAt: 'ASC' },
    });

    // Filter notifications that are ready to be retried (respect nextRetryAt)
    const readyToProcess = pendingNotifications.filter(
      (notification) =>
        !notification.nextRetryAt || notification.nextRetryAt <= now,
    );

    this.logger.log(
      `Processing ${readyToProcess.length} pending notifications (${pendingNotifications.length} total pending)`,
    );

    for (const notification of readyToProcess) {
      await this.processNotification(notification);
    }
  }

  // Process a single notification
  async processNotification(notification: Notification): Promise<void> {
    notification.status = NotificationStatus.PROCESSING;
    await this.notificationRepository.save(notification);

    try {
      await this.sendNotification(notification);

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      notification.errorMessage = '';
      await this.notificationRepository.save(notification);

      this.logger.log(`Notification sent: ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}:`,
        error,
      );

      notification.retryCount += 1;
      notification.errorMessage = error.message || 'Unknown error';

      if (notification.retryCount >= this.maxRetries) {
        notification.status = NotificationStatus.FAILED;
        notification.nextRetryAt = undefined;
        this.logger.warn(
          `Notification ${notification.id} failed after ${notification.retryCount} attempts`,
        );
      } else {
        notification.status = NotificationStatus.PENDING;
        notification.nextRetryAt = this.calculateNextRetryTime(
          notification.retryCount,
        );
        this.logger.log(
          `Notification ${notification.id} will retry at ${notification.nextRetryAt.toISOString()} (attempt ${notification.retryCount + 1}/${this.maxRetries})`,
        );
      }

      await this.notificationRepository.save(notification);
    }
  }

  // Route notification to appropriate channel service
  private async sendNotification(notification: Notification): Promise<void> {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(notification);
        break;
      case NotificationChannel.IN_APP:
        await this.sendInAppNotification(notification);
        break;
      // case NotificationChannel.SMS:
      //   await this.sendSmsNotification(notification);
      //   break;
      default:
        throw new Error(`Unsupported channel: ${notification.channel}`);
    }
  }

  // Send email notification
  private async sendEmailNotification(
    notification: Notification,
  ): Promise<void> {
    if (!notification.recipient || !notification.subject) {
      throw new Error('Email requires recipient and subject');
    }

    await this.emailService.sendEmail(
      notification.recipient,
      notification.subject,
      notification.htmlMessage || notification.message || '',
      notification.message,
    );
  }

  // Send in-app notification
  private async sendInAppNotification(
    notification: Notification,
  ): Promise<void> {
    if (!notification.recipient || !notification.subject) {
      throw new Error(
        'In-app notification requires recipient (user ID) and subject',
      );
    }

    await this.inAppService.sendInappNotification(
      notification.recipient,
      notification.subject,
      typeof notification.payload === 'string' ||
        typeof notification.payload === 'undefined'
        ? { value: notification.payload ?? '' }
        : notification.payload,
      notification.message,
    );
  }
  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  // Get all notifications
  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Send SMS notification

  // private async sendSmsNotification(notification: Notification): Promise<void> {
  //   // TODO: Implement SMS service
  //   // Validate required fields for SMS
  //   if (!notification.recipient || !notification.message) {
  //     throw new Error('SMS requires recipient (phone) and message');
  //   }

  //   // await this.smsService.sendSms(
  //   //   notification.recipient,
  //   //   notification.message,
  //   // );
  //   throw new Error('SMS service not yet implemented');
  // }

  // Calculate next retry time with exponential backoff
  private calculateNextRetryTime(retryCount: number): Date {
    const now = new Date();

    if (this.useExponentialBackoff) {
      const exponentialDelay = this.retryDelayMs * Math.pow(2, retryCount);
      return new Date(now.getTime() + exponentialDelay);
    } else {
      return new Date(now.getTime() + this.retryDelayMs);
    }
  }
}
