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
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { CurrentOrg } from 'src/lib/utils/decorators/currentBusiness.decorator';
import { EmailVerifiedGuard } from 'src/lib/utils/guards/emailVerified.guard';
import { OrganizationAccessGuard } from 'src/lib/utils/guards/organization.guard';
import { AllowPublic } from 'src/lib/utils/decorators/allowPublic.decorator';

@UseGuards(EmailVerifiedGuard, OrganizationAccessGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':organizationSlug')
  async findAll(@CurrentOrg() orgId: string) {
    return await this.productService.findAll(orgId);
  }

  @Get(':organizationSlug/featured')
  async findFeaturedProduct(
    @Session() session: UserSession,
    @CurrentOrg() orgId: string,
  ) {
    return await this.productService.findFeaturedProduct(
      orgId,
      session.user.id,
    );
  }

  @Post(':organizationSlug/create')
  @HttpCode(HttpStatus.OK)
  async create(
    @Body() createProductDto: CreateProductDto,
    @Session() session: UserSession,
    @CurrentOrg() orgId: string,
  ) {
    return await this.productService.create(
      createProductDto,
      session.user.id,
      orgId,
    );
  }

  @Put(':organizationSlug/edit')
  async update(
    @Body() body: UpdateProductDto,
    @Session() session: UserSession,
    @CurrentOrg() orgId: string,
  ) {
    return this.productService.update(body, session.user.id, orgId);
  }

  @Delete(':organizationSlug')
  async delete(
    @Body() deleteDto: { productId: string },
    @Session() session: UserSession,
    @CurrentOrg() orgId: string,
  ) {
    await this.productService.delete(
      deleteDto.productId,
      session.user.id,
      orgId,
    );
    return { message: 'Product deleted successfully' };
  }

  @AllowPublic()
  @Get('site/:publicId')
  async findByPublicId(
    @Param() param: { publicId: string },
    @Res() res: Response,
  ) {
    const { publicId } = param;
    const response = await this.productService.findByPublicId(publicId);
    res.status(200).json({ response });
  }
  @Get(':organizationSlug/:productId')
  async findByProductId(
    @Param() param: { productId: string },
    @Session() session: UserSession,
    @CurrentOrg() orgId: string,
  ) {
    const { productId } = param;
    return await this.productService.findByProductId(
      productId,
      orgId,
      session.user.id,
    );
  }
}
