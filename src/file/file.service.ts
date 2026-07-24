import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MyLoggerService } from 'src/lib/logger.service';
import { PrismaService } from 'src/lib/prisma.service';
import { S3Service } from 'src/lib/s3Client.service';
import { SupabaseService } from 'src/lib/supabase.service';
import { isAllowedFileType } from 'src/product/dto/allowed_mime_types';
import { FileDto } from 'src/product/dto/file.dto';
import { GetUploadUrlDto } from 'src/product/dto/get-upload-url.dto';
import {
  DeleteOrgImageDto,
  DeleteProductImageDto,
} from 'src/product/dto/image.dto';

@Injectable()
export class FileService {
  constructor(
    private readonly logger: MyLoggerService,
    private readonly s3: S3Service,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

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

  async getImageSignedUrl(fileName: string, table: string) {
    try {
      let bucketName: string | undefined = undefined;
      switch (table) {
        case 'product':
          bucketName = this.config.get<string>('COVER_IMAGE_BUCKET_NAME');
          break;
        case 'organization':
          bucketName = this.config.get<string>('ORG_IMAGE_BUCKET_NAME');
          break;

        default:
          this.logger.warn(
            'Bad Request: Invalid table name',
            'GET_IMAGE_SIGNED_URL',
          );
          throw new BadRequestException('Invalid table name ');
      }

      if (!bucketName) throw new Error('Bucket name is missing in env');
      const { signedUrl, filePath } = await this.supabase.getSignedUrl(
        bucketName,
        fileName,
      );

      const publicUrl = this.supabase.getPublicUrl(filePath, bucketName);
      return { signedUrl, filePath, publicUrl };
    } catch (err) {
      this.logger.error(
        `Failed to get image_signed_url: ${err.message}`,
        '',
        'SUPABASE',
      );
      throw new HttpException(
        'Failed to get image signedUrl: ' + err.message,
        err.status || 500,
      );
    }
  }

  async deleteFile(userId: string, key: string) {
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

      await this.prisma.productFile.delete({ where: { key } });

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

  async deleteProductImage(
    deleteImageDto: DeleteProductImageDto,
    userId: string,
    organizationId: string,
  ) {
    try {
      const bucketName = this.config.get<string>('COVER_IMAGE_BUCKET_NAME');
      if (!bucketName) throw new Error('Product Bucket name is missing in env');

      const { path, id } = deleteImageDto;
      await this.supabase.deleteFile(bucketName, path);
      if (id) {
        await this.prisma.product.update({
          where: { id, organizationId },
          data: { coverImg: null },
        });
      }
    } catch (err) {
      this.logger.error(
        `Failed to delete cover_image on product: ${err.message} by user(${userId})`,
        '',
        'SUPABASE',
      );
      throw new HttpException(
        `Failed to delete image: ` + err.message,
        err.status || 500,
      );
    }
  }

  async deleteOrgImage(
    deleteImageDto: DeleteOrgImageDto,
    userId: string,
    orgId: string,
  ) {
    try {
      const bucketName = this.config.get<string>('ORG_IMAGE_BUCKET_NAME');
      if (!bucketName)
        throw new Error('Organization Bucket name is missing in env');

      const { path, column } = deleteImageDto;
      await this.supabase.deleteFile(bucketName, path);

      switch (column) {
        case 'banner':
          await this.prisma.organization.update({
            where: { id: orgId },
            data: { banner: null },
          });

          break;
        case 'logo':
          await this.prisma.organization.update({
            where: { id: orgId },
            data: { logo: null },
          });

          break;

        default:
          break;
      }
    } catch (err) {
      this.logger.error(
        `Failed to delete cover_image on product: ${err.message} by user(${userId})`,
        '',
        'SUPABASE',
      );
      throw new HttpException(
        `Failed to delete image: ` + err.message,
        err.status || 500,
      );
    }
  }
}
