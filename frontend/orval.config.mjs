import { SOCKET_BASE_URL, API_SCHEMA_URL } from './src/app/config/endpoints';
import dotenv from 'dotenv';

dotenv.config();

export default {
  'api-transfomer': {
    output: {
      mode: 'tags-split',
      target: './src/app/gen-api/api-types.ts',
      schemas: './src/app/gen-api/schemas',
      mock: false,
      client: 'angular',
      baseUrl: SOCKET_BASE_URL,
      auth: {
        type: 'bearer',
        name: 'Authorization',
        scheme: 'Bearer',
        in: 'header'
      }
    },
    input: {
      target: API_SCHEMA_URL
    }
  }
};
