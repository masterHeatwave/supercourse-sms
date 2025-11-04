import mongoose from 'mongoose';
import { tenantAwarePlugin } from '@plugins/tenantAware';

/**
 * Initialize the tenant-aware plugin for the entire application.
 * This should be called once during application startup, before any models are registered.
 */
export function initializeTenantAwarePlugin() {
  // Apply the tenant-aware plugin to all schemas by default
  tenantAwarePlugin(mongoose.Schema.prototype);

  console.log('Tenant-aware plugin initialized successfully');
}
