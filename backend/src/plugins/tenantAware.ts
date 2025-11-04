import mongoose, { Schema } from 'mongoose';
import { requestContextLocalStorage } from '@config/asyncLocalStorage';

declare module 'mongoose' {
  interface MongooseStatic {
    tenantAwarePluginApplied?: boolean;
  }
}

function pluralizeCollectionName(name: string): string {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  if (name.endsWith('y') && name.length > 1 && !vowels.includes(name.charAt(name.length - 2).toLowerCase())) {
    return name.slice(0, -1) + 'ies';
  } else if (!name.endsWith('s')) {
    return name + 's';
  }
  return name;
}

export function tenantAwarePlugin(schema: Schema) {
  const originalModel = mongoose.model;

  if (!(mongoose as unknown as { tenantAwarePluginApplied?: boolean }).tenantAwarePluginApplied) {
    (mongoose as unknown as { tenantAwarePluginApplied?: boolean }).tenantAwarePluginApplied = true;

    (mongoose as any).model = function tenantAwareModel(name: string, schema?: Schema, collection?: string) {
      if (!schema) {
        return originalModel.call(this, name);
      }

      const model = originalModel.call(this, name, schema, collection);

      return new Proxy(model as any, {
        get(target, prop, receiver) {
          // For specific methods that need to be tenant-aware
          if (
            prop === 'find' ||
            prop === 'findOne' ||
            prop === 'findById' ||
            prop === 'findOneAndUpdate' ||
            prop === 'findByIdAndUpdate' ||
            prop === 'findOneAndDelete' ||
            prop === 'findByIdAndDelete' ||
            prop === 'create' ||
            prop === 'insertMany' ||
            prop === 'updateOne' ||
            prop === 'updateMany' ||
            prop === 'deleteOne' ||
            prop === 'deleteMany' ||
            prop === 'countDocuments' ||
            prop === 'aggregate'
          ) {
            return function (...args: unknown[]) {
              const tenantId = requestContextLocalStorage.getStore();
              let baseCollectionName = schema.get('collection') as string | undefined;

              if (!baseCollectionName) {
                baseCollectionName = name.toLowerCase();
                baseCollectionName = pluralizeCollectionName(baseCollectionName);
              }

              const finalCollectionName = tenantId ? `${tenantId}_${baseCollectionName}` : baseCollectionName;
              const tenantModel = mongoose.connection.model(name, schema, finalCollectionName);
              return (tenantModel as any)[prop as string](...args);
            };
          }

          return Reflect.get(target, prop, receiver);
        },
      });
    };
  }
}
