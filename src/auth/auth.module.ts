import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { createAuth } from './auth.factory';
import { AuthGuard } from './auth.guard';
import { AUTH_INSTANCE } from './auth.constants';


@Module({
  controllers: [AuthController],
  providers: [
    PrismaService,
    {
      provide: AUTH_INSTANCE,
      useFactory: (prisma: PrismaService) => createAuth(prisma),
      inject: [PrismaService],
    },
    AuthGuard,
  ],
  exports: [AUTH_INSTANCE, AuthGuard],
})
export class AuthModule {}

