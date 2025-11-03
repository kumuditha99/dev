/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InappService {
  private readonly logger = new Logger(InappService.name);

  async sendInappNotification(
    userId: string,
    subject: string,
    payload: Record<string, any>,
    message?: string,
  ): Promise<void> {
    this.logger.debug(
      `In-app notification sent to user ${userId} , subject: "${subject}", message: "${message}", payload: ${JSON.stringify(payload)}`,
    );
  }
}

// TODO:
// - Emit to WebSocket gateway so the frontend receives it in real-time
// - Or expose an API for clients to poll unread notifications
