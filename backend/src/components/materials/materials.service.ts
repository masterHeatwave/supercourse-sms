import axios from 'axios';
import { config } from '@config/config';
import Customer from '@components/customers/customer.model';
import { ErrorResponse } from '@utils/errorResponse';
import { logger } from '@utils/logger';

export class MaterialsService {
  private async fetchProductsFromSupercourse(supercourseSubCustomerId: string): Promise<any[]> {
    const url = `${config.SUPERCOURSE_API_URL}/v1/internal/product/assigned-to-customer/${supercourseSubCustomerId}`;
    logger.info(`Querying supercourse-api at: ${url}`);

    logger.info('SMS API sending request with:', {
      url: url,
      apiKey: config.API_KEY,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.API_KEY,
      },
    });

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.API_KEY,
      },
      timeout: 5000,
    });

    logger.info(`Supercourse-api response:`, {
      success: response.data.success,
      dataLength: response.data.data ? response.data.data.length : 0,
      data: response.data.data,
    });

    if (!response.data.success) {
      logger.error('Supercourse-api returned success: false');
      throw new ErrorResponse('Failed to fetch assigned products', 500);
    }

    // Transform supercourse products to materials format expected by SMS frontend
    const materials = response.data.data.map((product: any) => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
    }));

    logger.info(`Transformed materials:`, materials);
    return materials;
  }

  async getAssignedMaterials(branchCustomerId: string): Promise<any[]> {
    try {
      logger.info(`Materials Service: Looking for branch customer with ID: ${branchCustomerId}`);

      // Find the branch customer in SMS system
      const branchCustomer = await Customer.findById(branchCustomerId);
      if (!branchCustomer) {
        logger.error(`Branch customer not found with ID: ${branchCustomerId}`);
        throw new ErrorResponse('Branch customer not found', 404);
      }

      logger.info(`Found branch customer:`, {
        id: branchCustomer._id,
        name: branchCustomer.name,
        slug: branchCustomer.slug,
        supercourse_sub_customer_id: branchCustomer.supercourse_sub_customer_id,
        is_main_customer: branchCustomer.is_main_customer,
      });

      // If this is a main customer, look for its branch
      if (branchCustomer.is_main_customer) {
        logger.info(`This is a main customer, looking for its branch...`);
        const branchCustomers = await Customer.find({
          parent_customer: branchCustomer._id,
          is_main_customer: false,
        });
        logger.info(`Found ${branchCustomers.length} branch customers for main customer ${branchCustomer.name}`);

        if (branchCustomers.length > 0) {
          // Use the first branch customer if available
          const firstBranch = branchCustomers[0];
          logger.info(`Using first branch customer:`, {
            id: firstBranch._id,
            name: firstBranch.name,
            slug: firstBranch.slug,
            supercourse_sub_customer_id: firstBranch.supercourse_sub_customer_id,
          });

          if (firstBranch.supercourse_sub_customer_id) {
            logger.info(`Branch has supercourse link, fetching products...`);
            return this.fetchProductsFromSupercourse(firstBranch.supercourse_sub_customer_id);
          } else {
            logger.warn(
              `Branch customer ${firstBranch._id} (${firstBranch.name}) has no linked supercourse sub-customer`
            );
          }
        }
      }

      // Check if this branch has a linked supercourse sub-customer
      if (!branchCustomer.supercourse_sub_customer_id) {
        // If no link, return empty array (no assigned products)
        logger.warn(
          `Branch customer ${branchCustomerId} (${branchCustomer.name}) has no linked supercourse sub-customer`
        );
        return [];
      }

      // Query supercourse-api for products assigned to this sub-customer
      return this.fetchProductsFromSupercourse(branchCustomer.supercourse_sub_customer_id);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        logger.error('Cannot connect to Supercourse API');
        throw new ErrorResponse('Cannot connect to Supercourse API', 503);
      }
      if (error.code === 'ENOTFOUND') {
        logger.error('Supercourse API hostname could not be resolved');
        throw new ErrorResponse('Supercourse API service unavailable', 503);
      }
      if (error instanceof ErrorResponse) {
        throw error;
      }
      logger.error('Failed to fetch assigned materials:', error.message);
      throw new ErrorResponse(`Failed to fetch assigned materials: ${error.message}`, 500);
    }
  }
}
