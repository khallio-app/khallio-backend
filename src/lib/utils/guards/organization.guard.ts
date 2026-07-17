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
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public-metadata';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

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

    const organization = await this.prisma.organization.findFirst({
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
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    request.orgId = organization.id;
    return true;
  }
}
