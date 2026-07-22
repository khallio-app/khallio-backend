import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../constants/queue-names';
import { PrismaService } from 'src/lib/prisma.service';

@Processor(QUEUE_NAMES.WALLET)
export class WalletProcessor extends WorkerHost {
  private readonly logger = new Logger(WalletProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    const { organizationId, currency } = job.data;

    if (job.name !== 'create-wallet') return;

    try {
    //   const wallet = await this.prisma.wallet.create({
    //       organizationId,
    //       currency,
    //       availableBalance: 0,
    //       totalEarned: 0,
    //       totalWithdrawn: 0,
    //       status: 'active',
    //   });
    //   this.logger.log(`Wallet ready for org ${organizationId}: ${wallet.id}`);
    //   return wallet;
    } catch (err) {
      this.logger.error(
        `Wallet creation failed for org ${organizationId} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`,
        err.stack,
      );
      throw err;
    }
  }
}
