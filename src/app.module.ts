import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from './auth/auth.factory';
import { PrismaService } from './lib/prisma.service';
import { PrismaModule } from './lib/prisma.module';
import { EmailModule } from './email/email.module';
import 'dotenv/config';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule.forRootAsync({
      isGlobal: true,
      imports: [PrismaModule, EmailModule],
      useFactory: (prisma: PrismaService, emailService: EmailService) => ({
        auth: createAuth(prisma, emailService),
      }),
      inject: [PrismaService, EmailService],
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: Number(config.get<string>('REDIS_PORT')),
        },
        defaultJobOptions: { attempts: 3 },
      }),

      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'email' }),
    ProductModule,
    CategoryModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
