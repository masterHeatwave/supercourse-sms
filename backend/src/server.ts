import http from 'http';
import { config } from '@config/config';
import { connectDB } from '@config/db';
import { app } from './app';
import { initializeSocket } from '@config/socket';
import { logger } from '@utils/logger';
import { seedDatabase } from '@config/seeder';
import { setupMessagingSocket } from '@components/messaging/messaging.routes';

const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = config.PORT;
    const server = http.createServer(app);
    
    const io = initializeSocket(server);
    setupMessagingSocket(io);
    
    server.listen(PORT, () => {
      logger.info(`Server is listening on port ${PORT}`);
    });
    
    await seedDatabase();

    process.on('unhandledRejection', (error: Error) => {
      logger.error('Unhandled Rejection:', error);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();