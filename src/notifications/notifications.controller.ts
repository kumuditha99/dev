import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBasicAuth,
} from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BasicAuthGuard } from '../auth/basic-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBasicAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Queue a notification for sending' })
  @ApiBody({
    type: CreateNotificationDto,
    examples: {
      email: {
        summary: 'Email notification',
        value: {
          channel: 'email',
          recipient: 'test@example.com',
          subject: 'Welcome!',
          message: 'Hello, welcome to our platform!',
          htmlMessage:
            '<h1>Welcome!</h1><p>Hello, welcome to our platform!</p>',
          payload: { template: 'welcome' },
        },
      },
      inapp: {
        summary: 'Inapp notification',
        value: {
          channel: 'inapp',
          recipient: 'user_123',
          subject: 'New message!',
          message: 'You have a new message',
          payload: { link: '/messages/42' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Notification queued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    this.logger.log(
      `Queueing notification: ${createNotificationDto.channel} to ${createNotificationDto.recipient}`,
    );

    const notification = await this.notificationsService.create(
      createNotificationDto,
    );

    return {
      ok: true,
      id: notification.id,
      status: notification.status,
      message: 'Notification queued successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  async findAll() {
    return this.notificationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }
}
