import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService, PrismaService, MyLoggerService],
})
export class OrganizationModule {}
