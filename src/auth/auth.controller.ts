import {
  All,
  Controller,
  Get,
  Inject,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AUTH_INSTANCE } from './auth.module';
import type { Auth } from './auth.factory';
import { toNodeHandler } from 'better-auth/node';
import { AuthGuard } from './auth.guard';

@Controller('api/auth')
export class AuthController {
  private handler: ReturnType<typeof toNodeHandler>;

  constructor(@Inject(AUTH_INSTANCE) private readonly auth: Auth) {
    this.handler = toNodeHandler(this.auth);
  }

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res);
  }

}
