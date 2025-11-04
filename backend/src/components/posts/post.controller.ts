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
import { IPostCreateDTO, IPostUpdateDTO } from './post.interface';

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
    const postData: IPostCreateDTO = createPostSchema.parse(req.body);
    const post = await this.postService.createPost(postData);

    jsonResponse(res, {
      status: StatusCodes.CREATED,
      success: true,
      data: post,
    });
  });

  updatePost = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const postData: IPostUpdateDTO = updatePostSchema.parse({
      id: req.params.id,
      ...req.body,
    });

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
}
