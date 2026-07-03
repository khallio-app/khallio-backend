import { Injectable } from '@nestjs/common';
import { DatabaseHook, BeforeCreate } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/lib/prisma.service';

@DatabaseHook()
@Injectable()
export class UserCreateHook {
  constructor(private readonly prisma: PrismaService) {}

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
}
