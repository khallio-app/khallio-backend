import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../constants/queue-names';

@Injectable()
export class WalletQueueService {
  constructor(@InjectQueue(QUEUE_NAMES.WALLET) private readonly queue: Queue) {}

  async createWallet(data: any) {
    return this.queue.add('create-wallet', data, {
      jobId: `create-wallet-${data.organizationId}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}
