import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import User from '@components/users/user.model';
import { IPostCreateDTO, IPostUpdateDTO, PostStatus } from './post.interface';
import Post from './post.model';

export class PostService {
  async getAllPosts(
    filters: {
      author?: string;
      status?: PostStatus;
      tag?: string;
      search?: string;
      from_date?: string;
      to_date?: string;
      featured?: string;
    } = {}
  ) {
    let query = Post.find().populate('author', 'name email position').sort({ createdAt: -1 });

    if (filters.author) {
      query = query.where('author', filters.author);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.tag) {
      query = query.where('tags', filters.tag);
    }

    if (filters.search) {
      query = query.where({
        $or: [
          { title: { $regex: filters.search, $options: 'i' } },
          { content: { $regex: filters.search, $options: 'i' } },
        ],
      });
    }

    if (filters.from_date) {
      const fromDate = new Date(filters.from_date);
      if (!isNaN(fromDate.getTime())) {
        if (filters.status === PostStatus.PUBLISHED) {
          query = query.where('published_at').gte(fromDate as any);
        } else {
          query = query.where('createdAt').gte(fromDate as any);
        }
      }
    }

    if (filters.to_date) {
      const toDate = new Date(filters.to_date);
      if (!isNaN(toDate.getTime())) {
        if (filters.status === PostStatus.PUBLISHED) {
          query = query.where('published_at').lte(toDate as any);
        } else {
          query = query.where('createdAt').lte(toDate as any);
        }
      }
    }

    if (filters.featured === 'true') {
      query = query.where('featured_image').exists(true);
    } else if (filters.featured === 'false') {
      query = query.where('featured_image').exists(false);
    }

    return await query.exec();
  }

  async getPostById(id: string) {
    const post = await Post.findById(id).populate('author', 'name email position');

    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    return post;
  }

  async createPost(postData: IPostCreateDTO) {
    const author = await User.findById(postData.author);
    if (!author) {
      throw new ErrorResponse('Author not found', StatusCodes.NOT_FOUND);
    }

    const post = await Post.create(postData);
    return await this.getPostById((post._id as any).toString()); // Convert _id
  }

  async updatePost(id: string, postData: IPostUpdateDTO) {
    const postDoc = await Post.findById(id);
    if (!postDoc) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    if (postData.author) {
      const author = await User.findById(postData.author);
      if (!author) {
        throw new ErrorResponse('Author not found', StatusCodes.NOT_FOUND);
      }
    }

    if (postData.status === PostStatus.PUBLISHED && postDoc.status !== PostStatus.PUBLISHED) {
      postData.published_at = new Date();
    }

    const updatedPost = await Post.findByIdAndUpdate(id, postData, {
      new: true,
      runValidators: true,
    });

    const postId = updatedPost?._id ? (updatedPost._id as any).toString() : id;
    return await this.getPostById(postId);
  }

  async deletePost(id: string) {
    const post = await Post.findById(id);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }
    await post.deleteOne();
    return null;
  }

  async addTag(postId: string, tag: string) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    if (post.tags.includes(tag)) {
      throw new ErrorResponse('Tag already exists in this post', StatusCodes.BAD_REQUEST);
    }

    post.tags.push(tag);
    await post.save();

    return await this.getPostById(postId);
  }

  async removeTag(postId: string, tag: string) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    if (!post.tags.includes(tag)) {
      throw new ErrorResponse('Tag not found in this post', StatusCodes.BAD_REQUEST);
    }

    post.tags = post.tags.filter((t: string) => t !== tag);
    await post.save();

    return await this.getPostById(postId);
  }

  async publishPost(id: string) {
    const post = await Post.findById(id);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    if (post.status === PostStatus.PUBLISHED) {
      throw new ErrorResponse('Post is already published', StatusCodes.BAD_REQUEST);
    }

    post.status = PostStatus.PUBLISHED;
    post.published_at = new Date();
    await post.save();

    return await this.getPostById(id);
  }

  async archivePost(id: string) {
    const post = await Post.findById(id);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    if (post.status === PostStatus.ARCHIVED) {
      throw new ErrorResponse('Post is already archived', StatusCodes.BAD_REQUEST);
    }

    post.status = PostStatus.ARCHIVED;
    await post.save();

    return await this.getPostById(id);
  }
}
