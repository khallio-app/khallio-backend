import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './constants/queue-names';
import { WalletQueueService } from './wallet/wallet.service';
import { WalletProcessor } from './wallet/wallet.processor';
import { PrismaService } from 'src/lib/prisma.service';


@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.WALLET },
      { name: QUEUE_NAMES.PAYMENT },
      { name: QUEUE_NAMES.EMAIL },
    ),
  ],
  providers: [
    WalletQueueService,
    WalletProcessor,
    PrismaService
    // PaymentQueueService,
    // PaymentProcessor,
    // EmailQueueService,
    // EmailProcessor,
  ],
//   exports: [WalletQueueService, PaymentQueueService, EmailQueueService],
  exports: [WalletQueueService],
})
export class QueuesModule {}
