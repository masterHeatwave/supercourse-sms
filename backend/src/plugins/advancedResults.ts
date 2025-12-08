import { Schema, Document, Types } from 'mongoose';
import {
  IAdvancedResultsOptions,
  IAdvancedResultsResponse,
  IAdvancedPopulateOption,
} from '@plugins/advancedResults.interface';

export function advancedResultsPlugin<T extends Document>(schema: Schema<T>) {
  schema.statics.advancedResults = async function (
    options: IAdvancedResultsOptions = {}
  ): Promise<IAdvancedResultsResponse<T>> {
    const defaultOptions: Required<Omit<IAdvancedResultsOptions, 'populate'>> & { populate: string } = {
      page: '1',
      limit: '20',
      sort: '-1',
      select: '',
      populate: '',
      query: '',
      is_active: '',
      archived: '',
      branch: '',
      role: '',
      overrides: {},
    };

    const parsedOptions = {
      page: parseInt(options?.page?.toString() ?? defaultOptions.page, 10),
      limit: parseInt(options?.limit?.toString() ?? defaultOptions.limit, 10),
      sort: options?.sort ?? defaultOptions.sort,
      select: options?.select ?? defaultOptions.select,
      populate: options?.populate ?? defaultOptions.populate,
      query: options?.query ?? defaultOptions.query,
    };

    const opts = { ...parsedOptions };

    // Parse and build advanced query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let searchQuery: any = { ...options.overrides };

    // Handle branch filtering
    if (options?.branch && options.branch.trim() !== '') {
      searchQuery.branches = { $in: [options.branch] };
    }
    if (opts.query) {
      try {
        const parsedQuery = typeof opts.query === 'string' ? JSON.parse(decodeURIComponent(opts.query)) : opts.query;

        if (Array.isArray(parsedQuery)) {
          const queryConditions = parsedQuery.map((queryItem) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const conditions: any = {};

            Object.entries(queryItem).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                conditions[key] = { $in: value };
              } else if (typeof value === 'string') {
                const schemaPath = this.schema.path(key);
                if (schemaPath && schemaPath.instance === 'ObjectId') {
                  if (Types.ObjectId.isValid(value)) {
                    conditions[key] = new Types.ObjectId(value);
                  }
                } else {
                  conditions[key] = { $regex: value, $options: 'i' };
                }
              } else {
                conditions[key] = value;
              }
            });

            return conditions;
          });

          // Combine the override conditions with the query conditions
          searchQuery = {
            $and: [
              { ...options.overrides }, // Include overrides in the $and array
              ...queryConditions,
            ],
          };
        }
      } catch (error) {
        console.error('Query parsing error:', error);
      }
    }

    let queryStage = this.find(searchQuery);

    if (opts.select) {
      queryStage = queryStage.select(opts.select.split(',').join(' '));
    }

    if (opts.sort) {
      queryStage = queryStage.sort(opts.sort);
    }

    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const skip = (page - 1) * limit;

    queryStage = queryStage.skip(skip).limit(limit);

    if (opts.populate) {
      if (typeof opts.populate === 'string') {
        // Handle string-based populate (backward compatibility)
        opts.populate.split(',').forEach((populateOption) => {
          queryStage = queryStage.populate({
            path: populateOption.trim(),
          });
        });
      } else if (Array.isArray(opts.populate)) {
        // Handle object-based populate with model references
        opts.populate.forEach((populateOption: IAdvancedPopulateOption) => {
          const populateConfig: any = {
            path: populateOption.path,
          };

          if (populateOption.model) {
            populateConfig.model = populateOption.model;
          }

          if (populateOption.populate) {
            populateConfig.populate = populateOption.populate;
          }

          if (populateOption.select) {
            populateConfig.select = populateOption.select;
          }

          queryStage = queryStage.populate(populateConfig);
        });
      }
    }

    const results = await queryStage.exec();
    const total = await this.countDocuments(searchQuery).exec();

    // Check if the schema has createdBy field and canEdit method
    const hasCreatedBy = schema.path('createdBy');
    const hasCanEdit = typeof schema.methods.canEdit === 'function';

    let enhancedResults = results;
    if (hasCreatedBy && hasCanEdit) {
      enhancedResults = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.map(async (doc: any) => {
          const docObject = doc.toObject();
          docObject.canEdit = await doc.canEdit();

          // Handle nested documents if they exist and have canEdit method
          for (const [key, value] of Object.entries(docObject)) {
            if (Array.isArray(value) && value.length > 0 && value[0]?.createdBy) {
              for (const nestedDoc of doc[key]) {
                if (typeof nestedDoc.canEdit === 'function') {
                  const nestedCanEdit = await nestedDoc.canEdit();
                  const index = docObject[key].findIndex(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (item: any) => item._id.toString() === nestedDoc._id.toString()
                  );
                  if (index !== -1) {
                    docObject[key][index].canEdit = nestedCanEdit;
                  }
                }
              }
            }
          }

          return docObject;
        })
      );
    }

    return {
      results: enhancedResults,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    };
  };
}
