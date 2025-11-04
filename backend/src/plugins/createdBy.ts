import { Schema, Document, Types } from 'mongoose';

export interface ICreatorDocument extends Document {
  createdBy: Types.ObjectId;
}

export interface ICreatorModel<T extends Document> {
  setCreator(userId: Types.ObjectId | string): Promise<T>;
}

export const createdBy = (schema: Schema) => {
  // Add createdBy field to schema
  schema.add({
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  });

  // Add static method to set creator
  schema.methods.setCreator = async function (userId: Types.ObjectId | string) {
    this.createdBy = userId;
    return await this.save();
  };
};
