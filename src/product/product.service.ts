import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { productDB } from './data';
import { S3Service } from 'src/lib/s3Client.service';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isAllowedFileType } from './dto/allowed_mime_types';
import { CreateProductDto } from './dto/createProduct.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { FileDto } from './dto/file.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly s3: S3Service,
    private readonly prisma: PrismaService,
  ) {}
  async findAll() {
    const data = productDB;
    // return {
    //   message: 'Successful',
    //   data,
    //   meta: { total: 8, published: 6, draft: 2 },
    // };

    return {
      message: 'No product found',
      data: [],
      meta: {},
    };
  }

  async findOne(productId: string) {
    const product = productDB.find(
      (product) => String(product.id) === productId,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async createPresignedUploadUrl(dto: GetUploadUrlDto) {
    try {
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB max

      const { fileName, fileSize, fileType } = dto;
      // 1. Validate File Size
      if (fileSize > MAX_FILE_SIZE) {
        throw new BadRequestException('File size exceeds the 100MB limit.');
      }

      // 2. Validate MIME Type
      if (!isAllowedFileType(fileType)) {
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
      // throw new HttpException(err.message, err.status);
      console.error(err.message, err.status);
    }
  }

  async deleteFile(key: string) {
    try {
      if (!key) {
        throw new BadRequestException('Missing or invalid object key');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.s3.bucketName,
        Key: key,
      });

      await this.s3.s3Client.send(command);

      return { message: 'File deleted successfully' };
    } catch (err) {
      throw new HttpException(
        'Failed to delete file:' + err.message,
        err.status || 500,
      );
    }
  }

  async createProduct(data: CreateProductDto, userId: string) {
    try {
      const { productFileIds } = data;

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
        },
      });
      if (!product) {
        console.error('Create product failed');
      }

      setImmediate(() => {
        productFileIds.forEach(async (i) => {
          try {
            await this.prisma.productFile.update({
              where: { id: i },
              data: { productId: product.id },
            });
          } catch (err) {
            console.log(
              `Failed to update productId on file - ${i}` + err.message,
              err.status,
            );
          }
        });
      });
      return { product };
    } catch (err) {
      throw new HttpException(
        'Error creating Product: ' + err.message,
        err.status || 500,
      );
    }
  }

  async createProductFile(fileDto: FileDto) {
    try {
      const productFile = await this.prisma.productFile.create({
        data: {
          ...fileDto,
        },
      });
      return { fileId: productFile.id };
    } catch (err) {
      throw new HttpException(
        'Error creating ProductFile: ' + err.message,
        err.status || 500,
      );
    }
  }

  async getLastDraft(userId: string) {
    const draft = await this.prisma.product.findFirst({
      where: {
        userId,
        status: 'draft',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!draft) {
      return false;
    }
  }
}
