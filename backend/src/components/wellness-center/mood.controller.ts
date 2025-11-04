import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { MoodService } from './mood.service';
export class MoodController {
  private moodService: MoodService;

  constructor() {
    this.moodService = new MoodService();
  }

  getAllMoods = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const moods = await this.moodService.getAllMoods();

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: moods,
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getMoodByUserIdClassId = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, classId } = req.params;
      const moods = await this.moodService.getMoodsByUserIdClassId(userId, classId);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: moods,
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getMoodById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const id = req.params.id;
      const mood = await this.moodService.getMoodById(id);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: mood,
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getMoodByUserId = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId } = req.params;
      const moods = await this.moodService.getMoodByUserId(userId);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: moods,
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  saveMood = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, academic_subperiod, taxisId, date, mood } = req.body;

      const newMood = await this.moodService.saveMood(userId, academic_subperiod, taxisId, date, mood);

      jsonResponse(res, {
        status: StatusCodes.CREATED,
        success: true,
        data: newMood,
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getVideosByType = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const currentTenant = requestContextLocalStorage.getStore();
      const { videoType } = req.params;
      const moodVideos = await this.moodService.getVideosByType(videoType);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: { moodVideos: moodVideos },
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getVideoById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const currentTenant = requestContextLocalStorage.getStore();
      const { videoId } = req.params;
      const moodVideo = await this.moodService.getVideosById(videoId);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: { moodVideo },
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getBestVideos = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const bestVideos = await this.moodService.getBestVideos();

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: bestVideos,
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  registerView = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { videoId } = req.params;

      const updatedVideo = await this.moodService.registerView(videoId);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: updatedVideo,
      });
    } catch (error: any) {
      jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: true,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });
}
