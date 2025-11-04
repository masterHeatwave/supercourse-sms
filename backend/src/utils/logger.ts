import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '@config/config';

const options = {
  file: {
    level: 'warn',
    filename: './logs/%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    handleExceptions: true,
    json: true,
    maxsize: '5m', // 5MB
    maxFiles: '15d',
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    format: winston.format.simple(),
  },
};
const transport = new DailyRotateFile(options.file);

export const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [transport],
  exitOnError: false,
});

if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      ...options.console,
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}
