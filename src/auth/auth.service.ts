import {
  Injectable,
  HttpException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RegisterDto } from './dto/registerDto';
import { PrismaService } from 'src/lib/prisma.service';
import bcrypt from 'bcrypt';
import { TokenService } from 'src/lib/token.service';
import { LoginDto } from './dto/loginDto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly token: TokenService,
  ) {}
  async register(registerDto: RegisterDto) {
    try {
      const duplicateMail = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
        select: { email: true },
      });

      if (duplicateMail) {
        throw new ConflictException('User already exists');
      }

      const passwordHash = await bcrypt.hash(registerDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          passwordHash,
        },
      });

      const accessToken = await this.token.getAccessToken(
        user.id,
        user.email,
        user.role,
        user.name,
      );

      return {
        message: 'User created successfully',
        data: {
          token: accessToken,
        },
      };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'User creation failed:' + err.message,
        err.status || 500,
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        throw new BadRequestException('Invalid user credentials');
      }

      if (!(await bcrypt.compare(loginDto.password, user.passwordHash))) {
        throw new BadRequestException('Invalid user credentials');
      }

      const accessToken = await this.token.getAccessToken(
        user.id,
        user.email,
        user.role,
        user.name,
      );

      return {
        message: 'User login successful',
        data: {
          token: accessToken,
        },
      };
    } catch (err) {
      throw new HttpException(err.message, err.status || 500);
    }
  }
}
