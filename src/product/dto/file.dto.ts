import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class FileDto {
  @IsString()
  key: string;

  @IsString()
  fileName: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  fileSize: number;
}
