import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from 'generated/prisma/enums';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  shortDesc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  fullDesc?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  discountedPrice?: number;

  @IsOptional()
  @IsString()
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Type(() => Array)
  @IsArray()
  productFileIds: string[];

  @IsOptional()
  @IsString()
  imageFilePath?: string;
}
