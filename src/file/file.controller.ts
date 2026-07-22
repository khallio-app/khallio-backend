import { Body, Controller, Delete, Post, Res } from '@nestjs/common';
import { FileService } from './file.service';
import { GetUploadUrlDto } from 'src/product/dto/get-upload-url.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { FileDto } from 'src/product/dto/file.dto';
import {
  DeleteOrgImageDto,
  DeleteProductImageDto,
} from 'src/product/dto/image.dto';
import type { Response } from 'express';
import { CurrentOrg } from 'src/lib/utils/decorators/currentBusiness.decorator';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post(':organizationSlug/upload-url')
  async getUploadUrl(
    @Body() getUploadUrlDto: GetUploadUrlDto,
    @Res() res: Response,
    @Session() session: UserSession,
  ) {
    const response = await this.fileService.createPresignedUploadUrl(
      getUploadUrlDto,
      session.user.id,
    );
    res.json({ response });
  }

  @Delete(':organizationSlug/delete-file')
  async deleteFile(
    @Body() body: { key: string },
    @Session() session: UserSession,
  ) {
    return await this.fileService.deleteFile(body.key, session.user.id);
  }

  @Post(':organizationSlug')
  async saveFile(@Body() fileDto: FileDto, @Session() session: UserSession) {
    const response = await this.fileService.createProductFile(
      fileDto,
      session.user.id,
    );
    return response;
  }

  @Post(':organizationSlug/image-signedUrl')
  async imageSignedUrl(@Body() data: { fileName: string; table: string }) {
    return await this.fileService.getImageSignedUrl(data.fileName, data.table);
  }

  @Delete(':organizationSlug/productImg')
  async productImg(
    @Body() data: DeleteProductImageDto,
    @Session() session: UserSession,
    @CurrentOrg() orgId: string,
  ) {
    return await this.fileService.deleteProductImage(
      data,
      session.user.id,
      orgId,
    );
  }

  @Delete(':organizationSlug/orgImg')
  async orgImg(
    @Body() data: DeleteOrgImageDto,
    @Session() session: UserSession,
    @CurrentOrg() orgId: string,
  ) {
    return await this.fileService.deleteOrgImage(data, session.user.id, orgId);
  }
}
