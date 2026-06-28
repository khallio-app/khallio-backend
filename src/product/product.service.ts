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

@Injectable()
export class ProductService {
  constructor(private readonly s3: S3Service) {}
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
}
