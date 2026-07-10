import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { S3Service } from 'src/lib/s3Client.service';
import { PrismaService } from 'src/lib/prisma.service';
import { SupabaseService } from 'src/lib/supabase.service';
import { MyLoggerService } from 'src/lib/logger.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [FileController],
  providers: [
    FileService,
    S3Service,
    PrismaService,
    SupabaseService,
    MyLoggerService,
    ConfigService,
  ],
})
export class FileModule {}
