import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @Type(() => Number)
  @IsInt()
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  imgFileKey?: string;
}

export class UpdateProductDto {
  @ValidateNested()
  @Type(() => UpdateProductFieldsDto)
  updates: UpdateProductFieldsDto;

  @IsUUID()
  productId: string;
}
