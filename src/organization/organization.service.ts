import { HttpException, Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';
import { auth } from 'src/lib/utils/auth';
import { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: MyLoggerService,
  ) {}
  async getOwnedOrg(userId: string) {
    try {
      const ownedOrgs = await this.prisma.organization.findMany({
        where: {
          members: {
            some: {
              userId: userId,
              role: 'owner',
            },
          },
        },
      });

      return ownedOrgs;
    } catch (error) {
      this.logger.error(
        `Error getting user(${userId}) owned organizations: ` + error.message,
        '',
        'GET_OWNED_ORGANIZATION',
      );
      throw new HttpException(
        `Error getting user(${userId}) owned organizations: ` + error.message,
        error.status || 500,
      );
    }
  }

  async getActiveOrg(session: UserSession, req: Request) {
    try {
      const activeOrg = await auth.api.getFullOrganization({
        query: { organizationId: session.session.activeOrganizationId },
        headers: req.headers,
      });

      if (!activeOrg) return null;
      return activeOrg;
    } catch (error) {
      this.logger.warn(
        `User(${session.user.id}) has no active organizations: ` +
          error.message,
        'GET_ACTIVE_ORGANIZATIONS',
      );
    }
  }
}
