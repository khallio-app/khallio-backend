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
  UseGuards,
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
import { EmailVerifiedGuard } from 'src/lib/utils/guards/emailVerified.guard';
import { BusinessAccessGuard } from 'src/lib/utils/guards/business.guard';
import { CurrentBusiness } from 'src/lib/utils/decorators/currentBusiness.decorator';

@UseGuards(EmailVerifiedGuard, BusinessAccessGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':businessName')
  async findAll(@CurrentBusiness() businessId: string) {
    return await this.productService.findAll(businessId);
  }

  @Get(':businessName/:productId')
  async findByProductId(
    @Param() param: { productId: string },
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    const { productId } = param;
    return await this.productService.findByProductId(
      productId,
      businessId,
      session.user.id,
    );
  }

  @Get(':businessName/featured')
  async findFeaturedProduct(
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    return await this.productService.findFeaturedProduct(
      businessId,
      session.user.id,
    );
  }

  @AllowAnonymous()
  @Get(':businessName/:publicId')
  async findByPublicId(
    @Param() param: { publicId: string },
    @Res() res: Response,
    @CurrentBusiness() businessId:string
  ) {
    const { publicId } = param;
    const response = await this.productService.findByPublicId(publicId, businessId);
    res.status(200).json({ response });
  }

  @Post(':businessName/create')
  @HttpCode(HttpStatus.OK)
  async create(
    @Body() createProductDto: CreateProductDto,
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    return await this.productService.create(
      createProductDto,
      session.user.id,
      businessId,
    );
  }

  @Put(':businessName/edit')
  async update(
    @Body() body: UpdateProductDto,
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    return this.productService.update(body, session.user.id, businessId);
  }

  @Delete(':businessName')
  async delete(
    @Body() deleteDto: { productId: string },
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    await this.productService.delete(
      deleteDto.productId,
      session.user.id,
      businessId,
    );
    return { message: 'Product deleted successfully' };
  }
}
