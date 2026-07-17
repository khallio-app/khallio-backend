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
import { type UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session: UserSession = request.session;

    if (!session || !session.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const userId = session.user.id;
    const organizationSlug = request.params.organizationSlug;
    if (!organizationSlug) {
      throw new BadRequestException('Business Slug is required');
    }

    const business = await this.prisma.organization.findFirst({
      where: {
        slug: organizationSlug,
        members: {
          some: {
            userId,
            role: 'owner',
          },
        },
      },
    });
    if (!business) {
      throw new NotFoundException('Organization not found');
    }
    request.businessId = business.id;
    return true;
  }
}
