import { FilterQuery } from 'mongoose';
import mongoose from 'mongoose';
import Customer from './customer.model';
import { CustomerType, ICustomer, ICustomerCreateDTO, ICustomerUpdateDTO } from './customer.interface';
import { ErrorResponse } from '@utils/errorResponse';
import { AcademicYearService } from '@components/academic/academic-years.service';
import AcademicYear from '@components/academic/academic-years.model';

export class CustomerService {
  private academicYearService: AcademicYearService;

  constructor() {
    this.academicYearService = new AcademicYearService();
  }

  private async addActiveAcademicYear(customer: ICustomer): Promise<any> {
    try {
      // Get the current active academic year (prioritizes date-derived, falls back to manually set)
      const activeAcademicYear = await this.academicYearService.getCurrentAcademicYear();
      // Get the manually activated academic year
      const manualActiveAcademicYear = await this.academicYearService.getManualActiveAcademicYear();

      return {
        ...customer.toObject(),
        active_academic_year: activeAcademicYear,
        manual_active_academic_year: manualActiveAcademicYear,
      };
    } catch (error) {
      return {
        ...customer.toObject(),
        active_academic_year: null,
        manual_active_academic_year: null,
      };
    }
  }

  async getMainCustomer(): Promise<any> {
    const customer = await Customer.findOne({ is_main_customer: true });
    if (!customer) {
      throw new ErrorResponse('Main customer not found', 404);
    }

    // Add the active academic year to the customer object
    return await this.addActiveAcademicYear(customer);
  }

  async getAllCustomers(query: FilterQuery<ICustomer> = {}, option = {}): Promise<ICustomer[]> {
    return Customer.find(query, {}, option);
  }

  async getCustomerById(id: string): Promise<any> {
    const customer = await Customer.findById(id).populate(['administrator', 'manager']);
    if (!customer) {
      throw new ErrorResponse('Customer not found', 404);
    }

    // Add the active academic year to the customer object
    return await this.addActiveAcademicYear(customer);
  }

  async getCustomerBySlug(slug: string): Promise<any> {
    const customer = await Customer.findOne({ slug }).populate(['administrator', 'manager']);
    if (!customer) {
      throw new ErrorResponse('Customer not found', 404);
    }

    // Add the active academic year to the customer object
    return await this.addActiveAcademicYear(customer);
  }

  async createCustomer(customerData: ICustomerCreateDTO): Promise<ICustomer> {
    // Check if slug is unique
    const existingCustomer = await Customer.findOne({ slug: customerData.slug });
    if (existingCustomer) {
      throw new ErrorResponse('A customer with this slug already exists', 400);
    }
    return Customer.create(customerData);
  }

  async updateCustomer(id: string, customerData: ICustomerUpdateDTO): Promise<ICustomer | null> {
    // Check if slug is unique if it's being updated
    if (customerData.slug) {
      const existingCustomer = await Customer.findOne({ slug: customerData.slug, _id: { $ne: id } });
      if (existingCustomer) {
        throw new ErrorResponse('A customer with this slug already exists', 400);
      }
    }
    const customer = await Customer.findByIdAndUpdate(id, customerData, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      throw new ErrorResponse('Customer not found', 404);
    }
    return customer;
  }

  async updateMainCustomer(customerData: Partial<ICustomerUpdateDTO>): Promise<ICustomer | null> {
    // Find the main customer first
    const mainCustomer = await Customer.findOne({ is_main_customer: true });
    if (!mainCustomer) {
      throw new ErrorResponse('Main customer not found', 404);
    }

    // Check if slug is unique if it's being updated
    if (customerData.slug) {
      const existingCustomer = await Customer.findOne({
        slug: customerData.slug,
        _id: { $ne: mainCustomer._id },
      });
      if (existingCustomer) {
        throw new ErrorResponse('A customer with this slug already exists', 400);
      }
    }

    // Update the main customer
    const updatedCustomer = await Customer.findByIdAndUpdate(mainCustomer._id, customerData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) {
      throw new ErrorResponse('Failed to update main customer', 500);
    }

    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw new ErrorResponse('Customer not found', 404);
    }
    await Customer.deleteOne({ _id: id });
  }

  async setAdministrator(customerId: string, userId: string): Promise<any> {
    const customer = await Customer.findByIdAndUpdate(customerId, { administrator: userId }, { new: true });
    if (!customer) {
      throw new ErrorResponse('Customer not found', 404);
    }
    return await this.addActiveAcademicYear(customer);
  }

  async setManager(customerId: string, userId: string): Promise<any> {
    const customer = await Customer.findByIdAndUpdate(customerId, { manager: userId }, { new: true });
    if (!customer) {
      throw new ErrorResponse('Customer not found', 404);
    }
    return await this.addActiveAcademicYear(customer);
  }

  async getCustomersByType(customerType: CustomerType): Promise<ICustomer[]> {
    return Customer.find({ customer_type: customerType });
  }

  async getMainCustomersPublic(): Promise<Array<{ name: string; slug: string; avatar?: string }>> {
    const db = mongoose.connection.db;

    if (!db) {
      throw new ErrorResponse('Database connection not available', 500);
    }

    // Get all collection names from the database
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col: any) => col.name);

    // Extract unique prefixes (school names) from collection names
    const schoolPrefixes = new Set<string>();

    for (const collectionName of collectionNames) {
      // Check if collection name contains underscore
      if (collectionName.includes('_')) {
        const prefix = collectionName.split('_')[0];
        // Add prefix if it's not empty and not a system collection
        if (prefix && !prefix.startsWith('system')) {
          schoolPrefixes.add(prefix);
        }
      }
    }

    // Convert to array and sort
    const schools = Array.from(schoolPrefixes)
      .sort()
      .map((slug) => ({
        name: slug
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        slug: slug,
      }));

    return schools;
  }
}
