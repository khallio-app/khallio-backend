import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { S3Service } from 'src/lib/s3Client.service';
import { PrismaService } from 'src/lib/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [ProductController],
  providers: [ProductService, S3Service, PrismaService, ConfigService],
})
export class ProductModule {}
