import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
  async getCategory() {
    try {
      const categories = await this.prisma.category.findMany();
      return { categories };
    } catch (err) {
      throw new HttpException(
        'Failed to get categories: ' + err.message,
        err.status || 500,
      );
    }
  }
}
