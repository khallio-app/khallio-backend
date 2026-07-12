import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, PrismaService, MyLoggerService],
})
export class BusinessModule {}
