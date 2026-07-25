import { Request, Response, NextFunction } from 'express';

interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose CastError (invalid ObjectId, e.g. "me" or bad string)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  console.error(`[${new Date().toISOString()}] Error (${statusCode}):`, message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
