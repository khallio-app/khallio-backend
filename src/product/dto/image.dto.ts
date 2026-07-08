import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteImageDto {
  @IsString()
  @IsNotEmpty()
  filePath: string;


  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId?: string;
}
