import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/lib/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'email' }),
  ],
  providers: [EmailService, EmailProcessor, ConfigService, PrismaService],
})
export class EmailModule {}
