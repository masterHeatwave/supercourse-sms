import { NextFunction, Request, Response } from 'express';

export interface acceptFunction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (_req: Request, _res: Response, _next: NextFunction): any;
}
