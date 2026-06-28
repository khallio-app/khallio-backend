import { IsInt, IsString } from 'class-validator';

export class GetUploadUrlDto {
  @IsString()
  fileName: string;
  @IsInt()
  fileSize: number;
  @IsString()
  fileType: string;
}
