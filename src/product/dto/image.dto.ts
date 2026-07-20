import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class DeleteProductImageDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  id?: string;
}

enum ColumnType {
  BANNER = 'banner',
  LOGO = 'logo',
}
export class DeleteOrgImageDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsEnum(ColumnType)
  column: ColumnType;
}
