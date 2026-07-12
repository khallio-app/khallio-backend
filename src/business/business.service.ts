import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { MyLoggerService } from 'src/lib/logger.service';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: MyLoggerService,
  ) {}

  async findNames(userId: string) {
    try {
      const business = await this.prisma.business.findMany({
        where: { userId },
        select: { id: true, name: true },
      });
      if (!business) {
        throw new NotFoundException('User has no businesses');
      }
      return business;
    } catch (error) {
      this.logger.error(
        `Error fetching user(${userId} businesses): ${error}`,
        '',
        'FIND_ALL',
      );
      throw new HttpException(
        'Error fetching businesses' + error.message,
        error.status || 500,
      );
    }
  }
}
