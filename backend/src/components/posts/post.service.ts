import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import User from '@components/users/user.model';
import mongoose from 'mongoose';
import { IPostCreateDTO, IPostUpdateDTO, PostStatus, IPostVoteDTO } from './post.interface';
import Post from './post.model';
import PostVote from './post-vote.model';
import { PostNotificationService } from './post.notification.service';

export class PostService {
  private notificationService = new PostNotificationService();
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
    const queryConditions: any = {};

    if (filters.author) {
      queryConditions.author = filters.author;
    }

    if (filters.status) {
      queryConditions.status = filters.status;
    }

    if (filters.tag) {
      queryConditions.tags = filters.tag;
    }

    if (filters.search) {
      queryConditions.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.from_date || filters.to_date) {
      const fromDate = filters.from_date ? new Date(filters.from_date) : null;
      const toDate = filters.to_date ? new Date(filters.to_date) : null;

      if (filters.status === PostStatus.PUBLISHED) {
        queryConditions.published_at = {};
        if (fromDate && !isNaN(fromDate.getTime())) {
          queryConditions.published_at.$gte = fromDate;
        }
        if (toDate && !isNaN(toDate.getTime())) {
          queryConditions.published_at.$lte = toDate;
        }
      } else {
        queryConditions.createdAt = {};
        if (fromDate && !isNaN(fromDate.getTime())) {
          queryConditions.createdAt.$gte = fromDate;
        }
        if (toDate && !isNaN(toDate.getTime())) {
          queryConditions.createdAt.$lte = toDate;
        }
      }
    }

    if (filters.featured === 'true') {
      queryConditions.featured_image = { $exists: true };
    } else if (filters.featured === 'false') {
      queryConditions.featured_image = { $exists: false };
    }

    const posts = await Post.find(queryConditions)
      .populate({
        path: 'author',
        model: User,
        select: 'firstname lastname email username',
      })
      .sort({ createdAt: -1 })
      .exec();

