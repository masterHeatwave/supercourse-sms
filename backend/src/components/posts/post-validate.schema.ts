import 'zod-openapi/extend';
import { z } from 'zod';
import { PostStatus } from './post.interface';

export const PostSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    author: z.string(),
    tags: z.array(z.string()).optional(),
    status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED]),
    featured_image: z.string().optional(),
    published_at: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi({
    title: 'Post',
    description: 'Post model',
  });

export const createPostSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(200, { message: 'Title cannot be more than 200 characters' }),
    content: z.string().min(1, { message: 'Content is required' }),
    author: z.string().min(1, { message: 'Author is required' }),
    tags: z.array(z.string()).optional(),
    status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED]).optional(),
    featured_image: z.string().optional(),
  })
  .openapi({
    title: 'CreatePost',
    description: 'Schema for creating a new post',
  });

export const updatePostSchema = z
  .object({
    id: z.string().min(1, { message: 'ID is required' }),
    title: z
      .string()
      .min(1, { message: 'Title is required' })
      .max(200, { message: 'Title cannot be more than 200 characters' })
      .optional(),
    content: z.string().min(1, { message: 'Content is required' }).optional(),
    author: z.string().min(1, { message: 'Author is required' }).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED]).optional(),
    featured_image: z.string().optional(),
  })
  .openapi({
    title: 'UpdatePost',
    description: 'Schema for updating an existing post',
  });

export const queryPostSchema = z
  .object({
    author: z.string().optional(),
    status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED]).optional(),
    tag: z.string().optional(),
    search: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    featured: z.string().optional(),
  })
  .openapi({
    title: 'QueryPost',
    description: 'Schema for querying posts',
  });

export const addTagSchema = z
  .object({
    post_id: z.string().min(1, { message: 'Post ID is required' }),
    tag: z.string().min(1, { message: 'Tag is required' }),
  })
  .openapi({
    title: 'AddTagToPost',
    description: 'Schema for adding a tag to a post',
  });

export const removeTagSchema = z
  .object({
    post_id: z.string().min(1, { message: 'Post ID is required' }),
    tag: z.string().min(1, { message: 'Tag is required' }),
  })
  .openapi({
    title: 'RemoveTagFromPost',
    description: 'Schema for removing a tag from a post',
  });
