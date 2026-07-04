import { HttpException, Injectable } from '@nestjs/common';
import { MyLoggerService } from 'src/lib/logger.service';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: MyLoggerService,
  ) {}
  async getCategory() {
    try {

      const categories = await this.prisma.category.findMany({});
      return { categories };
    } catch (err) {
      this.logger.error(err);
      throw new HttpException(
        'Failed to get categories: ' + err.message,
        err.status || 500,
      );
    }
  }
}
