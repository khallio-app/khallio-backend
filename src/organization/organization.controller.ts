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
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';

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
    return await this.organizationService.getActiveOrg(session.user.id);
  }

  @Put('activate')
  async activateOrg(
    @Body() data: { orgId: string },
    @Session() session: UserSession,
  ) {
    return await this.organizationService.activateOrg(
      session.user.id,
      data.orgId,
    );
  }
}
