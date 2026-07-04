import { Injectable, LoggerService } from '@nestjs/common';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const transportOptions = {
  file: new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    auditFile: path.join(logDir, 'audit.json'),
    format: format.combine(format.timestamp(), format.json()),
  }),
  console: new transports.Console({
    format: format.combine(
      format.colorize(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message, context }) => {
        return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}`;
      }),
    ),
  }),
};

// Export the underlying Winston instance so external modules can use it
export const winstonInstance = createLogger({
  level: 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [transportOptions.file, transportOptions.console],
  exceptionHandlers: [transportOptions.file, transportOptions.console],
  exitOnError: false,
});

@Injectable()
export class MyLoggerService implements LoggerService {
  log(message: string, context?: string) {
    winstonInstance.info(message, { context });
  }
  error(message: string, trace?: string, context?: string) {
    winstonInstance.error(message, { trace, context });
  }
  warn(message: string, context?: string) {
    winstonInstance.warn(message, { context });
  }
  debug(message: string, context?: string) {
    winstonInstance.debug(message, { context });
  }
  verbose(message: string, context?: string) {
    winstonInstance.verbose(message, { context });
  }
}
