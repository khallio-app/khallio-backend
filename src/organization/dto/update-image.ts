import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
enum ColumnType {
  LOGO = 'logo',
  BANNER = 'banner',
}
export class UpdateImageDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsEnum(ColumnType)
  column: ColumnType;
}
