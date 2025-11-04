// src/components/messaging/controllers/reaction.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { ReactionService } from '../services/reactions.service';
import { addReactionSchema } from '../messaging-validate.schema';

export class ReactionController {
  private reactionService: ReactionService;

  constructor(reactionService: ReactionService) {
    this.reactionService = reactionService;
  }

  /**
   * Add a reaction to a message
   * POST /messaging/messages/:id/reactions
   */
  addReaction = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { emoji } = addReactionSchema.parse(req.body);
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    const reaction = await this.reactionService.addReaction(req.params.id, userId, emoji);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: reaction,
    });
  });

  /**
   * Remove a reaction from a message
   * DELETE /messaging/messages/:id/reactions
   */
  removeReaction = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const emoji = (req.query.emoji as string) || '';
    const userId = req.user?._id?.toString();

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    const result = await this.reactionService.removeReaction(req.params.id, userId, emoji);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: result,
    });
  });
}