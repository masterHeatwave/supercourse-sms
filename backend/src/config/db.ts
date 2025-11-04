import mongoose from 'mongoose';
import { config } from '@config/config';
import { logger } from '@utils/logger';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGO_URI, {
      // user: config.MONGO_USER,
      // pass: config.MONGO_PASSWORD,
      // useNewUrlParser: true,
      // useUnifiedTopology: true
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    logger.error(`Error: ${error}`);
  }
};
