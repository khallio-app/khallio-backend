import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async sendConfirmationEmail(data: {
    email: string;
    token: string;
  }) {
    await this.emailQueue.add('confirmation', data, {
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}
