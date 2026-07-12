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
import type { Request, Response } from 'express';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('')
  async findAll(@Session() session: UserSession) {
    return await this.productService.findAll(session.user.id);
  }

  @Get(':productId')
  async findByProductId(
    @Param() param: { productId: string },
    @Session() session: UserSession,
  ) {
    const { productId } = param;
    return await this.productService.findByProductId(
      productId,
      session.user.id,
    );
  }

  @Get('store/featured')
  async findFeaturedProduct(@Session() session: UserSession) {
    return await this.productService.findFeaturedProduct(session.user.id);
  }

  @AllowAnonymous()
  @Get('site/:publicId')
  async findByPublicId(
    @Param() param: { publicId: string },
    @Res() res: Response,
  ) {
    const { publicId } = param;
    const response = await this.productService.findByPublicId(publicId);
    res.status(200).json({ response });
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
    @Session() session: UserSession,
  ) {
    return await this.productService.create(createProductDto, session.user.id);
  }

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
}
