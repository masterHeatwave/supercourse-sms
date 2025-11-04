import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import Mood, { MoodVideo } from './mood.model';

export class MoodService {
  async getAllMoods() {
    const moods = await Mood.find();

    return moods;
  }

  async getMoodsByUserIdClassId(userId: string, classId: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }
    if (!classId) {
      throw new ErrorResponse('Wrong class or class missing.', StatusCodes.BAD_REQUEST);
    }

    const moods = await Mood.find({ userId: userId, taxisId: classId });

    if (moods.length > 0) {
      return { haveMoods: true, moods };
    } else {
      return { haveMoods: false }; // classes };
    }
  }

  async getMoodById(id: string) {
    if (!id) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }
    const mood = await Mood.findById(id);

    return mood;
  }

  async getMoodByUserId(userId: string) {
    const moods = await Mood.find({ userId });

    if (moods.length > 0) {
      return { haveMoods: true, moods };
    } else {
      return { haveMoods: false }; // classes };
    }
  }

  async saveMood(userId: string, academic_subperiod: string, taxisId: string, date: Date, mood: string) {
    if (!userId) {
      throw new ErrorResponse('Wrong user or user missing.', StatusCodes.BAD_REQUEST);
    }

    if (!academic_subperiod) {
      throw new ErrorResponse('Wrong semester or semester missing.', StatusCodes.BAD_REQUEST);
    }

    if (!taxisId) {
      throw new ErrorResponse('Wrong class or class missing.', StatusCodes.BAD_REQUEST);
    }

    if (!date) {
      throw new ErrorResponse('Wrong date or date missing.', StatusCodes.BAD_REQUEST);
    }

    if (!mood) {
      throw new ErrorResponse('Wrong mood or mood missing.', StatusCodes.BAD_REQUEST);
    }

    const newMood = new Mood({
      userId,
      academic_subperiod,
      taxisId,
      date,
      mood,
    });

    return await Mood.create(newMood);
  }

  async getVideosByType(type: string) {
    console.log('type', type);
    if (!type) {
      throw new ErrorResponse('Wrong video type or type missing.', StatusCodes.BAD_REQUEST);
    }

    return await MoodVideo.find({ type: type });
  }

  async getVideosById(id: string) {
    if (!id) {
      throw new ErrorResponse('Wrong video id or id missing.', StatusCodes.BAD_REQUEST);
    }

    return await MoodVideo.findById(id);
  }

  async getBestVideos() {
    const topVideos = await MoodVideo.find().sort({ viewCount: -1 }).limit(5);
    return topVideos;
  }

  async registerView(videoItemId: string) {
    if (!videoItemId) {
      throw new ErrorResponse('Wrong video id or id missing.', StatusCodes.BAD_REQUEST);
    }
    const updatedVideo = await MoodVideo.findOneAndUpdate(
      { _id: videoItemId },
      { $inc: { viewCount: 1 } },
      { new: true, upsert: true }
    );

    return updatedVideo;
  }
}
