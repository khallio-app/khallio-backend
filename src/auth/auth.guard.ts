import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_INSTANCE } from './auth.constants';
import type { Auth } from './auth.factory';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: Auth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    
    if (req.originalUrl?.startsWith('/api/auth')) {
      return true;
    }

    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) throw new UnauthorizedException();

    req.user = session.user;
    req.session = session.session;
    return true;
  }
}
