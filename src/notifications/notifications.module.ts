import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { EmailModule } from './channels/email/email.module';
import { QueueProcessor } from './schedulers/queue.processor';
import { InappModule } from './channels/inapp/inapp.module';
// import { SmsModule } from './channels/sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    ScheduleModule.forRoot(),
    EmailModule,
    InappModule,
    // SmsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, QueueProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