    return posts;
  }

  async getPostById(id: string) {
    const post = await Post.findById(id)
      .populate({
        path: 'author',
        model: User,
        select: 'firstname lastname email username',
      })
      .exec();

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

    // Set default values for new fields
    const postCreateData = {
      ...postData,
      priority: postData.priority !== undefined ? postData.priority : 'normal',
      pinned: postData.pinned !== undefined ? postData.pinned : false,
      recipients: postData.recipients || { branches: [], taxis: [], users: [] },
      allow_reactions: postData.allow_reactions !== undefined ? postData.allow_reactions : true,
    };

    const post = await Post.create(postCreateData);
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

    const wasPublished = postDoc.status === PostStatus.PUBLISHED;
    const willBePublished = postData.status === PostStatus.PUBLISHED;

    if (willBePublished && !wasPublished) {
      postData.published_at = new Date();
    }

    // Handle poll deletion - if poll is explicitly set to null, remove it using $unset
    const updateData: any = { ...postData };
    let unsetPoll = false;

    if (postData.poll === null) {
      // Remove poll from update data and mark it for unsetting
      delete updateData.poll;
      unsetPoll = true;

      // Delete all votes associated with this post when poll is removed
      await PostVote.deleteMany({ post: id });
    }

    // Build update query
    const updateQuery: any = { ...updateData };
    if (unsetPoll) {
      updateQuery.$unset = { poll: 1 };
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
    });

    const postId = updatedPost?._id ? (updatedPost._id as any).toString() : id;
    const result = await this.getPostById(postId);

    // Send notification if post was just published
    if (willBePublished && !wasPublished) {
      try {
        await this.notificationService.sendPostNotification(result);
      } catch (error) {
        console.error('Error sending post notification:', error);
        // Don't fail the update if notification fails
      }
    }

    return result;
  }

  async deletePost(id: string) {
    const post = await Post.findById(id);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    // Delete all votes associated with this post
    await PostVote.deleteMany({ post: id });

    // Delete the post
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

    const result = await this.getPostById(id);

    // Send notification
    try {
      await this.notificationService.sendPostNotification(result);
    } catch (error) {
      console.error('Error sending post notification:', error);
      // Don't fail the publish if notification fails
    }

    return result;
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

  async voteOnPoll(postId: string, userId: string, voteData: IPostVoteDTO) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    if (!post.poll) {
      throw new ErrorResponse('This post does not have a poll', StatusCodes.BAD_REQUEST);
    }

    // Check if user already voted
    const existingVote = await PostVote.findOne({ post: postId, user: userId });
    if (existingVote) {
      throw new ErrorResponse('You have already voted on this poll', StatusCodes.BAD_REQUEST);
    }

    // Validate option IDs
    const validOptionIds = post.poll.options.map((option: any) => option.id);
    const invalidOptions = voteData.optionIds.filter((id) => !validOptionIds.includes(id));
    if (invalidOptions.length > 0) {
      throw new ErrorResponse('Invalid poll options', StatusCodes.BAD_REQUEST);
    }

    // Check if multiple votes are allowed
    if (!post.poll.allowMultiple && voteData.optionIds.length > 1) {
      throw new ErrorResponse('Multiple votes are not allowed for this poll', StatusCodes.BAD_REQUEST);
    }

    // Create vote record
    await PostVote.create({
      post: postId,
      user: userId,
      optionIds: voteData.optionIds,
    });

    // Update vote counts
    for (const optionId of voteData.optionIds) {
      const option = post.poll.options.find((opt: any) => opt.id === optionId);
      if (option) {
        option.voteCount += 1;
      }
    }

    await post.save();
    return await this.getPostById(postId);
  }

  async getPollResults(postId: string, userId?: string) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    if (!post.poll) {
      throw new ErrorResponse('This post does not have a poll', StatusCodes.BAD_REQUEST);
    }

    const totalVotes = post.poll.options.reduce((sum: number, option: any) => sum + option.voteCount, 0);

    // Check if user has voted (if userId is provided)
    let userVoted = false;
    let userVoteOptions: string[] = [];
    if (userId) {
      const userVote = await PostVote.findOne({ post: postId, user: userId });
      if (userVote) {
        userVoted = true;
        userVoteOptions = userVote.optionIds;
      }
    }

    return {
      question: post.poll.question,
      allowMultiple: post.poll.allowMultiple,
      options: post.poll.options,
      closed_at: post.poll.closed_at,
      totalVotes,
      userVoted,
      userVoteOptions,
    };
  }

  async forcePublishPost(id: string) {
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

    const result = await this.getPostById(id);

    // Send notification
    try {
      await this.notificationService.sendPostNotification(result);
    } catch (error) {
      console.error('Error sending post notification:', error);
      // Don't fail the publish if notification fails
    }

    return result;
  }

  async likePost(postId: string, userId: string) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    // Convert userId to ObjectId
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Check if user already liked the post
    if (post.likedBy && post.likedBy.some((id: any) => id.toString() === userId)) {
      throw new ErrorResponse('You have already liked this post', StatusCodes.BAD_REQUEST);
    }

    // Add user ID to likedBy array
    if (!post.likedBy) {
      post.likedBy = [];
    }
    post.likedBy.push(userIdObj);
    await post.save();

    return await this.getPostById(postId);
  }

  async unlikePost(postId: string, userId: string) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ErrorResponse('Post not found', StatusCodes.NOT_FOUND);
    }

    // Check if user has liked the post
    if (!post.likedBy || !post.likedBy.some((id: any) => id.toString() === userId)) {
      throw new ErrorResponse('You have not liked this post', StatusCodes.BAD_REQUEST);
    }

    // Remove user ID from likedBy array
    post.likedBy = post.likedBy.filter((id: any) => id.toString() !== userId);
    await post.save();

    return await this.getPostById(postId);
  }
}
