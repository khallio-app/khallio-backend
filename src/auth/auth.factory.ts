import crypto from 'crypto';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins';
import { PrismaService } from 'src/lib/prisma.service';
import { EmailService } from 'src/email/email.service';
import 'dotenv/config';
import { winstonInstance } from 'src/lib/logger.service';
import { createAuthMiddleware, APIError } from 'better-auth/api';

// Escalation ladder — index 0 fires on the 1st time we see a 429, etc.
// Once you hit the last entry (60 min), it stays at 60 min on every
// subsequent 429 rather than continuing to escalate.
const LOCKOUT_DELAYS_MINUTES = [1, 5, 15, 60];

async function getUserAndAccount(prisma: PrismaService, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { user: null, account: null };

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  });

  return { user, account };
}

export function createAuth(prisma: PrismaService, emailService: EmailService) {
  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.FRONTEND_URL!],
    emailAndPassword: { enabled: true },
    rateLimit: { enabled: true, trustedProxies: ['X-Forwarded-For'] },
    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ email, otp, type }) => {
          await emailService.sendVerificationEmail({ email, otp, type });
        },
        otpLength: 6,
        expiresIn: 900,
      }),
    ],
    advanced: {
      crossSubDomainCookies: { enabled: true },
      crossOrigin: true,
      database: { generateId: () => crypto.randomUUID() },
      ipAddress: {
        trustedProxies: ['127.0.0.1', '::1'],
        ipAddressHeaders: ['x-forwarded-for'],
      },
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
    hooks: {
      // Still runs on every attempt — blocks the request while an
      // existing lockout window hasn't expired yet.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;

        const body = ctx.body as { email?: string };
        const email = body?.email?.trim().toLowerCase();
        if (!email) return;

        const { account } = await getUserAndAccount(prisma, email);

        if (
          account?.lockoutUntil &&
          new Date(account.lockoutUntil) > new Date()
        ) {
          const minutesLeft = Math.ceil(
            (new Date(account.lockoutUntil).getTime() - Date.now()) / 60000,
          );
          throw new APIError('FORBIDDEN', {
            code: 'ACCOUNT_LOCKED',
            message: `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
          });
        }
      }),

      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') return;

        const body = ctx.body as { email?: string };
        const email = body?.email?.trim().toLowerCase();
        if (!email) return;

        const returned = ctx.context.returned as any;

        const isRateLimited =
          returned instanceof APIError && returned.status === 429;

        const { user, account } = await getUserAndAccount(prisma, email);
        if (!user || !account) return;

        if (isRateLimited) {
          const priorFailedCount = account.failedAttempts ?? 0;
          const newFailedCount = priorFailedCount + 1;

          // Cap the index so once we reach 60 min, it stays at 60 min
          // instead of erroring on an out-of-range array index.
          const delayMinutes =
            LOCKOUT_DELAYS_MINUTES[
              Math.min(newFailedCount - 1, LOCKOUT_DELAYS_MINUTES.length - 1)
            ];
          const lockoutUntil = new Date(Date.now() + delayMinutes * 60_000);

          const result = await prisma.account.update({
            where: { id: account.id },
            data: { failedAttempts: newFailedCount, lockoutUntil },
          });

          winstonInstance.warn('Rate limit hit — lockout applied', {
            context: 'BetterAuth',
            email,
            accountId: result.id,
            failedAttempts: result.failedAttempts,
            lockoutMinutes: delayMinutes,
            lockoutUntil: result.lockoutUntil,
          });
        } else if (!(returned instanceof APIError)) {
          // successful sign-in — reset counters
          if (account.failedAttempts || account.lockoutUntil) {
            await prisma.account.update({
              where: { id: account.id },
              data: { failedAttempts: 0, lockoutUntil: null },
            });
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
