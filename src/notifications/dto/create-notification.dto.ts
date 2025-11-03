/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { NotificationChannel } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification channel (email, sms, inapp)',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Recipient (email, phone number, or user ID)',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  @ValidateIf((o) => o.channel === NotificationChannel.EMAIL)
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({
    description: 'Subject/title of the notification',
    example: 'Welcome to our platform',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    description: 'Plain text message',
    example: 'Hello, welcome to our platform!',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: 'HTML message (for email)',
    example: '<h1>Welcome!</h1><p>Hello, welcome to our platform!</p>',
  })
  @IsString()
  @IsOptional()
  htmlMessage?: string;

  @ApiProperty({
    description: 'Additional payload data',
    example: { userId: '123', orderId: '456', template: 'welcome' },
  })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @ApiProperty({
    description: 'Schedule notification for later (ISO date string)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
