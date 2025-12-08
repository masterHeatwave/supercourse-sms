import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { CustomActivityService } from './customActivity.service';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '@utils/logger';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { createClient } from 'pexels';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const client = createClient(PEXELS_API_KEY);

const OpenAIAPIKey = process.env.OPENAI_API_KEY;

if (!OpenAIAPIKey) {
  throw new Error('Missing OPENAI_API_KEY in environment variables.');
}

const openai = new OpenAI({
  organization: 'org-xeUWKKcIKeZ6d2LQArdRc02P',
  project: 'proj_FWhDQdvhRIDYqWy386KPLGGz',
  apiKey: OpenAIAPIKey,
});

export class CustomActivityController {
  private customActivityService: CustomActivityService;

  constructor() {
    this.customActivityService = new CustomActivityService();
  }

  getActivities = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const activities = await this.customActivityService.getActivities();

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activities,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getActivityById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const activity = await this.customActivityService.getActivityById(activityId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getSinglePlayerActivitiesByUserIdTag = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, tag } = req.params;
      const activity = await this.customActivityService.getSinglePlayerActivitiesByUserIdTag(userId, tag);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  saveActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const activityObject = req.body;
      const response = await this.customActivityService.saveActivity(activityObject);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: response,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  updateActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const activityObject = req.body;

