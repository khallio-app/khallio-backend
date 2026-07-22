import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'email' })],
  providers: [
    EmailService,
    EmailProcessor,
    ConfigService,
    PrismaService,
    MyLoggerService,
  ],
  exports: [EmailService],
})
export class EmailModule {}



// {
//   event: 'charge.success',
//   data: {
//     id: 6380772243,
//     domain: 'test',
//     status: 'success',
//     reference: 's61m65tdfe',
//     amount: 100000,
//     message: null,
//     gateway_response: 'Successful',
//     gateway_response_code: 'approved',
//     response_code: '00',
//     paid_at: '2026-07-22T10:27:26.000Z',
//     created_at: '2026-07-22T10:27:17.000Z',
//     channel: 'card',
//     currency: 'NGN',
//     ip_address: '41.86.149.178',
//     metadata: {
//       organizationId: '9a685fe9-9940-4079-9c42-6845a0290baa',
//       referrer: 'http://localhost:3000/'
//     },
//     fees_breakdown: null,
//     log: null,
//     fees: 1500,
//     fees_split: null,
//     authorization: {
//       authorization_code: 'AUTH_45e46m2c9x',
//       bin: '408408',
//       last4: '4081',
//       exp_month: '12',
//       exp_year: '2030',
//       channel: 'card',
//       card_type: 'visa ',
//       bank: 'TEST BANK',
//       country_code: 'NG',
//       brand: 'visa',
//       reusable: true,
//       signature: 'SIG_uuBmsy7XAiHadfStIss2',
//       account_name: null,
//       receiver_bank_account_number: null,
//       receiver_bank: null
//     },
//     customer: {
//       id: 375000060,
//       first_name: null,
//       last_name: null,
//       email: 'ericodejafidelis@gmail.com',
//       customer_code: 'CUS_lwrv3vxrs5h1vq5',
//       phone: null,
//       metadata: null,
//       risk_action: 'default',
//       international_format_phone: null
//     },
//     plan: {},
//     subaccount: {},
//     split: {},
//     order_id: null,
//     paidAt: '2026-07-22T10:27:26.000Z',
//     requested_amount: 100000,
//     pos_transaction_data: null,
//     source: {
//       type: 'api',
//       source: 'merchant_api',
//       entry_point: 'transaction_initialize',
//       identifier: null
//     }
//   }
// }