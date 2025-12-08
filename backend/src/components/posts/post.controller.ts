import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@middleware/async';
import { jsonResponse } from '@middleware/json-response';
import { StatusCodes } from 'http-status-codes';
import { PostService } from './post.service';
import {
  createPostSchema,
  updatePostSchema,
  queryPostSchema,
  addTagSchema,
  removeTagSchema,
} from './post-validate.schema';
import { IPostCreateDTO, IPostUpdateDTO, IPostVoteDTO } from './post.interface';

export class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  getAllPosts = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const queryParams = queryPostSchema.parse(req.query);
    const posts = await this.postService.getAllPosts(queryParams);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      count: posts.length,
      data: posts,
    });
  });

  getPostById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const post = await this.postService.getPostById(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
    });
  });

  createPost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const validatedData = createPostSchema.parse(req.body);

    // Convert string dates to Date objects
    const postData: IPostCreateDTO = {
      ...validatedData,
      scheduled_at: validatedData.scheduled_at ? new Date(validatedData.scheduled_at) : undefined,
      expires_at: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined,
      poll: validatedData.poll
        ? {
            ...validatedData.poll,
            closed_at: validatedData.poll.closed_at ? new Date(validatedData.poll.closed_at) : undefined,
          }
        : undefined,
    };

    const post = await this.postService.createPost(postData);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: post,
    });
  });

  updatePost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const validatedData = updatePostSchema.parse({
      id: req.params.id,
      ...req.body,
    });

    // Convert string dates to Date objects
    const postData: IPostUpdateDTO = {
      ...validatedData,
      scheduled_at: validatedData.scheduled_at ? new Date(validatedData.scheduled_at) : undefined,
      expires_at: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined,
      poll:
        validatedData.poll === null
          ? null
          : validatedData.poll
            ? {
                ...validatedData.poll,
                closed_at: validatedData.poll.closed_at ? new Date(validatedData.poll.closed_at) : undefined,
              }
            : undefined,
    };

    const post = await this.postService.updatePost(req.params.id, postData);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
    });
  });

  deletePost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await this.postService.deletePost(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: {},
      message: 'Post successfully deleted',
    });
  });

  addTag = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { post_id, tag } = addTagSchema.parse(req.body);
    const post = await this.postService.addTag(post_id, tag);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Tag successfully added to post',
    });
  });

  removeTag = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { post_id, tag } = removeTagSchema.parse(req.body);
    const post = await this.postService.removeTag(post_id, tag);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Tag successfully removed from post',
    });
  });

  publishPost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const post = await this.postService.publishPost(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Post successfully published',
    });
  });

  archivePost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const post = await this.postService.archivePost(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Post successfully archived',
    });
  });

  voteOnPoll = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const voteData: IPostVoteDTO = req.body;
    const userId = (req as any).user?.id; // Assuming user is attached to request by auth middleware

    if (!userId) {
      return jsonResponse(res, {
        status: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'User not authenticated',
      });
    }

    const post = await this.postService.voteOnPoll(req.params.id, userId, voteData);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Vote recorded successfully',
    });
  });

  getPollResults = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user?.id; // Get user ID from auth middleware
    const results = await this.postService.getPollResults(req.params.id, userId);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: results,
    });
  });

  forcePublishPost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const post = await this.postService.forcePublishPost(req.params.id);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Post successfully published',
    });
  });

  likePost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user?.id; // Get user ID from auth middleware

    if (!userId) {
      return jsonResponse(res, {
        status: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'User not authenticated',
      });
    }

    const post = await this.postService.likePost(req.params.id, userId);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Post liked successfully',
    });
  });

  unlikePost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user?.id; // Get user ID from auth middleware

    if (!userId) {
      return jsonResponse(res, {
        status: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'User not authenticated',
      });
    }

    const post = await this.postService.unlikePost(req.params.id, userId);

    jsonResponse(res, {
      status: StatusCodes.OK,
      success: true,
      data: post,
      message: 'Post unliked successfully',
    });
  });
}
