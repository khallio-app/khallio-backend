import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';
import { PaystackService } from 'src/lib/paystack.service';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TransactionProcessor } from './transaction.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'paymentQueue' })],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionProcessor,
    PrismaService,
    MyLoggerService,
    PaystackService,
    ConfigService,
  ],
})
export class TransactionModule {}
