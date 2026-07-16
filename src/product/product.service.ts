import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/createProduct.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from 'src/lib/supabase.service';
import { MyLoggerService } from 'src/lib/logger.service';
import { generateUniquePublicId } from 'src/lib/utils/nanoid.utils';
import { FileService } from 'src/file/file.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly logger: MyLoggerService,
    private readonly file: FileService,
  ) {}
  async findAll(organizationId: string) {
    try {
      const [products, total, published, featured, draft] =
        await this.prisma.$transaction([
          this.prisma.product.findMany({
            where: { organizationId },
            include: {
              category: true,
            },
            orderBy: { createdAt: 'desc' },
          }),

          this.prisma.product.count({ where: { organizationId } }),
          this.prisma.product.count({
            where: { status: 'PUBLISHED', organizationId },
          }),
          this.prisma.product.count({
            where: { isFeatured: true, status: 'PUBLISHED', organizationId },
          }),
          this.prisma.product.count({ where: { status: 'DRAFT', organizationId } }),
        ]);

      if (!products) {
        throw new NotFoundException('Business has no products');
      }
      return {
        message: 'Success',
        data: products,
        meta: {
          total,
          published,
          featured,
          draft,
        },
      };
    } catch (err) {
      this.logger.error(
        'Failed to get products: ' + err.message,
        '',
        'PRODUCT_SERVICE',
      );
      throw new HttpException(
        'Failed to get products: ' + err.message,
        err.status || 500,
      );
    }
  }

  async findByProductId(productId: string, organizationId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, organizationId },
      include: { category: true, productFiles: true },
    });
    if (!product) {
      this.logger.error(
        `Product ${productId} not found on business(${organizationId}) by user(${userId})`,
      );
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findFeaturedProduct(organizationId: string, userId: string) {
    const products = await this.prisma.product.findMany({
      where: { organizationId, isFeatured: true },
      include: { category: true },
    });
    if (!products) {
      this.logger.error(
        `Featured products not found on business(${organizationId}) by user(${userId})`,
      );
      throw new NotFoundException('Products not found');
    }
    return products;
  }

  async findByPublicId(publicId: string, organizationId: string) {
    const product = await this.prisma.product.findUnique({
      where: { publicId, status: 'PUBLISHED' },
      include: { category: true },
      omit: {
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!product) {
      this.logger.error(
        `Product ${publicId} not found)`,
        '',
        'FIND_BY_PUBLIC_ID',
      );
      throw new NotFoundException('Product not found');
    }

    const upsells = await this.prisma.product.findMany({
      where: {
        organizationId,
        status: 'PUBLISHED',
        publicId: { not: publicId },
      },
      select: { coverImg: true, price: true, name: true, publicId: true },
      orderBy: {
        createdAt: 'asc',
      },
      take: 3,
    });

    return { product, upsells };
  }

  async create(
    createProductDto: CreateProductDto,
    userId: string,
    organizationId: string,
  ) {
    try {
      const { productFileIds } = createProductDto;
      const bucketName = this.config.get<string>('COVER_IMAGE_BUCKET_NAME');
      if (!bucketName) {
        this.logger.error(
          `Failed to File bucket name missing in env`,
          '',
          'CREATE_PRODUCT',
        );
        throw new InternalServerErrorException();
      }
      const imagePublicUrl = createProductDto.imageFilePath
        ? this.supabase.getPublicUrl(createProductDto.imageFilePath, bucketName)
        : undefined;

      const data = {
        organizationId,
        name: createProductDto.name,
        shortDesc: createProductDto.shortDesc,
        fullDesc: createProductDto.fullDesc,
        categoryId: createProductDto.categoryId,
        price: createProductDto.price,
        discountedPrice: createProductDto.discountedPrice,
        status: createProductDto.status,
        isFeatured: createProductDto.isFeatured,
        coverImg: imagePublicUrl,
      };

      const product = await generateUniquePublicId(
        data,
        this.prisma,
        this.logger,
      );
      if (!product) {
        this.logger.error(
          `Failed to create product by on business(${organizationId}) by user(${userId})`,
          '',
          'CREATE_PRODUCT',
        );
      }

      setImmediate(async () => {
        productFileIds.forEach(async (i) => {
          try {
            await this.prisma.productFile.update({
              where: { id: i },
              data: { productId: product.id },
            });
          } catch (err) {
            this.logger.error(
              `Failed to update productId on file on user(${userId}) - ProductFile(${i}): ` +
                err.message,
              '',
              'CREATE_PRODUCT',
            );
          }
        });
      });
      return { product };
    } catch (err) {
      this.logger.error(
        `Failed to update productId on file on user(${userId}): ` + err.message,
        '',
        'CREATE_PRODUCT',
      );
      throw new HttpException(
        'Error creating Product: ' + err.message,
        err.status || 500,
      );
    }
  }

  async update(
    updateDto: UpdateProductDto,
    userId: string,
    organizationId: string,
  ) {
    try {
      const bucketName = this.config.get<string>('COVER_IMAGE_BUCKET_NAME');
      if (!bucketName) {
        this.logger.error(
          'Bucket name is missing in env',
          '',
          'UPDATE_PRODUCT',
        );
        throw new Error('Bucket name is missing in env');
      }
      const coverImg = updateDto.updates.imgFilePath
        ? this.supabase.getPublicUrl(updateDto.updates.imgFilePath, bucketName)
        : undefined;

      const product = await this.prisma.product.update({
        where: { id: updateDto.productId, organizationId },
        data: {
          name: updateDto.updates.name,
          shortDesc: updateDto.updates.shortDesc,
          fullDesc: updateDto.updates.fullDesc,
          categoryId: updateDto.updates.categoryId,
          price: updateDto.updates.price,
          status: updateDto.updates.status,
          isFeatured: updateDto.updates.isFeatured,
          discountedPrice: updateDto.updates.discountedPrice,
          coverImg,
        },
      });
      return product;
    } catch (err) {
      this.logger.error(
        `Failed to edit product on business(${organizationId}) by user(${userId}): ` +
          err.message,
        '',
        'UPDATE_PRODUCT',
      );
      throw new HttpException(
        'Failed to edit product: ' + err.message,
        err.status || 500,
      );
    }
  }

  async delete(productId: string, userId: string, organizationId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId, organizationId },
        select: { productFiles: true, coverImg: true },
      });
      if (!product) {
        this.logger.warn(
          `Product not found on business(${organizationId}) by user(${userId})`,
          'DELETE_PRODUCT',
        );
        throw new NotFoundException('Product not found');
      }

      const keysToDelete: string[] = [];
      if (product.productFiles.length) {
        product.productFiles.forEach(async (f) => {
          keysToDelete.push(f.key);
        });
      }

      if (keysToDelete.length) {
        await Promise.all(
          keysToDelete.map((key) => this.file.deleteFile(key, userId)),
        );
      }

      await this.prisma.product.delete({ where: { id: productId } });
    } catch (err) {
      this.logger.error(
        `Error deleting product on business(${organizationId}) by user(${userId}): ` +
          err.message,
        '',
        'DELETE_PRODUCT',
      );
      throw new HttpException(
        'Failed to delete product: ' + err.message,
        err.status || 500,
      );
    }
  }
}
