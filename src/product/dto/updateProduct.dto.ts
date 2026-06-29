import { CreateProductDto } from './createProduct.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsString, IsUUID } from 'class-validator';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['productFileIds'] as const),
) {}
