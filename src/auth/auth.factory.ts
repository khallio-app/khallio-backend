// auth.factory.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from 'src/lib/prisma.service';
import 'dotenv/config';

export function createAuth(prisma: PrismaService) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.FRONTEND_URL!],
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      crossSubDomainCookies: { enabled: true },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
