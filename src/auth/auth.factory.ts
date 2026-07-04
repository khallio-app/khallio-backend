import crypto from 'crypto';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins';
import { PrismaService } from 'src/lib/prisma.service';
import { EmailService } from 'src/email/email.service';
import 'dotenv/config';
import { winstonInstance } from 'src/lib/logger.service';

export function createAuth(prisma: PrismaService, emailService: EmailService) {
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
    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ email, otp, type }) => {
          await emailService.sendVerificationEmail({
            email,
            otp,
            type,
          });
        },
        sendVerificationOnSignUp: true,
        otpLength: 6,
        expiresIn: 900,
      }),
    ],
    advanced: {
      crossSubDomainCookies: { enabled: true },
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 2,
      },
    },
    databaseHooks: {},
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
          case 'info':
          default:
            winstonInstance.info(message, meta);
            break;
        }
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
