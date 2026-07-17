import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { type UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session: UserSession = request.session;

    if (!session || !session.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const userId = session.user.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user || !user.emailVerified) {
      throw new NotFoundException('Email not verified');
    }

    return true;
  }
}
