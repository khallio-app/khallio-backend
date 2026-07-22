import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Wallet } from 'generated/prisma/client';
import { MyLoggerService } from 'src/lib/logger.service';
import { PrismaService } from 'src/lib/prisma.service';

@Processor('paymentQueue')
export class TransactionProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: MyLoggerService,
  ) {
    super();
  }
  async process(job: Job) {
    switch (job.data.event) {
      case 'charge.success':
        await this.handlePaymentSuccess(job.data);
        break;
      case 'charge.failed':
        await this.handlePaymentFailed(job.data);
        break;

      default:
        break;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted() {
    // console.log('It works');
  }

  private async handlePaymentSuccess(event: any) {
    const idempotencyKey = `paystack_${event.data.reference}_${event.event}`;
    try {
      await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.update({
          where: { paymentReference: event.data.reference },
          data: { paymentStatus: 'paid' },
        });

        const wallet = await tx.$queryRaw<Wallet>`
             SELECT * FROM "Wallet"
             WHERE "organizationId" = ${event.data.metadata.organizationId}
               AND "currency" = ${event.data.currency}
             FOR UPDATE`;

        const newBalance = wallet.availableBalance + event.data.amount / 100;

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'sale',
            amount: event.data.amount / 100,
            balanceAfter: newBalance,
            transactionId: transaction.id,
            status: 'completed',
            idempotencyKey,
            metadata: event,
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { availableBalance: newBalance },
        });
      });
    } catch (err) {
      if (
        err.code === 'P2002' &&
        err.meta?.target?.includes('idempotencyKey')
      ) {
        this.logger.log(`Duplicate webhook ignored: ${idempotencyKey}`);
        return;
      }
      this.logger.error(
        `Error handling payment success on reference(${event.data.reference})`,
        err.trace,
        'HANDLE_PAYMENT_SUCCESS_PAYMENT_QUEUE',
      );
      throw err;
    }
  }
  private async handlePaymentFailed(data: any) {}
}
