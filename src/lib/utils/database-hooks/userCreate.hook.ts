import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import {
  DatabaseHook,
  BeforeCreate,
  AfterCreate,
} from '@thallesp/nestjs-better-auth';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/lib/prisma.service';

@DatabaseHook()
@Injectable()
export class UserCreateHook {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}
  @BeforeCreate('user')
  async beforeUserCreate(user: {
    name: string;
    email: string;
    password: string;
  }) {
    return {
      data: {
        ...user,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1],
      },
    };
  }

  @AfterCreate('user')
  async afterUserCreate(user: any) {
    const token = (crypto.randomBytes(4).readUInt32BE(0) % 1000000)
      .toString()
      .padStart(6, '0');

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.verification.create({
      data: {
        value: hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        identifier: user.id,
      },
    });
    await this.emailService.sendConfirmationEmail({
      email: user.email,
      token,
    });
  }
}
