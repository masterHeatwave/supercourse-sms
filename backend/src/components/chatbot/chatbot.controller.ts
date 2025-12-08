import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';
import { ChatbotService } from './chatbot.service';
export class ChatbotController {
  private chatbotService: ChatbotService;

  constructor() {
    this.chatbotService = new ChatbotService();
  }

  getChatbotMessage = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { message } = req.body;
      const data = await this.chatbotService.getChatbotMessage(message);

      jsonResponse(res, {
        status: StatusCodes.OK,
        success: true,
        data: data,
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
