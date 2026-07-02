import { Job } from 'bullmq';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Resend } from 'resend';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';

@Processor('email', { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  resend: any;
  constructor(
    private readonly config: ConfigService,
  ) {
    super();
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }
  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'confirmation':
        await this.sendConfirmationEmail(job.data);
        break;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFaild(job: Job) {
    console.log(`Job ${job.id} failed`);
  }

  private async sendConfirmationEmail(data: {
    email: string;
    token: string;
  }) {
    const { email, token } = data;
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: ['ericodejafidelis@gmail.com'], // I can only test with my personal email on resend
        subject: 'Email verification code',
        html: `<strong>This is your verificaiton ${token}</strong>`,
      });

      if (error) {
        console.error(error.message);
      }

    } catch (err) {
      throw new Error(err.message);
    }
  }
}
