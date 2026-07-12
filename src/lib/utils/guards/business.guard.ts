import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session: UserSession = request.session;

    if (!session || !session.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const userId = session.user.id;
    const businessName = request.params.businessName;
    if (!businessName) {
      throw new BadRequestException('Business Name is required');
    }

    const business = await this.prisma.business.findFirst({
      where: { name: businessName, userId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    request.businessId = business.id;
    return true;
  }
}
