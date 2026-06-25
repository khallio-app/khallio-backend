import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async getAccessToken(
    userId: string,
    email: string,
    role: string,
    name: string,
  ) {
    const payload = { sub: userId, name, email, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: '15m',
    });

    return accessToken
  }

}
