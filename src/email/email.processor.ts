import { Job } from 'bullmq';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Resend } from 'resend';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';

@Processor('email', { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  resend: any;
  constructor(private readonly config: ConfigService) {
    super();
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }
  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'verification':
        await this.sendVerificationEmail(job.data);
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

  private async sendVerificationEmail(data: {
    email: string;
    otp: string;
    type: string;
  }) {
    const { email, otp, type } = data;
    const subject =
      type === 'sign-in'
        ? 'Your sign-in code'
        : type === 'change-email'
          ? 'Confirm your new email'
          : type === 'forget-password'
            ? 'Your password reset code'
            : 'Your verification code';
    const html = `<p>Your ${subject.toLowerCase()} is:</p><strong>${otp}</strong>`;

    try {
      const { data: responseData, error } = await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error(error.message);
      }

      return responseData;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }
}
