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
import { FilesInterceptor } from '@nestjs/platform-express';
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
    return await this.productService.findAll();
  }
  @Get(':productId')
  async findOne(@Param() param: { productId: string }) {
    const { productId } = param;
    return await this.productService.findOne(productId);
  }

  @Post('upload-url')
  async getUploadUrl(
    @Body() getUploadUrlDto: GetUploadUrlDto,
    @Res() res: Response,
  ) {
    const response =
      await this.productService.createPresignedUploadUrl(getUploadUrlDto);
    res.json({ response });
  }

  @Delete('/delete-file')
  async DeleteBucketLifecycle$(@Body() body: { key: string }) {
    return await this.productService.deleteFile(body.key);
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
  ) {
    return await this.productService.createProduct(
      createProductDto,
      '435ddd9d-1ca4-4456-88b5-11aa5b755557',
    );
  }

  @Post('file')
  async saveFile(@Body() fileDto: FileDto) {
    const response = await this.productService.createProductFile(fileDto);
    return response;
  }

  @Get('last-draft')
  async lastDraft(@Req() req: Request) {
    return await this.productService.getLastDraft(
      '435ddd9d-1ca4-4456-88b5-11aa5b755557',
    );
  }

  @Put('edit')
  async update(@Body() body: UpdateProductDto) {
    return this.productService.update(body);
  }

  @Delete('')
  async delete(@Body() deleteDto: { productId: string }) {
    await this.productService.delete(deleteDto.productId);
    return { message: 'Product deleted successfully' };
  }

  @Post('image-signedUrl')
  async imageSignedUrl(@Body() data: { fileName: string }) {
    return await this.productService.getImageSignedUrl(data.fileName);
  }

  @Delete('coverImg')
  async deleteCoverImg(@Body() data: { filePath: string; productId?: string }) {
    return await this.productService.deleteImage(data);
  }
}
