import { Request, Response, NextFunction } from 'express';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { logger } from '@utils/logger';

const sanitizeDbName = (slug: string): string => {
  return slug.toLowerCase().replace(/[/."$ ]/g, '_');
};

export const customerContextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const customerSlug = req.headers['x-customer-slug'] as string | undefined;
  let tenantId: string | undefined = undefined;

  if (customerSlug) {
    const sanitizedSlug = sanitizeDbName(customerSlug);
    tenantId = sanitizedSlug; // This will be our tenant identifier
    logger.debug(`Customer context: Tenant ID set to '${tenantId}' for slug '${customerSlug}'`);
  } else {
    logger.debug('Customer context: No customer slug provided, using default/no tenant context.');
  }

  // Store only the tenantId (or undefined) in AsyncLocalStorage
  requestContextLocalStorage.run(tenantId, () => {
    next();
  });
};
