import ErrorSchema from '@components/error/error.model';
import { IErrorCreateDTO } from '@components/error/error.interface';
import axios from 'axios';
import { logger } from '@utils/logger';
import { config } from '@config/config';

const sendToGoogleChat = async (title: string, message: string, statusCode: number) => {
  const webhookUrl = config.GOOGLE_CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.error('Google Chat webhook URL is not configured');
    return;
  }

  const formattedMessage = {
    cards: [
      {
        header: {
          title: 'Error Notification',
        },
        sections: [
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Title',
                  content: title,
                },
              },
              {
                keyValue: {
                  topLabel: 'Message',
                  content: message,
                },
              },
              {
                keyValue: {
                  topLabel: 'Status Code',
                  content: statusCode.toString(),
                },
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    await axios.post(webhookUrl, formattedMessage);
    logger.info('Error notification sent to Google Chat');
  } catch (error) {
    logger.error('Failed to send error notification to Google Chat:', error);
  }
};

const create = async (data: IErrorCreateDTO) => {
  const error = await ErrorSchema.create(data);
  // sendToGoogleChat(error.title, error.message, error.statusCode);

  return error;
};

export default {
  create,
  sendToGoogleChat,
};
