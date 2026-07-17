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
import { CurrentBusiness } from 'src/lib/utils/decorators/currentBusiness.decorator';
import { EmailVerifiedGuard } from 'src/lib/utils/guards/emailVerified.guard';
import { OrganizationAccessGuard } from 'src/lib/utils/guards/organization.guard';

@UseGuards(EmailVerifiedGuard, OrganizationAccessGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':organizationSlug')
  async findAll(@CurrentBusiness() businessId: string) {
    return await this.productService.findAll(businessId);
  }

  @Get(':organizationSlug/featured')
  async findFeaturedProduct(
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    return await this.productService.findFeaturedProduct(
      businessId,
      session.user.id,
    );
  }

  @Get(':organizationSlug/:productId')
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

  @AllowAnonymous()
  @Get(':organizationSlug/:publicId')
  async findByPublicId(
    @Param() param: { publicId: string },
    @Res() res: Response,
    @CurrentBusiness() businessId: string,
  ) {
    const { publicId } = param;
    const response = await this.productService.findByPublicId(
      publicId,
      businessId,
    );
    res.status(200).json({ response });
  }

  @Post(':organizationSlug/create')
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

  @Put(':organizationSlug/edit')
  async update(
    @Body() body: UpdateProductDto,
    @Session() session: UserSession,
    @CurrentBusiness() businessId: string,
  ) {
    return this.productService.update(body, session.user.id, businessId);
  }

  @Delete(':organizationSlug')
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
