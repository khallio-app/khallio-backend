import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, MyLoggerService],
})
export class CategoryModule {}
