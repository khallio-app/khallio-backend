import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/lib/prisma.service';
import { createAuth } from './auth.factory';
import { AuthGuard } from './auth.guard';

export const AUTH_INSTANCE = 'AUTH_INSTANCE';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
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
