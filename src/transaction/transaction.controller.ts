import { Body, Controller, Post, type RawBodyRequest, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AllowPublic } from 'src/lib/utils/decorators/allowPublic.decorator';
import { InitializeTransactionDto } from './dto/initializeTransaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @AllowPublic()
  @Post('initialize')
  async initializeTransaction(@Body() data: InitializeTransactionDto) {
    return await this.transactionService.initializeTransaction(
      data.amount,
      data.email,
      data.productId,
    );
  }

  @AllowPublic()
  @Post('/webhook/paystack')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    await this.transactionService.handleWebhook(req);
  }
}
