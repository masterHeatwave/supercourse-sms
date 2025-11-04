import { Response } from 'express';

export const jsonResponse = (
  res: Response,
  {
    status,
    error,
    data,
    message,
    success,
    count,
    warnings,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: {
    status: number;
    error?: string | object;
    data?: any[] | any;
    message?: string;
    success?: boolean;
    count?: number;
    warnings?: string[];
  } = {
    status: 200,
  }
) => {
  const suc = success !== undefined ? success : true;

  res.status(status).send({
    error,
    data,
    message,
    success: suc,
    status,
    ...(count !== undefined && { count }),
    ...(warnings !== undefined && { warnings }),
  });
};
