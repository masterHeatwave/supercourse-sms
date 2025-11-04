import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import { IInventoryCreateDTO, IInventoryUpdateDTO } from './inventory.interface';
import User from '@components/users/user.model';
import Customer from '@components/customers/customer.model';
import Inventory from './inventory.model';
import mongoose from 'mongoose';

export class InventoryService {
  async getAllInventoryItems(
    filters: {
      user?: string;
      customer?: string;
      search?: string;
      from_date?: string;
      to_date?: string;
      returned?: string;
      item_type?: 'ASSET' | 'ELIBRARY';
    } = {}
  ) {
    let query = Inventory.find().sort({ billing_date: -1 });

    // Apply filters
    if (filters.user) {
      query = query.where('user', filters.user);
    }

    if (filters.customer) {
      query = query.where('customer', filters.customer);
    }

    if (filters.item_type) {
      query = query.where('item_type', filters.item_type);
    }

    // Search by title or notes
    if (filters.search && filters.search !== 'undefined') {
      query = query.where({
        $or: [
          { title: { $regex: filters.search, $options: 'i' } },
          { notes: { $regex: filters.search, $options: 'i' } },
        ],
      });
    }

    // Filter by billing date range
    if (filters.from_date) {
      const fromDate = new Date(filters.from_date);
      if (!isNaN(fromDate.getTime())) {
        query = query.where('billing_date').gte(fromDate as any);
      }
    }

    if (filters.to_date) {
      const toDate = new Date(filters.to_date);
      if (!isNaN(toDate.getTime())) {
        query = query.where('billing_date').lte(toDate as any);
      }
    }

    // Filter by returned status
    if (filters.returned === 'true') {
      // Items that have a return date
      query = query.where('return_date').exists(true);
    } else if (filters.returned === 'false') {
      // Items that don't have a return date
      query = query.where('return_date').exists(false);
    }

    const inventoryItems = await query.exec();

    // Manually populate user and customer for each item to ensure tenant context
    const populatedItems = await Promise.all(
      inventoryItems.map(async (item) => {
        let user = null;

        if (item.user) {
          if (typeof item.user === 'string' || (typeof item.user === 'object' && item.user.toString)) {
            // User is a string ID or ObjectId, need to populate
            const userId = item.user.toString();
            try {
              // Try to find user in the global users collection (bypass tenant-aware plugin)
              const globalUserModel = mongoose.connection.model('User', User.schema, 'users');
              user = await globalUserModel.findById(userId).select('firstname lastname email username code');

              if (!user) {
                // Try in the current tenant's collection
                user = await User.findById(userId).select('firstname lastname email username code');
              }
            } catch (error) {
              user = null;
            }
          } else if (typeof item.user === 'object' && item.user._id && item.user.firstname) {
            // User is already populated (has user data)
            user = item.user;
          }
        }

        const customer = await Customer.findById(item.customer).select('name slug nickname email code customer_type');

        return {
          ...item.toObject(),
          user: user as any,
          customer: customer as any,
        };
      })
    );

    return populatedItems;
  }

  async getInventoryItemById(id: string) {
    const inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
      throw new ErrorResponse('Inventory item not found', StatusCodes.NOT_FOUND);
    }

    // Manually populate user and customer to ensure tenant context
    let user = null;
    if (inventoryItem.user) {
      if (
        typeof inventoryItem.user === 'string' ||
        (typeof inventoryItem.user === 'object' && inventoryItem.user.toString)
      ) {
        // User is a string ID or ObjectId, need to populate
        const userId = inventoryItem.user.toString();
        try {
          // Try to find user in the global users collection (bypass tenant-aware plugin)
          const globalUserModel = mongoose.connection.model('User', User.schema, 'users');
          user = await globalUserModel.findById(userId).select('firstname lastname email username code');

          if (!user) {
            // Try in the current tenant's collection
            user = await User.findById(userId).select('firstname lastname email username code');
          }
        } catch (error) {
          user = null;
        }
      } else if (typeof inventoryItem.user === 'object' && inventoryItem.user._id && inventoryItem.user.firstname) {
        // User is already populated (has user data)
        user = inventoryItem.user;
      }
    }

    const customer = await Customer.findById(inventoryItem.customer).select(
      'name slug nickname email code customer_type'
    );

    // Create a new object with populated data
    const populatedItem = {
      ...inventoryItem.toObject(),
      user: user as any,
      customer: customer as any,
    };

    return populatedItem;
  }

  async createInventoryItem(inventoryData: IInventoryCreateDTO) {
    try {
      // Validate user reference if provided
      if (inventoryData.user) {
        if (typeof inventoryData.user !== 'string') {
          throw new ErrorResponse('Invalid user ID provided', StatusCodes.BAD_REQUEST);
        }

        const user = await User.findById(inventoryData.user);
        if (!user) {
          throw new ErrorResponse(`User with ID ${inventoryData.user} not found`, StatusCodes.NOT_FOUND);
        }
      }

      // Validate customer reference with better error handling
      if (!inventoryData.customer || typeof inventoryData.customer !== 'string') {
        throw new ErrorResponse('Invalid customer ID provided', StatusCodes.BAD_REQUEST);
      }

      const customer = await Customer.findById(inventoryData.customer);
      if (!customer) {
        throw new ErrorResponse(`Customer with ID ${inventoryData.customer} not found`, StatusCodes.NOT_FOUND);
      }

      const inventoryItem = await Inventory.create(inventoryData);

      return await this.getInventoryItemById((inventoryItem._id as any).toString());
    } catch (error) {
      // Re-throw the error to ensure it's not swallowed
      throw error;
    }
  }

  async updateInventoryItem(id: string, inventoryData: IInventoryUpdateDTO) {
    const inventoryItemDoc = await Inventory.findById(id);

    if (!inventoryItemDoc) {
      throw new ErrorResponse('Inventory item not found', StatusCodes.NOT_FOUND);
    }

    // Validate user reference if provided
    if (inventoryData.user) {
      const user = await User.findById(inventoryData.user);
      if (!user) {
        throw new ErrorResponse('User not found', StatusCodes.NOT_FOUND);
      }
    }

    // Validate customer reference if provided
    if (inventoryData.customer) {
      const customer = await Customer.findById(inventoryData.customer);
      if (!customer) {
        throw new ErrorResponse('Customer not found', StatusCodes.NOT_FOUND);
      }
    }

    const updatedItem = await Inventory.findByIdAndUpdate(id, inventoryData, {
      new: true,
      runValidators: true,
    });

    const itemId = updatedItem?._id ? (updatedItem._id as any).toString() : id;
    return await this.getInventoryItemById(itemId);
  }

  async deleteInventoryItem(id: string) {
    const inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
      throw new ErrorResponse('Inventory item not found', StatusCodes.NOT_FOUND);
    }

    await inventoryItem.deleteOne();
    return null;
  }

  async markAsReturned(id: string) {
    const inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
      throw new ErrorResponse('Inventory item not found', StatusCodes.NOT_FOUND);
    }

    if (inventoryItem.return_date) {
      throw new ErrorResponse('Inventory item already marked as returned', StatusCodes.BAD_REQUEST);
    }

    inventoryItem.return_date = new Date();
    await inventoryItem.save();

    return await this.getInventoryItemById(id);
  }
}
