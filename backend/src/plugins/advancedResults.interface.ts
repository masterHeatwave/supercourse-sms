import mongoose, { Document } from 'mongoose';

export interface IAdvancedPopulateOption {
  path: string;
  model?: mongoose.Model<any>;
  populate?: IAdvancedPopulateOption | IAdvancedPopulateOption[];
  select?: string;
}

export interface IAdvancedResultsOptions {
  page?: string;
  limit?: string;
  sort?: string;
  select?: string;
  populate?: string | IAdvancedPopulateOption[];
  query?: string;
  is_active?: string;
  archived?: string;
  branch?: string;
  role?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides?: Record<string, any>;
}

export interface IAdvancedResultsResponse<T extends Document> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface IAdvancedResultsModel<T extends Document> extends mongoose.Model<T> {
  advancedResults(options?: IAdvancedResultsOptions): Promise<IAdvancedResultsResponse<T>>;
}
