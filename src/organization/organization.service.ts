import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from 'src/lib/prisma.service';
import { MyLoggerService } from 'src/lib/logger.service';
import { auth } from 'src/lib/utils/auth';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from 'src/lib/supabase.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: MyLoggerService,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
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
      const activeOrg = await this.prisma.organization.findFirst({
        where: {
          id: session.session.activeOrganizationId,
          members: {
            some: {
              userId: session.user.id,
              role: 'owner',
              user: { emailVerified: true },
            },
          },
        },
        include: {
          members: { where: { userId: session.user.id, role: 'owner' } },
        },
      });
      return activeOrg;
    } catch (error) {
      this.logger.warn(
        `User(${session.user.id}) has no active organizations: ` +
          error.message,
        'GET_ACTIVE_ORGANIZATIONS',
      );
    }
  }

  async updateImage(
    imgUrl: string,
    column: string,
    session: UserSession,
    req: Request,
  ) {
    try {
      switch (column) {
        case 'banner':
          auth.api.updateOrganization({
            body: {
              organizationId: session.session.activeOrganizationId,
              data: { banner: imgUrl },
            },
            headers: req.headers,
          });
          break;
        case 'logo':
          auth.api.updateOrganization({
            body: {
              organizationId: session.session.activeOrganizationId,
              data: { logo: imgUrl },
            },
            headers: req.headers,
          });
          break;

        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Error updating image on org(${session.session.activeOrganizationId}) by user(${session.user.id}): ` +
          error.message,
        '',
        'UPDATE_IMAGE',
      );
      throw new HttpException(
        `Error updating image on org(${session.session.activeOrganizationId}) by user(${session.user.id}): ` +
          error.message,
        error.status || 500,
      );
    }
  }
}
