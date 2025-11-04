import { Request, Response } from 'express';
import morgan from 'morgan';
import { logger } from '@utils/logger';

const format = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  contentLength: ':res[content-length]',
  responseTime: ':response-time',
  userAgent: ':user-agent',
  errorMessage: ':errorMessage',
});

export const httpSuccessLogger = morgan(format, {
  stream: {
    write: (message) => {
      const { method, url, status, contentLength, responseTime } = JSON.parse(message);

      console.log(method, url, status);
      logger.info('HTTP Access Log', {
        timestamp: new Date().toString(),
        method,
        url,
        status: Number(status),
        contentLength,
        responseTime: Number(responseTime),
      });
    },
  },
  skip: (req, res) => res.statusCode >= 400,
});
morgan.token('errorMessage', (req: Request, res: Response) => res.locals.errorMessage);

export const httpErrorLogger = morgan(format, {
  stream: {
    write: (message) => {
      const { method, url, status, contentLength, responseTime, errorMessage } = JSON.parse(message);

      logger.error(`${errorMessage || 'HTTP Error Log'} :`, {
        timestamp: new Date().toString(),
        method,
        url,
        status: Number(status),
        contentLength,
        responseTime: Number(responseTime),
        message: errorMessage,
      });
    },
  },
  skip: (req, res) => res.statusCode < 400,
});
