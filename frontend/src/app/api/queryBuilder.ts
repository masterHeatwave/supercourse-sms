import { QueryItem } from '@interfaces/api-response';

export const queryBuilder = (data: QueryItem[]) => {
  if (Object.keys(data).length === 0) {
    return '';
  }
  return JSON.stringify(data);
};
