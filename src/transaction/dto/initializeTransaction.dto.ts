import { IsEmail, IsNumber, IsUUID } from 'class-validator';

export class InitializeTransactionDto {
  @IsEmail()
  email: string;

  @IsNumber()
  amount: number;

  @IsUUID()
  productId: string;
}