      const response = await this.customActivityService.updateActivity(activityId, activityObject);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: response,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  deleteActivityById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const response = await this.customActivityService.deleteActivityById(activityId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: response,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getCustomActivitiesByUserID = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId } = req.params;
      const activities = await this.customActivityService.getCustomActivitiesByUserID(userId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activities,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getPublicActivitiesExcludingUserId = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId } = req.params;
      const activities = await this.customActivityService.getPublicActivitiesExcludingUserId(userId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activities,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: error.status || StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  duplicateActivityById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const response = await this.customActivityService.duplicateActivityById(activityId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: response,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  duplicatePublicActivityById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId, userId } = req.params;
      const response = await this.customActivityService.duplicatePublicActivityById(activityId, userId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: response,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getStudentActivities = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId } = req.params;
      const activities = await this.customActivityService.getStudentActivities(userId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activities,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getStudentActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { userId, activityId } = req.params;
      const activities = await this.customActivityService.getStudentActivity(userId, activityId);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activities,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getAssignedActivities = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const activities = await this.customActivityService.getAssignedActivities();

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activities,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  createAssignedActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const { students, classId, assignmentBundle } = req.body;
      const activity = await this.customActivityService.createAssignedActivity(
        activityId,
        students,
        classId,
        assignmentBundle
      );

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  addStudentsToAssignedActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const { students } = req.body;
      const activity = await this.customActivityService.addStudentsToAssignedActivity(activityId, students);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  removeStudentsFromAssignedActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const students = req.body;
      const activity = await this.customActivityService.removeStudentsFromAssignedActivity(activityId, students);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  updateAssignedActivityStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { activityId, studentId } = req.params;
      const { status } = req.body;
      const activity = await this.customActivityService.updateAssignedActivityStatus(activityId, studentId, status);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  updateAssignedTaskAnswers = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { assignmentId, studentId, customActivityId } = req.params;
      const answers = req.body;
      const activity = await this.customActivityService.updateAssignedTaskAnswers(
        assignmentId,
        studentId,
        customActivityId,
        answers
      );

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  updateActivityPlays = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    console.log('PATCHING PLAYS of PARAMS', req.params);
    console.log('PATCHING PLAYS of BODY', req.body);
    try {
      const { activityId } = req.params;
      const { duration } = req.body;
      const activity = await this.customActivityService.updateActivityPlays(activityId, duration);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: activity,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  getAssignedTaskAnswers = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { assignmentId, studentId, customActivityId } = req.params;
      const answers = await this.customActivityService.getAssignedTaskAnswers(
        assignmentId,
        studentId,
        customActivityId
      );

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: answers,
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: error.message,
          },
        },
      });
    }
  });

  saveImage = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const publicPath = path.join(process.cwd(), 'public');
      const mediaPath = path.join(publicPath, 'media/custom-activities');
      fs.ensureDirSync(mediaPath);

      if (!req.files || Object.keys(req.files).length === 0) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          message: 'No files were uploaded',
          success: false,
        });
      }
      const mediaFiles = req.files.media;
      let mediaFile;

      if (Array.isArray(mediaFiles)) {
        mediaFile = mediaFiles[0];
      } else {
        mediaFile = mediaFiles;
      }

      if (!mediaFile) {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          message: 'No media file found',
          success: false,
        });
      }

      const timestamp = Date.now();
      const newFilename = `${timestamp}-${mediaFile.name.replace(/\s+/g, '-').toLowerCase()}`;

      const destPath = path.join(mediaPath, newFilename);

      await fs.copy(mediaFile.tempFilePath, destPath);

      await fs.remove(mediaFile.tempFilePath);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: {
          path: `media/custom-activities/${newFilename}`,
          filename: newFilename,
          originalname: mediaFile.name,
          mimetype: mediaFile.mimetype,
        },
        success: true,
        message: 'File uploaded successfully',
      });
    } catch (error) {
      //logger.error(`Error uploading file: ${error}`);
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while uploading file',
        success: false,
      });
    }
  });

  deleteImage = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { url } = req.body; // full URL from Mongo

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required',
      });
    }

    try {
      // Convert full URL to local filesystem path
      const parsedUrl = new URL(url);
      let relativePath = parsedUrl.pathname; // e.g., /public/media/custom-activities/image1.png

      if (relativePath.startsWith('/public/')) {
        relativePath = relativePath.replace('/public/', '');
      }

      const fullPath = path.join(process.cwd(), 'public', relativePath);

      // Security: only allow deletion inside custom-activities folder
      const basePath = path.join(process.cwd(), 'public/media/custom-activities');

      if (!fullPath.startsWith(basePath)) {
        return jsonResponse(res, { status: StatusCodes.FORBIDDEN, success: false, message: 'Unauthorized file path' });
      }

      await fs.remove(fullPath);

      return jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        message: 'File deleted successfully',
      });
    } catch (err) {
      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        data: {
          error: {
            message: err,
          },
        },
      });
    }
  });

  generateFromAI = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const prompt = req.body.query;
    console.log('prompt', prompt);

    try {
      const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt,
        n: 1,
        size: '512x512',
      });

      const imagesData: string | null =
        response.data && response.data.length > 0 ? (response.data[0].url ?? null) : null;

      if (imagesData) {
        return jsonResponse(res, { status: StatusCodes.OK, success: true, data: { imagesData } });
      } else {
        return jsonResponse(res, {
          status: StatusCodes.OK,
          success: false,
          message: 'No images were generated based on the provided prompt.',
        });
      }
    } catch (error: any) {
      if (error.response) {
        console.error(error.response.status, error.response.data);
      } else {
        console.error(error.message);
      }

      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'An error occurred while generating images.',
        data: { error: error.message },
      });
    }
  });

  findOnPexels = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const query = req.body.query;

      const data: any = await client.photos.search({
        query,
        orientation: 'landscape',
      });

      if (data.photos.length > 0) {
        return jsonResponse(res, {
          status: StatusCodes.OK,
          success: true,
          data: { imagesData: data.photos, restData: data },
        });
      } else {
        return jsonResponse(res, {
          status: StatusCodes.OK,
          success: false,
          message: 'No images were found. Please try searching again.',
        });
      }
    } catch (error: any) {
      if (error.response) {
        console.error(`Pexels API Error: ${error.response.status} - ${error.response.data}`);
      } else {
        console.error(`Error: ${error.message}`);
      }

      return jsonResponse(res, {
        status: StatusCodes.BAD_REQUEST,
        success: false,
        message: error.message,
      });
    }
  });

  uploadFromURL = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return jsonResponse(res, {
          status: StatusCodes.BAD_REQUEST,
          message: 'No files were uploaded',
          success: false,
        });
      }

      const response = await axios.get(url, { responseType: 'arraybuffer' });

      // Determine file extension from content-type or URL
      const contentType = response.headers['content-type'];
      const ext = contentType?.split('/')[1] || path.extname(url).split('.').pop() || 'jpg';

      // Generate a unique filename
      const fileName = `${uuidv4()}.${ext}`;
      const saveDir = path.resolve('public/media/custom-activities');

      // Make sure folder exists
      fs.mkdirSync(saveDir, { recursive: true });

      // Save the image
      const savePath = path.join(saveDir, fileName);
      fs.writeFileSync(savePath, response.data);

      // Construct a public-facing URL (if your Express app serves /public)
      const publicPath = `/media/custom-activities/${fileName}`;

      // Respond with success and file info
      /*res.status(200).json({
        message: 'Image downloaded successfully.',
        fileName,
        path: publicPath,
      });*/

      return jsonResponse(res, {
        status: StatusCodes.OK,
        data: {
          message: 'Image downloaded successfully.',
          fileName,
          path: publicPath,
        },
        success: true,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      return jsonResponse(res, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while uploading file',
        success: false,
      });
    }
  });
}
