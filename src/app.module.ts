import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from './lib/prisma.module';
import { EmailModule } from './email/email.module';
import 'dotenv/config';
import { BullModule } from '@nestjs/bullmq';
import { FileModule } from './file/file.module';
import { auth } from './lib/utils/auth';
import { OrganizationModule } from './organization/organization.module';

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
    FileModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
