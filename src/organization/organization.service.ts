import { HttpException, Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';

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
        orderBy: { active: 'desc' },
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

  async getActiveOrg(userId: string) {
    try {
      const activeOrg = await this.prisma.organization.findFirst({
        where: {
          members: {
            some: { userId, role: 'owner' },
          },
          active: true,
        },
      });

      if (!activeOrg) return null;
      return activeOrg;
    } catch (error) {
      this.logger.warn(
        `User(${userId}) has no active organizations: ` + error.message,
        'GET_ACTIVE_ORGANIZATIONS',
      );
    }
  }

  async activateOrg(userId: string, orgId: string) {
    try {
      (await this.prisma.organization.updateMany({
        where: {
          members: {
            some: { userId, role: 'owner' },
          },
          active: true,
        },
        data: { active: false },
      }),
        await this.prisma.organization.updateMany({
          where: {
            id: orgId,
            members: {
              some: { userId, role: 'owner' },
            },
          },
          data: { active: true },
        }));

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to activateOrg(${orgId}) by user(${userId}): ` + error.message,
        '',
        'ACTIVATE_ORG',
      );
      throw new HttpException(
        `Failed to activateOrg(${orgId}) by user(${userId}): ` + error.message,
        error.status || 500,
      );
    }
  }
}
