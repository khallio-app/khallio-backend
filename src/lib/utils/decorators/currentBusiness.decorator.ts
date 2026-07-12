import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentBusiness = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().businessId;
  },
);
