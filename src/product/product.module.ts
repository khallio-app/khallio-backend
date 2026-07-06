import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { S3Service } from 'src/lib/s3Client.service';
import { PrismaService } from 'src/lib/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from 'src/lib/supabase.service';
import { MyLoggerService } from 'src/lib/logger.service';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    S3Service,
    PrismaService,
    ConfigService,
    SupabaseService,
    MyLoggerService,
  ],
})
export class ProductModule {}
