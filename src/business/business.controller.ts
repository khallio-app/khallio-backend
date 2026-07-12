import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import type { Request, Response } from 'express';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { EmailVerifiedGuard } from 'src/lib/utils/guards/emailVerified.guard';
import { BusinessAccessGuard } from 'src/lib/utils/guards/business.guard';
import { CurrentBusiness } from 'src/lib/utils/decorators/currentBusiness.decorator';

@UseGuards(EmailVerifiedGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  async findNames(@Session() session: UserSession) {
    return await this.businessService.findNames(session.user.id);
  }
}
