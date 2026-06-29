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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import type { Response, Request } from 'express';
import { CreateProductDto } from './dto/createProduct.dto';
import { FileDto } from './dto/file.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('')
  async findAll() {
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
      'ebd3484e-221b-4cd4-b1e1-47313673f034',
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
      'ebd3484e-221b-4cd4-b1e1-47313673f034',
    );
  }
}
