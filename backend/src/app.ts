import cookieParser from 'cookie-parser';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';

import { mainRouter } from '@routes/v1/routes';
import { config } from '@config/config';
import { httpSuccessLogger } from '@middleware/httpLogger';
import errorHandler from '@middleware/error';
import { zodErrorHandler } from '@utils/zodError';
import { openApiDocument } from '@config/openapi';
import { customerContextMiddleware } from '@middleware/customerContext';
import { useTempStorage } from '@middleware/tempStorage';

export const app: Express = express();

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: 'Too many requests from this IP, please try again later.',
// });

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: '*', // Allow all origins in development
    credentials: true,
    methods: ['*'],
    allowedHeaders: ['*'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  })
);

if (config.NODE_ENV === 'development') {
  app.use(httpSuccessLogger);
}

app.use(customerContextMiddleware);
app.use(useTempStorage);

// Configure static file serving with proper headers
const staticOptions = {
  setHeaders: (res: Response) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  },
};

const publicPaths = ['uploads/public', 'public'];
publicPaths.forEach((publicPath) => {
  app.use('/public', express.static(path.resolve(process.cwd(), publicPath), staticOptions));
});

app.get('/', (_req: Request, res: Response) => {
  res.status(StatusCodes.FORBIDDEN).send();
});

// Mount Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Add route to serve the Swagger schema JSON
app.get('/schema', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiDocument);
});

// Mount routes
app.use('/v1', mainRouter);

// define health check route
app.get('/ping', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ pong: 'pong' });
});

app.use(zodErrorHandler);
app.use(errorHandler);

// Initialize staff academic assignments signals
import '@components/staff-academic-assignments';
