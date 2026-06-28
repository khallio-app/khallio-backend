import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
  Res,
  Delete,
  Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import type { Response, Request } from 'express';

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
    // @Req() req: Request,
  ) {
    const response =
      await this.productService.createPresignedUploadUrl(getUploadUrlDto);
    res.json({ response });
  }

  @Delete('/delete-file')
  async DeleteBucketLifecycle$(@Body() body: { key: string }) {
    return await this.productService.deleteFile(body.key);
  }
}
