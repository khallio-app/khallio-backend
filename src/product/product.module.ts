import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from 'src/lib/supabase.service';
import { MyLoggerService } from 'src/lib/logger.service';
import { FileService } from 'src/file/file.service';
import { S3Service } from 'src/lib/s3Client.service';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    PrismaService,
    ConfigService,
    MyLoggerService,
    FileService,
    S3Service,
    SupabaseService,
  ],
})
export class ProductModule {}
