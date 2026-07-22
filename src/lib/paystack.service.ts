import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MyLoggerService } from './logger.service';

@Injectable()
export class PaystackService {
  private readonly baseUrl: string;
  private readonly secretKey: string;
  constructor(
    private readonly config: ConfigService,
    private readonly logger: MyLoggerService,
  ) {
    this.secretKey = this.config.get<string>('PAYSTACK_API_KEY')!;
    this.baseUrl = this.config.get<string>('PAYSTACK_BASE_URL')!;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async intializeTransaction(
    email: string,
    amount: number,
    organizationId: string,
  ) {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        { email, amount, metadata: { organizationId } },
        { headers: this.headers },
      );

      return data;
    } catch (err) {
      this.logger.error(
        'Payment initialization failed: ' + err.message,
        '',
        'PAYSTACK_INITIALIZE_TRANSACTION',
      );
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
