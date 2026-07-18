import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';
import { SupabaseService } from 'src/lib/supabase.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    PrismaService,
    MyLoggerService,
    SupabaseService,
    ConfigService,
  ],
})
export class OrganizationModule {}
