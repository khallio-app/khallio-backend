import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteImageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId: string;
}
