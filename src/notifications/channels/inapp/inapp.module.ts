import { Module } from '@nestjs/common';
import { InappService } from './inapp.service';

@Module({
  providers: [InappService],
  exports: [InappService],
})
export class InappModule {}
