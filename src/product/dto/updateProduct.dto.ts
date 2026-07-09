import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from 'generated/prisma/enums';

export class UpdateProductFieldsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsOptional()
  @IsString()
  fullDesc?: string;

  @IsOptional()
  @IsString()
  status?: ProductStatus;


  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  price?: number;


  @IsOptional()
  @Type(() => Number)
  @IsInt()
  discountedPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  imgFilePath?: string;
}

export class UpdateProductDto {
  @ValidateNested()
  @Type(() => UpdateProductFieldsDto)
  updates: UpdateProductFieldsDto;

  @IsUUID()
  productId: string;
}

export class ToggleStatusDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  status: ProductStatus;
}
