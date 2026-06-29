import { Role } from './generated/prisma/enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};
