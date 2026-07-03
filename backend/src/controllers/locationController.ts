import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAllLocations } from '../utils/locationValidator.js';

export const getLocations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: getAllLocations(),
  });
});
