import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { S3Service } from 'src/lib/s3Client.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, S3Service],
})
export class ProductModule {}
