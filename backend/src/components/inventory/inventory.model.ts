import mongoose, { Schema } from 'mongoose';
import { IInventory } from './inventory.interface';
import toJson from '../../plugins/toJson';
import { advancedResultsPlugin } from '@plugins/advancedResults';
import { IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { createdBy, ICreatorModel } from '@plugins/createdBy';
import { notificationPlugin } from '@plugins/notifications';

const InventorySchema: Schema<IInventory> = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allow null users for existing data compatibility
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    billing_date: {
      type: Date,
      required: [true, 'Please add a billing date'],
    },
    return_date: {
      type: Date,
    },
    notes: {
      type: String,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Please add a customer'],
    },
    item_type: {
      type: String,
      enum: ['ASSET', 'ELIBRARY'],
      required: [true, 'Please specify the item type'],
      default: 'ASSET',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate a unique 6-character code before validation if missing
InventorySchema.pre('validate', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = this;
  if (doc.code) return next();

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous chars
  const gen = () => Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

  let tries = 0;
  while (tries < 10) {
    const candidate = gen();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exists = await (doc.constructor as any).exists({ code: candidate });
    if (!exists) {
      doc.code = candidate;
      break;
    }
    tries++;
  }

  if (!doc.code) {
    // fallback to timestamp-based suffix if collisions persist
    doc.code = `INV${Date.now().toString().slice(-6)}`;
  }

  next();
});

InventorySchema.plugin(toJson);
InventorySchema.plugin(advancedResultsPlugin);
InventorySchema.plugin(createdBy);
InventorySchema.plugin(notificationPlugin, [
  {
    action: 'create',
    title: (doc: IInventory) => `New Inventory item ${doc.title} has been created`,
  },
]);

export default mongoose.model<
  IInventory,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IAdvancedResultsModel<any> & ICreatorModel<IInventory>
>('Inventory', InventorySchema);

export { InventorySchema };
