import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // Process pending notifications every 30 seconds
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleProcessQueue() {
    this.logger.debug('Processing notification queue...');
    try {
      await this.notificationsService.processQueue(10); // Process 10 at a time
    } catch (error) {
      this.logger.error('Error processing notification queue:', error);
    }
  }
}
