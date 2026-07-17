import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
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
      let activeOrg: any;
      try {
        activeOrg = await auth.api.getFullOrganization({
          query: { organizationId: session.session.activeOrganizationId },
          headers: req.headers,
        });
      } catch {
        const baseOrg = await this.orgAfterAuth(session);
        activeOrg = await auth.api.getFullOrganization({
          query: { organizationId: baseOrg.id },
          headers: req.headers,
        });
      } finally {
        return activeOrg;
      }
    } catch (error) {
      this.logger.warn(
        `User(${session.user.id}) has no active organizations: ` +
          error.message,
        'GET_ACTIVE_ORGANIZATIONS',
      );
    }
  }

  async isUserOrgOwner(session: UserSession) {
    try {
      const owner = await this.prisma.organization.findFirst({
        where: {
          id: session.session.activeOrganizationId,
          members: {
            some: {
              userId: session.user.id,
              role: 'owner',
            },
          },
        },
      });
      if (!owner) return { isOwner: false };
      return { isOwner: true };
    } catch (error) {
      this.logger.error(
        `Error fetching organization(${session.session.activeOrganizationId}) owner: ` +
          error.message,
        '',
        'GET_ORG_OWNER',
      );
      throw new HttpException(
        `Error fetching organization(${session.session.activeOrganizationId}) owner: ` +
          error.message,
        error.status || 500,
      );
    }
  }

  async orgAfterAuth(session: UserSession) {
    try {
      const firstOrg = await this.prisma.organization.findFirst({
        where: {
          members: { some: { userId: session.user.id, role: 'owner' } },
        },
      });
      if (!firstOrg) {
        throw new NotFoundException(
          'No business organization found owned by this user.',
        );
      }
      await this.prisma.session.updateMany({
        where: { userId: session.user.id },
        data: { activeOrganizationId: firstOrg.id },
      });
      return firstOrg;
    } catch (error) {
      this.logger.error(
        `Error setting activeOrg on user(${session.user.id}): ` + error.message,
        '',
        'ORG_AFTER_AUTH',
      );
      throw new HttpException(
        `Error setting activeOrg on user(${session.user.id}): ` + error.message,
        error.status || 500,
      );
    }
  }
}
