import {
  HttpException,
  Injectable,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { MyLoggerService } from 'src/lib/logger.service';
import { PaystackService } from 'src/lib/paystack.service';
import { PrismaService } from 'src/lib/prisma.service';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TransactionService {
  constructor(
    private readonly logger: MyLoggerService,
    private readonly paystack: PaystackService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('paymentQueue') private readonly paymentQueue: Queue,
  ) {}

  async initializeTransaction(
    amount: number,
    email: string,
    productId: string,
  ) {
    try {
      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id: productId },
      });
      const paystackData = await this.paystack.intializeTransaction(
        email,
        amount * 100,
        product.organizationId,
      );
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      const transaction = await this.prisma.transaction.create({
        data: {
          userId: user?.id,
          productId,
          email,
          totalAmount: amount,
          paymentReference: paystackData.data.reference,
          paymentProvider: 'paystack',
        },
      });

      this.logger.log(
        `Transaction initialized successfully: ID ${transaction.id} for user ID ${transaction.userId} (Amount: ${transaction.totalAmount} ${transaction.currency}, Ref: ${transaction.paymentReference})`,
      );

      return {
        transactionId: transaction.id,
        totalAmount: transaction.totalAmount,
        currency: transaction.currency,
        paymentReference: paystackData.data.reference,
        authorization_url: paystackData.data.authorization_url,
      };
    } catch (error) {
      this.logger.error(
        'Error initializing transaction: ' + error.message,
        '',
        'INITIALIZE_TRANSACTION',
      );
      throw new HttpException(
        'Error initializing transaction: ' + error.message,
        error.status || 500,
      );
    }
  }

  async handleWebhook(req: RawBodyRequest<Request>) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const hash = crypto
        .createHmac('sha512', this.config.get<string>('PAYSTACK_API_KEY')!)
        .update(req.rawBody!)
        .digest('hex');

      if (hash !== signature) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      const event = req.body as any;

      await this.paymentQueue.add('process-payment-event', event, {
        jobId: `paystack_${event.data.reference}_${event.event}`,
      });

      return { received: true };
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
