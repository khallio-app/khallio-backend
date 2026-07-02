import { betterAuth } from 'better-auth';
import { PrismaService } from './prisma.service';

export const auth = betterAuth({
database: {}
});
