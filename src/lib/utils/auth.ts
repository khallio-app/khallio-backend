import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from 'generated/prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaPg } from '@prisma/adapter-pg';
import { emailOTP, organization } from 'better-auth/plugins';
import { z } from 'zod';
import { winstonInstance } from '../logger.service';
import * as crypto from 'crypto';
import { WalletQueueService } from 'src/queues/wallet/wallet.service';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.FRONTEND_URL!],
  rateLimit: { enabled: true },

  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        const { Queue } = await import('bullmq');
        const emailQueue = new Queue('email', {
          connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
          },
        });
        await emailQueue.add(
          'verification',
          { email, otp, type },
          {
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: 1000,
          },
        );
      },
      otpLength: 6,
      expiresIn: 900,
    }),
    organization({
      allowUserToCreateOrganization: async (user) => {
        return user.emailVerified === true;
      },
      schema: {
        organization: {
          additionalFields: {
            description: {
              type: 'string',
              required: false,
            },
            banner: {
              type: 'string',
              required: false,
            },
            location: {
              type: 'string',
              required: false,
            },
            socialLinks: {
              type: 'string[]',
              required: false,
              defaultValue: [],
              validator: {
                input: z.array(z.string()),
              },
            },
            slug: {
              type: 'string',
              required: true,
              validator: {
                input: z.string().length(19),
              },
            },
          },
        },
      },

      organizationHooks: {
        afterCreateOrganization: async ({ organization, member, user }) => {},
      },
    }),
  ],

  advanced: {
    crossSubDomainCookies: { enabled: true },
    crossOrigin: true,
    database: { generateId: () => crypto.randomUUID() },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 50 },
  },
  logger: {
    level: 'info',
    log: (level, message, ...args) => {
      const meta = args.length
        ? { metadata: args, context: 'BetterAuth' }
        : { context: 'BetterAuth' };
      switch (level) {
        case 'error':
          winstonInstance.error(message, meta);
          break;
        case 'warn':
          winstonInstance.warn(message, meta);
          break;
        case 'debug':
          winstonInstance.debug(message, meta);
          break;
        default:
          winstonInstance.info(message, meta);
          break;
      }
    },
  },
});
