import { customAlphabet } from 'nanoid';
import { PrismaService } from '../prisma.service';
import { MyLoggerService } from '../logger.service';

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const generatePublicId = customAlphabet(alphabet, 6);

export async function generateUniquePublicId(
  data: any,
  prisma: PrismaService,
  logger: MyLoggerService,
) {
  for (let i = 0; i < 5; i++) {
    try {
      return await prisma.product.create({
        data: { ...data, publicId: generatePublicId() },
      });
    } catch (err) {
      if (err.code === 'P2002' && err.meta?.target?.includes('publicId')) {
        logger.warn(
          'Failed to generate unique public ID',
          'GENERATE_UNIQUE_PUBLIC_ID',
        );
        continue;
      }
      throw err;
    }
  }

  logger.error(
    'Failed to generate unique public ID after max attempts',
    '',
    'GENERATE_UNIQUE_PUBLIC_ID',
  );
  throw new Error('Failed to generate unique public ID after max attempts');
}

