import { Body, Controller, Delete, Post, Res } from '@nestjs/common';
import { FileService } from './file.service';
import { GetUploadUrlDto } from 'src/product/dto/get-upload-url.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { FileDto } from 'src/product/dto/file.dto';
import { DeleteImageDto } from 'src/product/dto/image.dto';
import type { Response } from 'express';
import { CurrentBusiness } from 'src/lib/utils/decorators/currentBusiness.decorator';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload-url')
  async getUploadUrl(
    @Body() getUploadUrlDto: GetUploadUrlDto,
    @Res() res: Response,
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    const response = await this.fileService.createPresignedUploadUrl(
      getUploadUrlDto,
      session.user.id,
    );
    res.json({ response });
  }

  @Delete('/delete-file')
  async deleteFile(
    @Body() body: { key: string },
    @Session() session: UserSession,
  ) {
    return await this.fileService.deleteFile(
      body.key,
      session.user.id,
    );
  }

  @Post('')
  async saveFile(@Body() fileDto: FileDto, @Session() session: UserSession) {
    const response = await this.fileService.createProductFile(
      fileDto,
      session.user.id,
    );
    return response;
  }

  @Post('image-signedUrl')
  async imageSignedUrl(@Body() data: { fileName: string }) {
    return await this.fileService.getImageSignedUrl(data.fileName);
  }

  @Delete('coverImg')
  async CoverImg(
    @Body() data: DeleteImageDto,
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    return await this.fileService.deleteImage(
      data,
      session.user.id,
      businessId,
    );
  }
}
