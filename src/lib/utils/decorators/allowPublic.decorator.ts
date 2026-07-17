import { applyDecorators, SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './public-metadata';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

export const AllowPublic = () =>
  applyDecorators(AllowAnonymous(), SetMetadata(IS_PUBLIC_KEY, true));
