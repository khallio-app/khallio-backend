import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { productDB } from './data';
import { S3Service } from 'src/lib/s3Client.service';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID, sign } from 'crypto';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isAllowedFileType } from './dto/allowed_mime_types';
import { CreateProductDto } from './dto/createProduct.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { FileDto } from './dto/file.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from 'src/lib/supabase.service';
import { MyLoggerService } from 'src/lib/logger.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly s3: S3Service,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly logger: MyLoggerService,
  ) {}
  async findAll(userId: string) {
    try {
      const [products, total, published, draft] =
        await this.prisma.$transaction([
          this.prisma.product.findMany({
            where: { userId },
            include: {
              category: true,
              productFiles: {
                select: {
                  fileName: true,
                  fileSize: true,
                },
              },
            },
          }),

          this.prisma.product.count(),
          this.prisma.product.count({ where: { status: 'published' } }),
          this.prisma.product.count({ where: { status: 'draft' } }),
        ]);

      if (!products) {
        throw new NotFoundException('User has no products');
      }
      return {
        message: 'Success',
        data: products,
        meta: {
          total,
          published,
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

  async findOne(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, userId },
      include: { category: true, productFiles: true },
    });
    if (!product) {
      this.logger.error(`Product ${productId} not found by user(${userId})`);
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async createPresignedUploadUrl(dto: GetUploadUrlDto, userId: string) {
    try {
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB max

      const { fileName, fileSize, fileType } = dto;
      // 1. Validate File Size
      if (fileSize > MAX_FILE_SIZE) {
        throw new BadRequestException('File size exceeds the 100MB limit.');
      }

      // 2. Validate MIME Type
      if (!isAllowedFileType(fileType)) {
        this.logger.warn(
          `Unsupported file format by user (${userId})`,
          'GET_PRESIGNED_UPLOAD_URL',
        );
        throw new BadRequestException('Unsupported file format.');
      }

      // 3. Generate a secure, unique storage key using native crypto UUID
      const fileExtension = fileName.split('.').pop();
      const uniqueKey = `${randomUUID()}.${fileExtension}`;

      // 4. Set up the S3 Upload Command constraints
      const command = new PutObjectCommand({
        Bucket: this.s3.bucketName,
        Key: uniqueKey,
        ContentType: fileType, // Enforces that the client MUST upload this exact type
      });

      // 5. Generate the Presigned URL (Expires in 15 minutes / 900 seconds)
      const uploadUrl = await getSignedUrl(this.s3.s3Client, command, {
        expiresIn: 900,
      });

      return {
        presignedUrl: uploadUrl,
        key: uniqueKey, // Save this reference string in your database later
      };
    } catch (err) {
      this.logger.error(
        `Failed to get_presigned_upload_url: ${err.message}`,
        '',
        'TIGRIS',
      );
      throw new HttpException(err.message, err.status);
    }
  }

  async getImageSignedUrl(fileName: string) {
    try {
      const bucketName = this.config.get<string>('COVER_IMAGE_BUCKET_NAME');
      if (!bucketName) throw new Error('Bucket name is missing in env');

      const { signedUrl, filePath } = await this.supabase.getSignedUrl(
        bucketName,
        fileName,
      );

      return { signedUrl, filePath };
    } catch (err) {
      this.logger.error(
        `Failed to image_signed_url: ${err.message}`,
        '',
        'SUPABASE',
      );
      throw new HttpException(
        'Failed to get image signedUrl: ' + err.message,
        err.status || 500,
      );
    }
  }

  async deleteImage(
    {
      filePath,
      fileUrl,
      productId,
    }: {
      filePath?: string;
      fileUrl?: string;
      productId?: string;
    },
    userId: string,
  ) {
    try {
      const bucketName = this.config.get<string>('COVER_IMAGE_BUCKET_NAME');
      if (!bucketName) throw new Error('Bucket name is missing in env');

      const path = filePath
        ? filePath
        : fileUrl!.split(`/storage/v1/object/public/${bucketName}/`)[1];
      if (!path) {
        this.logger.error(
          `Failed to get filePath: ${filePath || fileUrl}`,
          '',
          'DELETE_IMAGE',
        );
      }
      await this.supabase.deleteFile(bucketName, path);
      if (productId) {
        await this.prisma.product.update({
          where: { id: productId, userId },
          data: { coverImg: null },
        });
      }
    } catch (err) {
      this.logger.error(
        `Failed to delete image: ${err.message} by user(${userId})`,
        '',
        'SUPABASE',
      );
      throw new HttpException(
        `Failed to delete image by user(${userId}): ` + err.message,
        err.status || 500,
      );
    }
  }

  async deleteFile(key: string, userId: string) {
    try {
      if (!key) {
        this.logger.warn(
          `Failed to delete file by user(${userId}: Missing or invalid object key)`,
          'DELETE_FILE',
        );
        throw new BadRequestException('Missing or invalid object key');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.s3.bucketName,
        Key: key,
      });

      await this.s3.s3Client.send(command);

      return { message: 'File deleted successfully' };
    } catch (err) {
      this.logger.error(
        `Failed to delete file(${key}) by user(${userId}): ${err.message}`,
        '',
        'TIGRIS',
      );
      throw new HttpException(
        'Failed to delete file:' + err.message,
        err.status || 500,
      );
    }
  }

  async createProduct(data: CreateProductDto, userId: string) {
    try {
      const { productFileIds } = data;
      const bucketName = this.config.get<string>('COVER_IMAGE_BUCKET_NAME');
      if (!bucketName) {
        this.logger.error(
          `Failed to File bucket name missing in env`,
          '',
          'CREATE_PRODUCT',
        );
        throw new InternalServerErrorException();
      }
      const imagePublicUrl = data.imageFilePath
        ? this.supabase.getPublicUrl(data.imageFilePath, bucketName)
        : undefined;
      const product = await this.prisma.product.create({
        data: {
          userId,
          name: data.name,
          shortDesc: data.shortDesc,
          fullDesc: data.fullDesc,
          categoryId: data.categoryId,
          price: data.price,
          status: data.status,
          isFeatured: data.isFeatured,
          coverImg: imagePublicUrl,
        },
      });
      if (!product) {
        this.logger.error(
          `Failed to create product by user(${userId}): Product not found`,
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

  async createProductFile(fileDto: FileDto, userId: string) {
    try {
      const productFile = await this.prisma.productFile.create({
        data: {
          ...fileDto,
        },
      });
      return { fileId: productFile.id };
    } catch (err) {
      this.logger.error(
        `Error creating productFile by user(${userId}): ` + err.message,
        '',
        'CREATE_PRODUCT_FILE',
      );
      throw new HttpException(
        'Error creating ProductFile: ' + err.message,
        err.status || 500,
      );
    }
  }

  // async getLastDraft(userId: string) {
  //   const draft = await this.prisma.product.findFirst({
  //     where: {
  //       userId,
  //       status: 'draft',
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   });

  //   if (!draft) {
  //     return false;
  //   }
  // }

  async update(updateDto: UpdateProductDto, userId: string) {
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
        where: { id: updateDto.productId },
        data: {
          name: updateDto.updates.name,
          shortDesc: updateDto.updates.shortDesc,
          fullDesc: updateDto.updates.fullDesc,
          categoryId: updateDto.updates.categoryId,
          price: updateDto.updates.price,
          coverImg,
        },
      });
      return product;
    } catch (err) {
      this.logger.error(
        `Failed to edit product by user(${userId}): ` + err.message,
        '',
        'UPDATE_PRODUCT',
      );
      throw new HttpException(
        'Failed to edit product: ' + err.message,
        err.status || 500,
      );
    }
  }

  async delete(productId: string, userId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { productFiles: true, coverImg: true },
      });
      if (!product) {
        this.logger.warn(
          `Product not found by user(${userId})`,
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
      if (product.coverImg) {
        const imgKey = product.coverImg.split('dev/')[1];
        keysToDelete.push(imgKey);
      }

      if (keysToDelete.length) {
        await Promise.all(
          keysToDelete.map((key) => this.deleteFile(key, userId)),
        );
      }

      await this.prisma.product.delete({ where: { id: productId } });
    } catch (err) {
      this.logger.error(
        `Error deleting product by user(${userId}): ` + err.message,
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
