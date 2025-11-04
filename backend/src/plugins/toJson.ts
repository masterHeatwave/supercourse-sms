import { config } from '@config/config';

/**
 * A mongoose schema plugin which applies the following in the toJSON transform call:
 *  - removes __v and any path that has private: true
 *  - replaces _id with id
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const deleteAtPath = (obj: Record<string, any>, path: string[], index: number): void => {
  if (index === path.length - 1) {
    delete obj[path[index]];
    return;
  }
  deleteAtPath(obj[path[index]], path, index + 1);
};

const toJson = (schema: any): void => {
  let transform: ((_doc: any, _ret: any, _options: any) => any) | undefined;
  if (schema.options.toJSON && schema.options.toJSON.transform) {
    transform = schema.options.toJSON.transform;
  }

  schema.options.toJSON = {
    ...schema.options.toJSON,
    transform(doc: any, ret: any, options: any) {
      Object.keys(schema.paths).forEach((path) => {
        if (schema.paths[path].options && schema.paths[path].options.private) {
          deleteAtPath(ret, path.split('.'), 0);
        }

        // add images public url
        if (schema.paths[path].options && schema.paths[path].options.fileUrlSetup) {
          ret[path] = ret[path] ? `${config.UPLOADS.PUBLIC_PATH}/${ret[path]}` : '';
        }

        // add images on gallery public url
        if (schema.paths[path].options && schema.paths[path].options.galleryUrlSetup) {
          ret.gallery = ret.gallery.map((gal: string) => `${config.UPLOADS.PUBLIC_PATH}/${gal}`);
        }
      });

      // Only try to convert _id to id if _id exists
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;
      if (transform) {
        return transform(doc, ret, options);
      }
    },
  };
};

export default toJson;
