import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from './lib/prisma.module';
import { EmailModule } from './email/email.module';
import 'dotenv/config';
import { BullModule } from '@nestjs/bullmq';
import { FileModule } from './file/file.module';
import { auth } from './lib/utils/auth';
import { OrganizationModule } from './organization/organization.module';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { EmailVerifiedGuard } from './lib/utils/guards/emailVerified.guard';
import { OrganizationAccessGuard } from './lib/utils/guards/organization.guard';
import { TransactionModule } from './transaction/transaction.module';
// import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDISHOST'),
          port: Number(config.get<string>('REDISPORT')),
          password: config.get<string>('REDISPASSWORD') || undefined
        },
        defaultJobOptions: { attempts: 3 },
      }),

      inject: [ConfigService],
    }),
    // QueuesModule,
    ProductModule,
    CategoryModule,
    EmailModule,
    FileModule,
    OrganizationModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: EmailVerifiedGuard },
    { provide: APP_GUARD, useClass: OrganizationAccessGuard },
  ],
})
export class AppModule {}
