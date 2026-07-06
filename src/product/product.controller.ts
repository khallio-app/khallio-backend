import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  Res,
  Delete,
  Req,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import type { Response, Request } from 'express';
import { CreateProductDto } from './dto/createProduct.dto';
import { FileDto } from './dto/file.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('')
  async findAll(@Session() session: UserSession) {
    return await this.productService.findAll(session.user.id);
  }
  @Get(':productId')
  async findOne(
    @Param() param: { productId: string },
    @Session() session: UserSession,
  ) {
    const { productId } = param;
    return await this.productService.findOne(productId, session.user.id);
  }

  @Post('upload-url')
  async getUploadUrl(
    @Body() getUploadUrlDto: GetUploadUrlDto,
    @Res() res: Response,
    @Session() session: UserSession,
  ) {
    const response = await this.productService.createPresignedUploadUrl(
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
    return await this.productService.deleteFile(body.key, session.user.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
    @Session() session: UserSession,
  ) {
    return await this.productService.createProduct(
      createProductDto,
      session.user.id,
    );
  }

  @Post('file')
  async saveFile(@Body() fileDto: FileDto, @Session() session: UserSession) {
    const response = await this.productService.createProductFile(
      fileDto,
      session.user.id,
    );
    return response;
  }

  // @Get('last-draft')
  // async lastDraft(@Req() req: Request) {
  //   return await this.productService.getLastDraft(

  //   );
  // }

  @Put('edit')
  async update(
    @Body() body: UpdateProductDto,
    @Session() session: UserSession,
  ) {
    return this.productService.update(body, session.user.id);
  }

  @Delete('')
  async delete(
    @Body() deleteDto: { productId: string },
    @Session() session: UserSession,
  ) {
    await this.productService.delete(deleteDto.productId, session.user.id);
    return { message: 'Product deleted successfully' };
  }

  @Post('image-signedUrl')
  async imageSignedUrl(@Body() data: { fileName: string }) {
    return await this.productService.getImageSignedUrl(data.fileName);
  }

  @Delete('coverImg')
  async deleteCoverImg(
    @Body() data: { filePath: string; productId?: string },
    @Session() session: UserSession,
  ) {
    return await this.productService.deleteImage(data, session.user.id);
  }
}
