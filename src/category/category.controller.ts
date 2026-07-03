import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('')
  async getCategory() {
    return await this.categoryService.getCategory();
  }
}
