import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { AllowPublic } from 'src/lib/utils/decorators/allowPublic.decorator';
import { UpdateImageDto } from './dto/update-image';
import { EmailVerifiedGuard } from 'src/lib/utils/guards/emailVerified.guard';
import { OrganizationAccessGuard } from 'src/lib/utils/guards/organization.guard';

@AllowPublic()
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}
  @Get('owned')
  async ownedOrg(@Session() session: UserSession) {
    return await this.organizationService.getOwnedOrg(session.user.id);
  }

  @Get('active')
  async activeOrg(@Session() session: UserSession, @Req() req: Request) {
    //cache response
    return await this.organizationService.getActiveOrg(session, req);
  }

  @Get('isOwner')
  async isUserOrgOwner(@Session() session: UserSession) {
    return await this.organizationService.isUserOrgOwner(session);
  }

  @UseGuards(EmailVerifiedGuard, OrganizationAccessGuard)
  @Put(':organizationSlug/image')
  async updateImage(
    @Session() session: UserSession,
    @Req() req: Request,
    @Body() data: UpdateImageDto,
  ) {
    return await this.organizationService.updateImage(
      data.path,
      data.column,
      session,
      req,
    );
  }
}
